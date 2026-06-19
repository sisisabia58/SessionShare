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

  // ── GET: list all services (with cookie slot counts) ──────────
  if (req.method === "GET") {
    const { data: services, error } = await adminClient
      .from("services")
      .select("id, name, website_url, icon_url, category, folder_id, display_order, is_folder, created_at")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to retrieve services");

    // Fetch active cookie slot counts per service
    const { data: cookies } = await adminClient
      .from("shared_session_cookies")
      .select("service_id, account_slot, is_active, expires_at");

    const slotMap: Record<string, { total: number; active: number }> = {};
    if (cookies) {
      for (const c of cookies) {
        if (!slotMap[c.service_id]) slotMap[c.service_id] = { total: 0, active: 0 };
        slotMap[c.service_id].total++;
        if (c.is_active && c.expires_at > new Date().toISOString()) {
          slotMap[c.service_id].active++;
        }
      }
    }

    const result = (services as any[]).map((s) => ({
      ...s,
      cookie_count: slotMap[s.id]?.total ?? 0,
      active_cookie_count: slotMap[s.id]?.active ?? 0,
    }));

    return createJsonResponse({ services: result });
  }

  // ── POST: create service ────────────────────────────────────────
  if (req.method === "POST") {
    let body: any;
    try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

    const { name, website_url, icon_url, category, folder_id, display_order, is_folder } = body;
    if (!name || !website_url) return createErrorResponse(400, "BAD_REQUEST", "Missing name or website_url");

    const { data: svc, error } = await adminClient
      .from("services")
      .insert({ name, website_url, icon_url, category, folder_id, display_order, is_folder })
      .select("id, name, website_url, icon_url, category, folder_id, display_order, is_folder")
      .single();

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to create service");
    return createJsonResponse({ service: svc }, 201);
  }

  // ── PUT: update service ─────────────────────────────────────────
  if (req.method === "PUT") {
    const id = url.searchParams.get("id");
    if (!id) return createErrorResponse(400, "BAD_REQUEST", "Missing service id");

    let body: any;
    try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

    const { name, website_url, icon_url, category, folder_id, display_order, is_folder } = body;

    const { data: svc, error } = await adminClient
      .from("services")
      .update({ name, website_url, icon_url, category, folder_id, display_order, is_folder })
      .eq("id", id)
      .select("id, name, website_url, icon_url, category, folder_id, display_order, is_folder")
      .single();

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to update service");
    if (!svc) return createErrorResponse(404, "NOT_FOUND", "Service not found");
    return createJsonResponse({ service: svc });
  }

  // ── DELETE: remove service ──────────────────────────────────────
  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return createErrorResponse(400, "BAD_REQUEST", "Missing service id");

    const { error } = await adminClient.from("services").delete().eq("id", id);
    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to delete service");
    return createJsonResponse({ success: true });
  }

  return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
