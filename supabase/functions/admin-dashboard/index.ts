import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser, requireRole } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "GET") {
    return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Only GET is allowed");
  }

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;

  const roleError = requireRole(authResult.user, "admin");
  if (roleError) return roleError;

  const adminClient = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    usersResult,
    servicesResult,
    logsResult,
    activeCookiesResult,
  ] = await Promise.all([
    adminClient.from("users").select("id", { count: "exact", head: true }),
    adminClient.from("services").select("id", { count: "exact", head: true }),
    adminClient.from("cookie_access_logs").select("id", { count: "exact", head: true }).gte("created_at", twentyFourHoursAgo),
    adminClient.from("shared_session_cookies").select("id", { count: "exact", head: true }).eq("is_active", true).gt("expires_at", new Date().toISOString()),
  ]);

  // Fetch all services to count access logs per service
  const { data: servicesData } = await adminClient.from("services").select("id, name");
  const topServices = [];

  if (servicesData) {
    const logCounts = await Promise.all(
      servicesData.map(async (service: { id: string; name: string }) => {
        const { count } = await adminClient
          .from("cookie_access_logs")
          .select("id", { count: "exact", head: true })
          .eq("service_id", service.id);
        return {
          name: service.name,
          access_count: count ?? 0,
        };
      })
    );
    // Sort by access count descending
    logCounts.sort((a, b) => b.access_count - a.access_count);
    topServices.push(...logCounts.slice(0, 5));
  }

  // Recent logs: last 10 access events with user email + service name
  const { data: recentLogsData } = await adminClient
    .from("cookie_access_logs")
    .select(`id, action, created_at, users:user_id (email), services:service_id (name)`)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentLogs = (recentLogsData ?? []).map((log: any) => ({
    id: log.id,
    action: log.action,
    created_at: log.created_at,
    user_email: log.users?.email ?? "unknown",
    service_name: log.services?.name ?? "unknown",
  }));

  // Users by plan breakdown
  const { data: allUsers } = await adminClient.from("users").select("plan");
  const usersByPlan: Record<string, number> = { free: 0, basic: 0, premium: 0, premium_phantom: 0 };
  for (const u of (allUsers ?? [])) {
    const p = u.plan ?? "free";
    usersByPlan[p] = (usersByPlan[p] ?? 0) + 1;
  }

  // Active subscriptions (non-free + premium_until in future)
  const now = new Date().toISOString();
  const { count: activeSubscriptions } = await adminClient
    .from("users")
    .select("id", { count: "exact", head: true })
    .neq("plan", "free")
    .gt("premium_until", now);

  return createJsonResponse({
    total_users: usersResult.count ?? 0,
    total_services: servicesResult.count ?? 0,
    total_access_logs_24h: logsResult.count ?? 0,
    active_cookies: activeCookiesResult.count ?? 0,
    active_subscriptions: activeSubscriptions ?? 0,
    top_services: topServices,
    recent_logs: recentLogs,
    users_by_plan: usersByPlan,
  });
});
