/**
 * Supabase client for the SessionShare Chrome extension.
 * Uses the Supabase JS v2 ESM bundle.
 *
 * NOTE: In MV3 extensions, we load from a local copy bundled
 * with the extension (no CDN in service workers).
 */
import { SessionShareConfig } from './sessionShareConfig.js';

let _supabaseClient = null;

/**
 * Get or create the Supabase client singleton.
 * @returns {object} Supabase client instance
 */
export function getSupabase() {
  if (!_supabaseClient) {
    throw new Error('Supabase client not initialized. Call initSupabase() first.');
  }
  return _supabaseClient;
}

/**
 * Initialize the Supabase client.
 * Called once during extension startup.
 */
export async function initSupabase() {
  if (_supabaseClient) return _supabaseClient;

  // Dynamically import local UMD bundle which populates window.supabase
  await import('./vendor/supabase.min.js');

  const supabaseLib = window.supabase;
  if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
    throw new Error('Supabase UMD library failed to load globally.');
  }

  const { createClient } = supabaseLib;

  _supabaseClient = createClient(
    SessionShareConfig.SUPABASE_URL,
    SessionShareConfig.SUPABASE_ANON_KEY,
    {
      auth: {
        storage: {
          // Use chrome.storage.local for persistent auth in MV3
          getItem: async (key) => {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
          },
          setItem: async (key, value) => {
            await chrome.storage.local.set({ [key]: value });
          },
          removeItem: async (key) => {
            await chrome.storage.local.remove(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
  return _supabaseClient;
}

/**
 * Get the current authenticated user, or null.
 */
export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session JWT token, or null.
 */
export async function getAccessToken() {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
