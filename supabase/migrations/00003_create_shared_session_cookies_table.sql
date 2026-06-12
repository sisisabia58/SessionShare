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

ALTER TABLE public.shared_session_cookies ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.shared_session_cookies IS 'AES-256 encrypted session cookie payloads with rotation support';
