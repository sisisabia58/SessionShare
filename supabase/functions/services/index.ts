import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser, requireRole } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient, createUserClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Authenticate user
  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;

  const { user } = authResult;

  if (req.method === "GET") {
    // Return all services
    const supabase = createUserClient(req);
    const { data: services, error } = await supabase
      .from("services")
      .select("id, name, website_url, icon_url")
      .order("name", { ascending: true });

    if (error) {
      console.error("GET services failed:", error);
      return createErrorResponse(500, "DATABASE_ERROR", "Failed to retrieve services");
    }

    return createJsonResponse({ services });
  }

  if (req.method === "POST") {
    // Add new service (admin only)
    const roleError = requireRole(user, "admin");
    if (roleError) return roleError;

    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON payload");
    }

    const { name, website_url, icon_url } = body;
    if (!name || !website_url) {
      return createErrorResponse(400, "BAD_REQUEST", "Missing name or website_url");
    }

    const adminClient = createAdminClient();
    const { data: newService, error } = await adminClient
      .from("services")
      .insert({ name, website_url, icon_url })
      .select("id, name, website_url, icon_url")
      .single();

    if (error) {
      console.error("POST services failed:", error);
      if (error.code === "23505") { // Unique violation
        return createErrorResponse(409, "ALREADY_EXISTS", `A service with name "${name}" already exists`);
      }
      return createErrorResponse(500, "DATABASE_ERROR", "Failed to create service");
    }

    return createJsonResponse({ service: newService }, 201);
  }

  return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
