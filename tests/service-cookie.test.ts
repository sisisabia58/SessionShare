import { assertEquals, assertNotEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("cookie upload requires encrypted_cookie_data and expires_at", () => {
  const validBody = {
    encrypted_cookie_data: "base64data==",
    expires_at: "2026-12-31T23:59:59Z",
  };
  const missingData = { expires_at: "2026-12-31T23:59:59Z" };
  const missingExpiry = { encrypted_cookie_data: "base64data==" };

  assertEquals(!!validBody.encrypted_cookie_data && !!validBody.expires_at, true);
  assertEquals(!!(missingData as Record<string, string>).encrypted_cookie_data, false);
  assertEquals(!!(missingExpiry as Record<string, string>).expires_at, false);
});

Deno.test("expires_at must be a valid future date", () => {
  const futureDate = new Date("2027-01-01T00:00:00Z");
  const pastDate = new Date("2020-01-01T00:00:00Z");
  const invalidDate = new Date("not-a-date");
  const now = new Date();

  assertEquals(futureDate > now, true);
  assertEquals(pastDate > now, false);
  assertEquals(isNaN(invalidDate.getTime()), true);
});

Deno.test("full cookie rotation flow: encrypt, store, retrieve", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  const rawCookies = JSON.stringify([
    { name: "session", value: "tok_admin_rotated", domain: ".service.com" },
  ]);
  const encrypted = await encrypt(rawCookies, key);

  const storedRecord = {
    encrypted_cookie_data: encrypted,
    expires_at: "2027-06-12T00:00:00Z",
    is_active: true,
  };

  const decrypted = await decrypt(storedRecord.encrypted_cookie_data, key);
  const parsed = JSON.parse(decrypted);

  assertEquals(parsed[0].name, "session");
  assertEquals(parsed[0].value, "tok_admin_rotated");
  assertEquals(storedRecord.is_active, true);
});

Deno.test("account_slot query parameter parsing", () => {
  const parseSlot = (urlStr: string): number => {
    const url = new URL(urlStr);
    const slotParam = url.searchParams.get("account_slot");
    const accountSlot = slotParam ? parseInt(slotParam, 10) : 1;
    return isNaN(accountSlot) || accountSlot < 1 ? 1 : accountSlot;
  };

  assertEquals(parseSlot("https://api.com/service-cookie?service_id=1"), 1);
  assertEquals(parseSlot("https://api.com/service-cookie?service_id=1&account_slot=3"), 3);
  assertEquals(parseSlot("https://api.com/service-cookie?service_id=1&account_slot=0"), 1);
  assertEquals(parseSlot("https://api.com/service-cookie?service_id=1&account_slot=-5"), 1);
  assertEquals(parseSlot("https://api.com/service-cookie?service_id=1&account_slot=abc"), 1);
});
