import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "GET") return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Only GET is allowed");

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  const adminClient = createAdminClient();

  const { data: logs, error } = await adminClient
    .from("cookie_access_logs")
    .select(
      `id, action, ip_address, user_agent, created_at,
       services:service_id (name, icon_url)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to fetch activity logs");

  // Flatten for frontend convenience
  const result = (logs ?? []).map((log: any) => ({
    id: log.id,
    action: log.action,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    created_at: log.created_at,
    service_name: log.services?.name ?? null,
    service_icon_url: log.services?.icon_url ?? null,
  }));

  return createJsonResponse({ logs: result });
});
