-- Migration: create orders table for Pakasir payment tracking

CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                  TEXT        NOT NULL CHECK (plan IN ('basic', 'premium', 'premium_phantom')),
  plan_display_name     TEXT        NOT NULL,  -- e.g. "Pro", "Pro + Phantom"
  quantity              INTEGER     NOT NULL DEFAULT 1,
  total_days            INTEGER     NOT NULL,  -- quantity * 30
  total_price           INTEGER     NOT NULL,  -- in IDR (Rupiah), no decimals
  pakasir_order_id      TEXT        UNIQUE,    -- order_id sent to / received from Pakasir
  pakasir_payment_number TEXT,                 -- QR string (payment_number) from Pakasir API
  pakasir_expired_at    TIMESTAMPTZ,           -- expiry time from Pakasir API
  status                TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_orders_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id   ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_pakasir_id ON public.orders (pakasir_order_id);

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "orders_select_own"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own orders (order created in pakasir-create Edge Function)
CREATE POLICY "orders_insert_own"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin updates are done via service_role (bypasses RLS).
-- No additional UPDATE policy needed for webhook or admin panel.
