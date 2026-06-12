import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("admin dashboard stats response shape", async () => {
  const { createJsonResponse } = await import("../supabase/functions/_shared/errors.ts");

  const mockStats = {
    total_users: 150,
    total_services: 5,
    total_access_logs_24h: 342,
    active_cookies: 4,
    top_services: [
      { name: "ChatGPT", access_count: 120 },
      { name: "Canva", access_count: 89 },
    ],
  };

  const response = createJsonResponse(mockStats);
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(typeof body.total_users, "number");
  assertEquals(typeof body.total_services, "number");
  assertEquals(typeof body.total_access_logs_24h, "number");
  assertEquals(body.top_services.length, 2);
});
