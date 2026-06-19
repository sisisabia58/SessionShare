import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

const PAKASIR_API = "https://app.pakasir.com/api/transactioncreate/qris";
const PAKASIR_PROJECT = Deno.env.get("PAKASIR_PROJECT_SLUG") ?? "";
const PAKASIR_API_KEY = Deno.env.get("PAKASIR_API_KEY") ?? "";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Only POST is allowed");

  if (!PAKASIR_API_KEY || !PAKASIR_PROJECT) {
    console.error("[pakasir-create] Missing Pakasir configuration environment variables.");
    return createErrorResponse(500, "CONFIGURATION_ERROR", "Server payment configuration is incomplete.");
  }

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  let body: any;
  try { body = await req.json(); } catch { return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON"); }

  const { plan, plan_display_name, quantity, total_days, amount } = body;

  if (!plan || !plan_display_name || !quantity || !total_days || !amount) {
    return createErrorResponse(400, "BAD_REQUEST", "Missing required fields: plan, plan_display_name, quantity, total_days, amount");
  }

  if (!["basic", "premium", "premium_phantom"].includes(plan)) {
    return createErrorResponse(400, "BAD_REQUEST", "Invalid plan value");
  }

  const adminClient = createAdminClient();

  // 1. Generate a unique order_id for Pakasir
  const pakasirOrderId = `SS-${Date.now()}-${user.id.slice(0, 8).toUpperCase()}`;

  // 2. Insert order row with status 'pending'
  const { data: order, error: insertErr } = await adminClient
    .from("orders")
    .insert({
      user_id: user.id,
      plan,
      plan_display_name,
      quantity,
      total_days,
      total_price: amount,
      pakasir_order_id: pakasirOrderId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !order) {
    return createErrorResponse(500, "DATABASE_ERROR", "Failed to create order record");
  }

  // 3. Call Pakasir API to create QRIS transaction
  let pakasirRes: Response;
  try {
    pakasirRes = await fetch(PAKASIR_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: PAKASIR_PROJECT,
        order_id: pakasirOrderId,
        amount,
        api_key: PAKASIR_API_KEY,
      }),
    });
  } catch (err) {
    // Network error — mark order as cancelled
    await adminClient.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return createErrorResponse(502, "PAKASIR_ERROR", "Failed to reach Pakasir API");
  }

  if (!pakasirRes.ok) {
    const errBody = await pakasirRes.text();
    await adminClient.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return createErrorResponse(502, "PAKASIR_ERROR", `Pakasir API error: ${errBody}`);
  }

  const pakasirData = await pakasirRes.json();
  const payment = pakasirData.payment;

  // 4. Save QR string + expiry back to order row
  await adminClient
    .from("orders")
    .update({
      pakasir_payment_number: payment.payment_number,
      pakasir_expired_at: payment.expired_at,
    })
    .eq("id", order.id);

  // 5. Return data to frontend
  return createJsonResponse({
    order_id: order.id,
    qr_string: payment.payment_number,
    expired_at: payment.expired_at,
    total_payment: payment.total_payment,
  }, 201);
});
