import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("rate limit config has correct defaults", async () => {
  const { RATE_LIMIT_CONFIG } = await import("../supabase/functions/_shared/rate-limit.ts");
  assertEquals(RATE_LIMIT_CONFIG["service-cookie"].maxRequests, 10);
  assertEquals(RATE_LIMIT_CONFIG["service-cookie"].windowSeconds, 60);
});

Deno.test("rate limit config covers expected endpoints", async () => {
  const { RATE_LIMIT_CONFIG } = await import("../supabase/functions/_shared/rate-limit.ts");
  assertEquals("service-cookie" in RATE_LIMIT_CONFIG, true);
});
