import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";
import { decrypt } from "../_shared/crypto.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "GET") {
    return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Only GET is allowed");
  }

  // Authenticate user
  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  const adminClient = createAdminClient();

  // Enforce sliding window rate limit
  const rateLimitResponse = await checkRateLimit(adminClient, user.id, "service-cookie");
  if (rateLimitResponse) return rateLimitResponse;

  // Get service_id from query parameters
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("service_id");

  if (!serviceId) {
    return createErrorResponse(400, "BAD_REQUEST", "Missing service_id query parameter");
  }
  
  // Fetch the active, non-expired cookie for this service
  const { data: cookieRecord, error } = await adminClient
    .from("shared_session_cookies")
    .select("encrypted_cookie_data, expires_at")
    .eq("service_id", serviceId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Fetch cookie record failed:", error);
    return createErrorResponse(500, "DATABASE_ERROR", "Failed to retrieve session cookie");
  }

  if (!cookieRecord) {
    return createErrorResponse(404, "NOT_FOUND", "No active session cookie found for this service");
  }

  // Decrypt the cookie data using server's ENCRYPTION_KEY
  const encryptionKey = Deno.env.get("ENCRYPTION_KEY") ?? "";
  let decryptedCookieData: string;

  try {
    decryptedCookieData = await decrypt(cookieRecord.encrypted_cookie_data, encryptionKey);
  } catch (decryptError) {
    console.error("Decryption failed for cookie:", decryptError);
    return createErrorResponse(500, "ENCRYPTION_ERROR", "Failed to decrypt session cookie");
  }

  return createJsonResponse({
    cookie_data: decryptedCookieData,
    expires_at: cookieRecord.expires_at,
  });
});
