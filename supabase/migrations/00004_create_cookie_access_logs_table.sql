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

ALTER TABLE public.cookie_access_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.cookie_access_logs IS 'Audit trail for all cookie access and injection events';
