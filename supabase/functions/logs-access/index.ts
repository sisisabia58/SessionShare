import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Only POST is allowed");
  }

  // Authenticate user
  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;
  const user = authResult.user;

  // Parse request body
  let body: any;
  try {
    body = await req.json();
  } catch (_err) {
    return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON body");
  }

  const { service_id, action } = body;
  if (!service_id || !action) {
    return createErrorResponse(400, "BAD_REQUEST", "Missing service_id or action in request body");
  }

  const validActions = ["access", "inject", "export", "view"];
  if (!validActions.includes(action)) {
    return createErrorResponse(400, "BAD_REQUEST", `Invalid action. Must be one of: ${validActions.join(", ")}`);
  }

  // Retrieve client network metadata
  const ipAddress = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
  const userAgent = req.headers.get("user-agent") || null;

  const adminClient = createAdminClient();

  // Insert the access log record
  const { data: logRecord, error: logError } = await adminClient
    .from("cookie_access_logs")
    .insert({
      user_id: user.id,
      service_id: service_id,
      action: action,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .select()
    .single();

  if (logError) {
    console.error("Failed to insert access log:", logError);
    return createErrorResponse(500, "DATABASE_ERROR", "Failed to log cookie access");
  }

  return createJsonResponse({ success: true, log: logRecord });
});
