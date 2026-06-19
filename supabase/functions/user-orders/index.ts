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
  const url = new URL(req.url);

  // ── GET: list own orders (or single order by pakasir_order_id) ─
  if (req.method === "GET") {
    const orderId = url.searchParams.get("order_id");

    if (orderId) {
      // Fetch single order by our DB id (for polling on /payment page)
      const { data: order, error } = await adminClient
        .from("orders")
        .select("id, plan, plan_display_name, total_days, total_price, status, pakasir_expired_at, created_at")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error || !order) return createErrorResponse(404, "NOT_FOUND", "Order not found");
      return createJsonResponse({ order });
    }

    // List all own orders
    const { data: orders, error } = await adminClient
      .from("orders")
      .select("id, plan, plan_display_name, quantity, total_days, total_price, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return createErrorResponse(500, "DATABASE_ERROR", "Failed to fetch orders");
    return createJsonResponse({ orders: orders ?? [] });
  }

  return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
});
