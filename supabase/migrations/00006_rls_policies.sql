-- Security definer helper to prevent RLS recursion loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "users_update_admin" ON public.users FOR UPDATE USING (public.is_admin());

-- Services table policies
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_authenticated" ON public.services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "services_insert_admin" ON public.services FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "services_update_admin" ON public.services FOR UPDATE USING (public.is_admin());
CREATE POLICY "services_delete_admin" ON public.services FOR DELETE USING (public.is_admin());

-- Shared Session Cookies table policies
ALTER TABLE public.shared_session_cookies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cookies_select_authenticated" ON public.shared_session_cookies FOR SELECT USING (
  auth.role() = 'authenticated' AND is_active = true
);
CREATE POLICY "cookies_insert_admin" ON public.shared_session_cookies FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "cookies_update_admin" ON public.shared_session_cookies FOR UPDATE USING (public.is_admin());

-- Cookie Access Logs table policies
ALTER TABLE public.cookie_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_select_own" ON public.cookie_access_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_select_admin" ON public.cookie_access_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "logs_insert_own" ON public.cookie_access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rate Limits table policies
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_select_own" ON public.rate_limits FOR SELECT USING (auth.uid() = user_id);
