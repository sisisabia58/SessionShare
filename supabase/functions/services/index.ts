import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ─────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return null;
}

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

// ── Auth helper ──────────────────────────────────────────────────
async function getUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return { error: errRes(401, "UNAUTHORIZED", "Missing auth header") };

  const { data: { user }, error } = await userClient(req).auth.getUser();
  if (error || !user) return { error: errRes(401, "UNAUTHORIZED", "Invalid token") };

  const { data: profile } = await adminClient().from("users").select("role").eq("id", user.id).single();
  if (!profile) return { error: errRes(500, "INTERNAL_ERROR", "No user profile") };

  return { user: { id: user.id, email: user.email ?? "", role: profile.role } };
}

// ── Handler ──────────────────────────────────────────────────────
serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = await getUser(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  if (req.method === "GET") {
    const { data: services, error } = await userClient(req)
      .from("services")
      .select("id, name, website_url, icon_url, category, folder_id, display_order, is_folder")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) return errRes(500, "DATABASE_ERROR", "Failed to retrieve services");

    // Fetch active cookie counts grouped by service_id
    const { data: cookies, error: cookieError } = await adminClient()
      .from("shared_session_cookies")
      .select("service_id")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString());

    const countMap: Record<string, number> = {};
    if (!cookieError && cookies) {
      for (const c of cookies) {
        countMap[c.service_id] = (countMap[c.service_id] || 0) + 1;
      }
    }

    const servicesWithCounts = services.map((s: any) => ({
      ...s,
      cookie_count: countMap[s.id] || 0
    }));

    return jsonRes({ services: servicesWithCounts });
  }

  if (req.method === "POST") {
    if (user.role !== "admin") return errRes(403, "FORBIDDEN", "Admin only");

    let body;
    try { body = await req.json(); } catch { return errRes(400, "BAD_REQUEST", "Invalid JSON"); }

    const { name, website_url, icon_url, category, folder_id, display_order, is_folder } = body;
    if (!name || !website_url) return errRes(400, "BAD_REQUEST", "Missing name or website_url");

    const { data: svc, error } = await adminClient()
      .from("services")
      .insert({ name, website_url, icon_url, category, folder_id, display_order, is_folder })
      .select("id, name, website_url, icon_url, category, folder_id, display_order, is_folder")
      .single();

    if (error) return errRes(500, "DATABASE_ERROR", "Failed to create service");
    return jsonRes({ service: svc }, 201);
  }

  return errRes(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
