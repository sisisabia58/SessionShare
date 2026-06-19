-- Migration: add account_slot to shared_session_cookies
-- Each row now represents a specific account slot (1-based integer) for a service.
-- Existing rows are migrated to slot 1 (the default).

ALTER TABLE public.shared_session_cookies
  ADD COLUMN IF NOT EXISTS account_slot INTEGER NOT NULL DEFAULT 1;

-- Enforce uniqueness: one active cookie row per (service, slot)
-- We use a partial unique index so historical/expired rows can share slot numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_cookies_service_slot_active
  ON public.shared_session_cookies (service_id, account_slot)
  WHERE is_active = TRUE;

-- Index for fast slot lookups
CREATE INDEX IF NOT EXISTS idx_cookies_service_slot
  ON public.shared_session_cookies (service_id, account_slot);
