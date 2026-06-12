import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "./errors.ts";

export const RATE_LIMIT_CONFIG: Record<string, { maxRequests: number; windowSeconds: number }> = {
  "service-cookie": { maxRequests: 10, windowSeconds: 60 },
};

/**
 * Checks sliding window rate limit for a user/endpoint.
 * If exceeded, returns a 429 response. Otherwise records the request and returns null.
 */
export async function checkRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  endpoint: string,
): Promise<Response | null> {
  const config = RATE_LIMIT_CONFIG[endpoint];
  if (!config) return null;

  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

  // Get current request count in window
  const { count, error: countError } = await adminClient
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("requested_at", windowStart);

  if (countError) {
    console.error("Rate limit check failed:", countError);
    return null; // Fail open to not block users due to transient db issues
  }

  const requestCount = count || 0;

  if (requestCount >= config.maxRequests) {
    return createErrorResponse(
      429,
      "RATE_LIMIT_EXCEEDED",
      `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowSeconds} seconds.`
    );
  }

  // Record request
  const { error: insertError } = await adminClient
    .from("rate_limits")
    .insert({
      user_id: userId,
      endpoint: endpoint,
    });

  if (insertError) {
    console.error("Failed to record rate limit entry:", insertError);
  }

  return null;
}
