import { assertEquals, assertNotEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("encrypt returns base64 string different from plaintext", async () => {
  const { encrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "a".repeat(64); // 256-bit hex key
  const plaintext = JSON.stringify([{ name: "session", value: "abc123" }]);

  const encrypted = await encrypt(plaintext, key);

  assertNotEquals(encrypted, plaintext);
  assertEquals(typeof encrypted, "string");
  assertEquals(/^[A-Za-z0-9+/=]+$/.test(encrypted), true);
});

Deno.test("decrypt recovers original plaintext", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "b".repeat(64);
  const plaintext = JSON.stringify([
    { name: "session_token", value: "tok_abc123", domain: ".example.com" },
    { name: "csrf", value: "csrf_xyz", domain: ".example.com" },
  ]);

  const encrypted = await encrypt(plaintext, key);
  const decrypted = await decrypt(encrypted, key);

  assertEquals(decrypted, plaintext);
});

Deno.test("decrypt with wrong key throws error", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const correctKey = "c".repeat(64);
  const wrongKey = "d".repeat(64);
  const plaintext = "secret data";

  const encrypted = await encrypt(plaintext, correctKey);

  await assertRejects(
    () => decrypt(encrypted, wrongKey),
    Error,
    "Decryption failed",
  );
});

Deno.test("decrypt with tampered ciphertext throws error", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "e".repeat(64);
  const plaintext = "secret data";

  const encrypted = await encrypt(plaintext, key);
  const tampered = encrypted.slice(0, -4) + "AAAA";

  await assertRejects(
    () => decrypt(tampered, key),
    Error,
    "Decryption failed",
  );
});

Deno.test("each encryption produces different ciphertext (unique IV)", async () => {
  const { encrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "f".repeat(64);
  const plaintext = "same data";

  const encrypted1 = await encrypt(plaintext, key);
  const encrypted2 = await encrypt(plaintext, key);

  assertNotEquals(encrypted1, encrypted2);
});

Deno.test("encrypt rejects empty key", async () => {
  const { encrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const emptyKey = "";

  await assertRejects(
    () => encrypt("data", emptyKey),
    Error,
    "Invalid encryption key: key string cannot be empty",
  );
});
