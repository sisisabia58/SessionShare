import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser, requireRole } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

// ── AES-GCM encryption (mirrors service-cookie decrypt) ──────────
const IV_LENGTH = 12;

async function importKey(keyString: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyString));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt"]);
}

async function encrypt(plaintext: string, keyString: string): Promise<string> {
  const key = await importKey(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), IV_LENGTH);
  return btoa(String.fromCharCode(...combined));
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;

  const roleError = requireRole(authResult.user, "admin");
  if (roleError) return roleError;

  const adminClient = createAdminClient();
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("service_id");
  const id = url.searchParams.get("id");

  // ── GET: list all cookie slots for a service ──────────────────
  if (req.method === "GET") {
    if (!serviceId) return createErrorResponse(400, "BAD_REQUEST", "Missing service_id");

    const { data: cookies, error } = await adminClient
      .from("shared_session_cookies")
      .select("id, service_id, account_slot, is_active, expires_at, generated_at")
      .eq("service_id", serviceId)
      .order("account_slot", { ascending: true });

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to fetch cookies");
    return createJsonResponse({ cookies: cookies ?? [] });
  }

  // ── POST: add new cookie slot ─────────────────────────────────
  if (req.method === "POST") {
    let body: any;
    try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

    const { service_id, account_slot, cookie_data, expires_at } = body;
    if (!service_id || !cookie_data || !expires_at) {
      return createErrorResponse(400, "BAD_REQUEST", "Missing service_id, cookie_data, or expires_at");
    }

    const encryptionKey = Deno.env.get("ENCRYPTION_KEY") ?? "";
    let encryptedData: string;
    try {
      encryptedData = await encrypt(cookie_data, encryptionKey);
    } catch {
      return createErrorResponse(500, "ENCRYPTION_ERROR", "Failed to encrypt cookie data");
    }

    const slot = account_slot ?? 1;

    // Deactivate any existing active cookie for this service+slot
    await adminClient
      .from("shared_session_cookies")
      .update({ is_active: false })
      .eq("service_id", service_id)
      .eq("account_slot", slot)
      .eq("is_active", true);

    const { data: newCookie, error } = await adminClient
      .from("shared_session_cookies")
      .insert({
        service_id,
        account_slot: slot,
        encrypted_cookie_data: encryptedData,
        expires_at,
        is_active: true,
        generated_at: new Date().toISOString(),
      })
      .select("id, service_id, account_slot, is_active, expires_at, generated_at")
      .single();

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to insert cookie");
    return createJsonResponse({ cookie: newCookie }, 201);
  }

  // ── PUT: update / rotate a cookie slot ───────────────────────
  if (req.method === "PUT") {
    if (!id) return createErrorResponse(400, "BAD_REQUEST", "Missing id");

    let body: any;
    try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

    const updates: Record<string, unknown> = {};

    if (body.cookie_data !== undefined) {
      const encryptionKey = Deno.env.get("ENCRYPTION_KEY") ?? "";
      try {
        updates.encrypted_cookie_data = await encrypt(body.cookie_data, encryptionKey);
        updates.generated_at = new Date().toISOString();
      } catch {
        return createErrorResponse(500, "ENCRYPTION_ERROR", "Failed to encrypt cookie data");
      }
    }
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.account_slot !== undefined) updates.account_slot = body.account_slot;

    const { data: updated, error } = await adminClient
      .from("shared_session_cookies")
      .update(updates)
      .eq("id", id)
      .select("id, service_id, account_slot, is_active, expires_at, generated_at")
      .single();

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to update cookie");
    if (!updated) return createErrorResponse(404, "NOT_FOUND", "Cookie not found");
    return createJsonResponse({ cookie: updated });
  }

  // ── DELETE: remove a cookie slot ─────────────────────────────
  if (req.method === "DELETE") {
    if (!id) return createErrorResponse(400, "BAD_REQUEST", "Missing id");

    const { error } = await adminClient
      .from("shared_session_cookies")
      .delete()
      .eq("id", id);

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to delete cookie");
    return createJsonResponse({ success: true });
  }

  return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
