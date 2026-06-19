import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  const adminClient = createAdminClient();

  // ── GET: return own profile ─────────────────────────────────────
  if (req.method === "GET") {
    const { data: profile, error } = await adminClient
      .from("users")
      .select("id, email, role, plan, premium_until, created_at")
      .eq("id", user.id)
      .single();

    if (error || !profile) return createErrorResponse(500, "INTERNAL_ERROR", "Failed to fetch profile");
    return createJsonResponse({ profile });
  }

  // ── PUT: update display_name, username, avatar_url ─────────────
  if (req.method === "PUT") {
    let body: any;
    try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

    const updates: Record<string, unknown> = {};
    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.username !== undefined) updates.username = body.username;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

    if (Object.keys(updates).length === 0) {
      return createErrorResponse(400, "BAD_REQUEST", "No fields to update");
    }

    const { data: updated, error } = await adminClient
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, role, plan, premium_until")
      .single();

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to update profile");
    return createJsonResponse({ profile: updated });
  }

  return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
