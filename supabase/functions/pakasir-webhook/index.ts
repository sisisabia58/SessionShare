import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

// This function is called directly by Pakasir, NOT by the frontend.
// It has no CORS or JWT auth — it is protected by verifying the project slug.

const PAKASIR_PROJECT = Deno.env.get("PAKASIR_PROJECT_SLUG") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Only POST allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { amount, order_id, project, status, completed_at, payment_method } = body;

  // ── 1. Verify project slug ────────────────────────────────────────
  if (!project || project !== PAKASIR_PROJECT) {
    console.error(`[pakasir-webhook] Invalid project slug: ${project}`);
    return json({ error: "Invalid project" }, 403);
  }

  // ── 2. Only handle 'completed' status ────────────────────────────
  if (status !== "completed") {
    console.log(`[pakasir-webhook] Ignoring status: ${status} for order ${order_id}`);
    return json({ received: true });
  }

  const adminClient = createAdminClient();

  // ── 3. Look up the order by pakasir_order_id ─────────────────────
  const { data: order, error: fetchErr } = await adminClient
    .from("orders")
    .select("id, user_id, plan, total_days, total_price, status")
    .eq("pakasir_order_id", order_id)
    .single();

  if (fetchErr || !order) {
    console.error(`[pakasir-webhook] Order not found: ${order_id}`, fetchErr);
    return json({ error: "Order not found" }, 404);
  }

  // Idempotency: already completed → skip
  if (order.status === "completed") {
    console.log(`[pakasir-webhook] Order already completed: ${order_id}`);
    return json({ received: true });
  }

  // ── 4. Verify amount matches ──────────────────────────────────────
  if (Number(amount) !== order.total_price) {
    console.error(`[pakasir-webhook] Amount mismatch: got ${amount}, expected ${order.total_price}`);
    return json({ error: "Amount mismatch" }, 400);
  }

  // ── 5. Mark order as completed ────────────────────────────────────
  const { error: orderUpdateErr } = await adminClient
    .from("orders")
    .update({ status: "completed" })
    .eq("id", order.id);

  if (orderUpdateErr) {
    console.error(`[pakasir-webhook] Failed to update order ${order.id}`, orderUpdateErr);
    return json({ error: "Failed to update order" }, 500);
  }

  // ── 6. Activate user premium plan ────────────────────────────────
  const premiumUntil = new Date();
  premiumUntil.setDate(premiumUntil.getDate() + order.total_days);

  const { error: userUpdateErr } = await adminClient
    .from("users")
    .update({
      plan: order.plan,
      premium_until: premiumUntil.toISOString(),
    })
    .eq("id", order.user_id);

  if (userUpdateErr) {
    console.error(`[pakasir-webhook] Failed to activate plan for user ${order.user_id}`, userUpdateErr);
    // Don't return error here — order is already marked completed
    // Admin can force-complete via admin panel if needed
  }

  console.log(`[pakasir-webhook] ✅ Plan activated: user=${order.user_id} plan=${order.plan} until=${premiumUntil.toISOString()} via=${payment_method ?? "unknown"}`);
  return json({ received: true, activated: true });
});
