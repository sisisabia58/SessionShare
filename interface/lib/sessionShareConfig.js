/**
 * SessionShare configuration constants.
 * These values connect the extension to its Supabase backend.
 */
export const SessionShareConfig = {
  // Supabase project credentials (public, safe for client-side)
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',

  // API endpoints (Edge Functions)
  API_BASE: 'https://YOUR_PROJECT.supabase.co/functions/v1',

  // Rate limit info (display to user)
  COOKIE_RATE_LIMIT: 10, // per minute
};
