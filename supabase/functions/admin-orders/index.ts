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

  // ── GET: list all orders (paginated, filterable) ───────────────
  if (req.method === "GET") {
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const statusFilter = url.searchParams.get("status");
    const offset = (page - 1) * limit;

    let query = adminClient
      .from("orders")
      .select(
        `id, plan, plan_display_name, quantity, total_days, total_price,
         pakasir_order_id, status, created_at, updated_at,
         users:user_id (id, email)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data: orders, error, count } = await query;
    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to fetch orders");

    return createJsonResponse({ orders: orders ?? [], total: count ?? 0, page, limit });
  }

  // ── PUT: admin force-complete or cancel an order ────────────────
  if (req.method === "PUT") {
    const id = url.searchParams.get("id");
    if (!id) return createErrorResponse(400, "BAD_REQUEST", "Missing order id");

    let body: any;
    try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

    const { status } = body;
    if (!status || !["completed", "cancelled", "expired"].includes(status)) {
      return createErrorResponse(400, "BAD_REQUEST", "status must be 'completed', 'cancelled', or 'expired'");
    }

    // Fetch the order first
    const { data: order, error: fetchErr } = await adminClient
      .from("orders")
      .select("id, user_id, plan, total_days")
      .eq("id", id)
      .single();

    if (fetchErr || !order) return createErrorResponse(404, "NOT_FOUND", "Order not found");

    // Update order status
    const { error: updateErr } = await adminClient
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (updateErr) return createErrorResponse(500, "DATABASE_ERROR", "Failed to update order");

    // If completing: activate the user's plan
    if (status === "completed") {
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + order.total_days);

      const { error: userErr } = await adminClient
        .from("users")
        .update({ plan: order.plan, premium_until: premiumUntil.toISOString() })
        .eq("id", order.user_id);

      if (userErr) return createErrorResponse(500, "DATABASE_ERROR", "Order updated but failed to activate user plan");
    }

    // If cancelling: notify Pakasir so their dashboard reflects the change too.
    // Soft failure — if Pakasir errors (e.g. QR already expired), we still return success.
    if (status === "cancelled") {
      const pakasirProject = Deno.env.get("PAKASIR_PROJECT_SLUG") ?? "";
      const pakasirApiKey  = Deno.env.get("PAKASIR_API_KEY") ?? "";

      // Re-fetch order with pakasir fields (not included in original select)
      const { data: fullOrder } = await adminClient
        .from("orders")
        .select("pakasir_order_id, total_price")
        .eq("id", id)
        .single();

      if (fullOrder?.pakasir_order_id && pakasirApiKey && pakasirProject) {
        try {
          const pakasirRes = await fetch("https://app.pakasir.com/api/transactioncancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project: pakasirProject,
              order_id: fullOrder.pakasir_order_id,
              amount: fullOrder.total_price,
              api_key: pakasirApiKey,
            }),
          });
          if (!pakasirRes.ok) {
            const errBody = await pakasirRes.text();
            console.warn(`[admin-orders] Pakasir cancel non-OK for ${fullOrder.pakasir_order_id}: ${errBody}`);
          } else {
            console.log(`[admin-orders] ✅ Pakasir cancel notified for order ${fullOrder.pakasir_order_id}`);
          }
        } catch (err) {
          console.warn(`[admin-orders] Failed to reach Pakasir cancel API: ${err}`);
        }
      }
    }

    return createJsonResponse({ success: true, status });
  }

  return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
