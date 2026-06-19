-- Migration: add premium plan tracking to users table
-- Plans: free (default), basic (Rp 25k), premium (Rp 50k), premium_phantom (Rp 75k)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'basic', 'premium', 'premium_phantom')),
  ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;

-- Index for fast plan lookups (e.g. checking active premium users)
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users (plan);
CREATE INDEX IF NOT EXISTS idx_users_premium_until ON public.users (premium_until);

-- ── RLS Policies ──────────────────────────────────────────────────

-- Allow authenticated users to read their own plan status
CREATE POLICY IF NOT EXISTS "users_read_own_plan"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow service_role (used by Edge Functions) to update plan/premium_until
-- This is handled via the admin client (service_role key), which bypasses RLS.
-- No additional policy needed for admin writes since service_role skips RLS.
