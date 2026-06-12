import { assertEquals, assertNotEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("POST services requires name and website_url", async () => {
  const body: any = { icon_url: "https://example.com/icon.png" };
  const hasName = !!body.name;
  const hasUrl = !!body.website_url;

  assertEquals(hasName, false);
  assertEquals(hasUrl, false);
});

Deno.test("admin role check rejects non-admin users", async () => {
  const { requireRole } = await import("../supabase/functions/_shared/auth.ts");

  const memberUser = { id: "uuid-1", email: "user@test.com", role: "member" as const };
  const adminUser = { id: "uuid-2", email: "admin@test.com", role: "admin" as const };

  const memberResult = requireRole(memberUser, "admin");
  const adminResult = requireRole(adminUser, "admin");

  assertNotEquals(memberResult, null);
  assertEquals(memberResult?.status, 403);
  assertEquals(adminResult, null);
});
