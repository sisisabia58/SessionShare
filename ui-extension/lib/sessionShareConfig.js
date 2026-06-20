/**
 * SessionShare configuration constants.
 * These values connect the extension to its Supabase backend.
 */
export const SessionShareConfig = {
  // Supabase project credentials (public, safe for client-side)
  SUPABASE_URL: 'https://qohaalvaxkmtdpzdqahn.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaGFhbHZheGttdGRwemRxYWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQ1MzUsImV4cCI6MjA5NjgyMDUzNX0.NzkAFW1loA4TT26WaterHKa8wQbEcFc-YOQh43CBn9A',

  // API endpoints (Edge Functions)
  API_BASE: 'https://qohaalvaxkmtdpzdqahn.supabase.co/functions/v1',

  // Website Frontend URL
  WEBSITE_URL: 'https://sessionshare.web.id',

  // Rate limit info (display to user)
  COOKIE_RATE_LIMIT: 10, // per minute
};
