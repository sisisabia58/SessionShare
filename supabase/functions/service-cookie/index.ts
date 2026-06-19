import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ─────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonRes(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function errRes(status: number, code: string, message: string) {
  return new Response(JSON.stringify({ error: { code, message } }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ── Supabase clients ─────────────────────────────────────────────
function userClient(req: Request) {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
}

function adminClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// ── Crypto ───────────────────────────────────────────────────────
const IV_LENGTH = 12;

async function importKey(keyString: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyString));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function decrypt(encryptedBase64: string, keyString: string): Promise<string> {
  const key = await importKey(keyString);
  const bin = atob(encryptedBase64);
  const combined = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) combined[i] = bin.charCodeAt(i);

  const iv = combined.slice(0, IV_LENGTH);
  const ct = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(decrypted);
}

// ── Handler ──────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return errRes(405, "METHOD_NOT_ALLOWED", "Only GET");

  // Auth
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return errRes(401, "UNAUTHORIZED", "Missing auth");

  const { data: { user }, error: ue } = await userClient(req).auth.getUser();
  if (ue || !user) return errRes(401, "UNAUTHORIZED", "Invalid token");

  const admin = adminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile) return errRes(500, "INTERNAL_ERROR", "No profile");

  // Get service_id
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("service_id");
  if (!serviceId) return errRes(400, "BAD_REQUEST", "Missing service_id");

  // Parse account_slot from query string (default = 1)
  const slotParam = url.searchParams.get("account_slot");
  const accountSlot = slotParam ? parseInt(slotParam, 10) : 1;
  const slotNum = isNaN(accountSlot) || accountSlot < 1 ? 1 : accountSlot;

  // Fetch cookie for specific slot
  let { data: rec, error: re } = await admin
    .from("shared_session_cookies")
    .select("encrypted_cookie_data, expires_at")
    .eq("service_id", serviceId)
    .eq("is_active", true)
    .eq("account_slot", slotNum)
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Graceful fallback: if requested slot not found or error, return the newest available cookie
  if (!rec || re) {
    const fallback = await admin
      .from("shared_session_cookies")
      .select("encrypted_cookie_data, expires_at")
      .eq("service_id", serviceId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    rec = fallback.data;
    re = fallback.error;
  }

  if (re) return errRes(500, "DATABASE_ERROR", "DB error");
  if (!rec) return errRes(404, "NOT_FOUND", "No active session cookie found");

  // Decrypt
  const encryptionKey = Deno.env.get("ENCRYPTION_KEY") ?? "";
  let cookieData: string;
  try {
    cookieData = await decrypt(rec.encrypted_cookie_data, encryptionKey);
  } catch {
    return errRes(500, "ENCRYPTION_ERROR", "Failed to decrypt");
  }

  return jsonRes({ cookie_data: cookieData, expires_at: rec.expires_at });
});
