import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("createErrorResponse returns proper error format", async () => {
  const { createErrorResponse } = await import("../supabase/functions/_shared/errors.ts");
  const response = createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid token");
  assertEquals(response.status, 401);
  const body = await response.json();
  assertEquals(body.error.code, "UNAUTHORIZED");
  assertEquals(body.error.message, "Missing or invalid token");
});

Deno.test("createErrorResponse includes CORS headers", async () => {
  const { createErrorResponse } = await import("../supabase/functions/_shared/errors.ts");
  const response = createErrorResponse(403, "FORBIDDEN", "Admin only");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("corsHeaders returns proper headers for preflight", async () => {
  const { corsHeaders } = await import("../supabase/functions/_shared/cors.ts");
  assertEquals(typeof corsHeaders["Access-Control-Allow-Origin"], "string");
  assertEquals(typeof corsHeaders["Access-Control-Allow-Headers"], "string");
  assertEquals(typeof corsHeaders["Access-Control-Allow-Methods"], "string");
});
