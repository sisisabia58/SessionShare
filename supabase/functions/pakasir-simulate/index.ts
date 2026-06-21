import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

const PAKASIR_SIMULATE_API = "https://app.pakasir.com/api/paymentsimulation";
const PAKASIR_PROJECT = Deno.env.get("PAKASIR_PROJECT_SLUG") ?? "";
const PAKASIR_API_KEY = Deno.env.get("PAKASIR_API_KEY") ?? "";

// Guard: simulation is only permitted in sandbox environments.
// In production, PAKASIR_SANDBOX is "false" (or unset), so this function
// will immediately reject all requests with 403.
const IS_SANDBOX = Deno.env.get("PAKASIR_SANDBOX") === "true";


serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Production kill-switch: reject immediately if not in sandbox mode
  if (!IS_SANDBOX) {
    return createErrorResponse(403, "FORBIDDEN", "Payment simulation is only available in sandbox mode.");
  }

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

  // Look up the order to get the pakasir_order_id and amount
  const { data: order, error: fetchErr } = await adminClient
    .from("orders")
    .select("id, user_id, pakasir_order_id, total_price, status")
    .eq("id", order_id)
    .single();

  if (fetchErr || !order)
    return createErrorResponse(404, "NOT_FOUND", "Order not found");

  // Only the owner can simulate
  if (order.user_id !== user.id)
    return createErrorResponse(403, "FORBIDDEN", "You do not own this order");

  // Only simulate pending orders
  if (order.status !== "pending")
    return createErrorResponse(400, "BAD_REQUEST", `Order is already ${order.status}`);

  if (!order.pakasir_order_id)
    return createErrorResponse(400, "BAD_REQUEST", "Order has no pakasir_order_id");

  // Call Pakasir payment simulation API
  let simRes: Response;
  try {
    simRes = await fetch(PAKASIR_SIMULATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: PAKASIR_PROJECT,
        order_id: order.pakasir_order_id,
        amount: order.total_price,
        api_key: PAKASIR_API_KEY,
      }),
    });
  } catch (err) {
    return createErrorResponse(502, "PAKASIR_ERROR", "Failed to reach Pakasir simulation API");
  }

  const simData = await simRes.json();

  if (!simRes.ok) {
    return createErrorResponse(502, "PAKASIR_ERROR", simData?.message ?? "Pakasir simulation failed");
  }

  return createJsonResponse({ simulated: true, message: simData?.message ?? "Payment simulation triggered" });
});
