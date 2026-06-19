import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser, requireRole } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;

  const roleError = requireRole(authResult.user, "admin");
  if (roleError) return roleError;

  const adminClient = createAdminClient();
  const url = new URL(req.url);

  // ── GET: paginated user list ────────────────────────────────────
  if (req.method === "GET") {
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const planFilter = url.searchParams.get("plan");
    const search = url.searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = adminClient
      .from("users")
      .select("id, email, role, plan, premium_until, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (planFilter) query = query.eq("plan", planFilter);
    if (search) query = query.ilike("email", `%${search}%`);

    const { data: users, error, count } = await query;
    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to fetch users");

    return createJsonResponse({ users: users ?? [], total: count ?? 0, page, limit });
  }

  const id = url.searchParams.get("id");

  // ── PUT: update user role or plan ──────────────────────────────
  if (req.method === "PUT") {
    if (!id) return createErrorResponse(400, "BAD_REQUEST", "Missing user id");

    let body: any;
    try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

    const updates: Record<string, unknown> = {};
    if (body.role !== undefined) updates.role = body.role;
    if (body.plan !== undefined) updates.plan = body.plan;
    if (body.premium_until !== undefined) updates.premium_until = body.premium_until;

    if (Object.keys(updates).length === 0) {
      return createErrorResponse(400, "BAD_REQUEST", "No fields to update");
    }

    const { data: user, error } = await adminClient
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, email, role, plan, premium_until")
      .single();

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to update user");
    if (!user) return createErrorResponse(404, "NOT_FOUND", "User not found");
    return createJsonResponse({ user });
  }

  // ── DELETE: ban / soft-delete user ─────────────────────────────
  if (req.method === "DELETE") {
    if (!id) return createErrorResponse(400, "BAD_REQUEST", "Missing user id");

    // Soft delete: set plan to 'free', clear premium_until
    // (Full deletion would need auth.users removal via Supabase Admin API)
    const { error } = await adminClient
      .from("users")
      .update({ plan: "free", premium_until: null, role: "member" })
      .eq("id", id);

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to ban user");
    return createJsonResponse({ success: true, message: "User plan revoked and role reset" });
  }

  return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
