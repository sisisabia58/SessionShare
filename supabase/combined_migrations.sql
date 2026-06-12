-- ==========================================
-- SESSIONSHARE COMBINED DATABASE MIGRATIONS
-- ==========================================

-- 00001: CREATE USERS TABLE
CREATE TYPE user_role AS ENUM ('admin', 'member');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON public.users(email);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.users IS 'User profiles with role-based access control';


-- 00002: CREATE SERVICES TABLE
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  website_url TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_name ON public.services(name);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.services IS 'Premium web services available for session cookie sharing';


-- 00003: CREATE SHARED SESSION COOKIES TABLE
CREATE TABLE public.shared_session_cookies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  encrypted_cookie_data TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_shared_cookies_service_active
  ON public.shared_session_cookies(service_id, is_active, generated_at DESC);

CREATE INDEX idx_shared_cookies_expires
  ON public.shared_session_cookies(expires_at);

COMMENT ON TABLE public.shared_session_cookies IS 'AES-256 encrypted session cookie payloads with rotation support';


-- 00004: CREATE COOKIE ACCESS LOGS TABLE
CREATE TABLE public.cookie_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('access', 'inject', 'export', 'view')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_logs_user ON public.cookie_access_logs(user_id, created_at DESC);
CREATE INDEX idx_access_logs_service ON public.cookie_access_logs(service_id, created_at DESC);
CREATE INDEX idx_access_logs_created ON public.cookie_access_logs(created_at DESC);

COMMENT ON TABLE public.cookie_access_logs IS 'Audit trail for all cookie access and injection events';


-- 00005: CREATE RATE LIMIT TABLE
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_lookup
  ON public.rate_limits(user_id, endpoint, requested_at DESC);

CREATE INDEX idx_rate_limits_cleanup
  ON public.rate_limits(requested_at);

COMMENT ON TABLE public.rate_limits IS 'Sliding window rate limit tracking per user per endpoint';


-- 00006: RLS & ROLES POLICIES (RECURSION-SAFE)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_session_cookies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "users_update_admin" ON public.users FOR UPDATE USING (public.is_admin());

-- services policies
CREATE POLICY "services_select_authenticated" ON public.services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "services_insert_admin" ON public.services FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "services_update_admin" ON public.services FOR UPDATE USING (public.is_admin());
CREATE POLICY "services_delete_admin" ON public.services FOR DELETE USING (public.is_admin());

-- cookies policies
CREATE POLICY "cookies_select_authenticated" ON public.shared_session_cookies FOR SELECT USING (
  auth.role() = 'authenticated' AND is_active = true
);
CREATE POLICY "cookies_insert_admin" ON public.shared_session_cookies FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "cookies_update_admin" ON public.shared_session_cookies FOR UPDATE USING (public.is_admin());

-- logs policies
CREATE POLICY "logs_select_own" ON public.cookie_access_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_select_admin" ON public.cookie_access_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "logs_insert_own" ON public.cookie_access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- rate limits policies
CREATE POLICY "rate_limits_select_own" ON public.rate_limits FOR SELECT USING (auth.uid() = user_id);


-- SEED DATA FOR SERVICES
INSERT INTO public.services (id, name, website_url, icon_url) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ChatGPT', 'https://chat.openai.com', NULL),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Canva', 'https://www.canva.com', NULL),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Netflix', 'https://www.netflix.com', NULL),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Spotify', 'https://www.spotify.com', NULL),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Adobe Creative Cloud', 'https://www.adobe.com', NULL)
ON CONFLICT (name) DO NOTHING;
