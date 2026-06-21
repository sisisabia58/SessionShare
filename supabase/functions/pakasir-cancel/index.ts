import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

const PAKASIR_CANCEL_API = "https://app.pakasir.com/api/transactioncancel";
const PAKASIR_PROJECT = Deno.env.get("PAKASIR_PROJECT_SLUG") ?? "";
const PAKASIR_API_KEY = Deno.env.get("PAKASIR_API_KEY") ?? "";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST")
    return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Only POST is allowed");

  if (!PAKASIR_API_KEY || !PAKASIR_PROJECT)
    return createErrorResponse(500, "CONFIGURATION_ERROR", "Server payment configuration is incomplete.");

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  let body: any;
  try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

  const { order_id } = body;
  if (!order_id) return createErrorResponse(400, "BAD_REQUEST", "Missing order_id");

  const adminClient = createAdminClient();

  // ── 1. Look up order, verify ownership ───────────────────────────
  const { data: order, error: fetchErr } = await adminClient
    .from("orders")
    .select("id, user_id, pakasir_order_id, total_price, status")
    .eq("id", order_id)
    .single();

  if (fetchErr || !order)
    return createErrorResponse(404, "NOT_FOUND", "Order not found");

  if (order.user_id !== user.id)
    return createErrorResponse(403, "FORBIDDEN", "You do not own this order");

  // ── 2. Guard: only cancel pending orders ─────────────────────────
  if (order.status !== "pending") {
    return createErrorResponse(400, "BAD_REQUEST", `Order is already ${order.status} — cannot cancel`);
  }

  // ── 3. Notify Pakasir (soft failure — we cancel locally regardless) ──
  let pakasirCancelled = false;
  if (order.pakasir_order_id) {
    try {
      const pakasirRes = await fetch(PAKASIR_CANCEL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: PAKASIR_PROJECT,
          order_id: order.pakasir_order_id,
          amount: order.total_price,
          api_key: PAKASIR_API_KEY,
        }),
      });
      pakasirCancelled = pakasirRes.ok;
      if (!pakasirRes.ok) {
        const errBody = await pakasirRes.text();
        console.warn(`[pakasir-cancel] Pakasir cancel returned non-OK (order: ${order.pakasir_order_id}): ${errBody}`);
      }
    } catch (err) {
      console.warn(`[pakasir-cancel] Failed to reach Pakasir cancel API: ${err}`);
    }
  }

  // ── 4. Mark order as cancelled in our DB ─────────────────────────
  const { error: updateErr } = await adminClient
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", order.id);

  if (updateErr) {
    console.error(`[pakasir-cancel] Failed to update order ${order.id}:`, updateErr);
    return createErrorResponse(500, "DATABASE_ERROR", "Failed to cancel order record");
  }

  console.log(`[pakasir-cancel] ✅ Order cancelled: order=${order.id} user=${user.id} pakasir_notified=${pakasirCancelled}`);
  return createJsonResponse({ cancelled: true, pakasir_notified: pakasirCancelled });
});
