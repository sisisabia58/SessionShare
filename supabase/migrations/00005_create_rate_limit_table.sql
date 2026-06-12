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

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limits IS 'Sliding window rate limit tracking per user per endpoint';
