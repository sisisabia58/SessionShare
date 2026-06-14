// Deno Cookie Encrypter Utility
// Encrypts raw JSON cookies (exported from Cookie-Editor / EditThisCookie)
// using the shared ENCRYPTION_KEY so they can be inserted into the database.
//
// Usage:
//   .bin\deno.exe run --allow-read encrypt_cookies.ts <service_id> <path_to_cookies.json> [expires_in_days]

const ENCRYPTION_KEY = "th3k3yt0unl0ckpr3m1umt0g3th3r15gr0upyJSON";
const IV_LENGTH = 12;

async function importKey(keyString: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyString));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt"]);
}

async function encrypt(plaintext: string, keyString: string): Promise<string> {
  const key = await importKey(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ct), iv.length);
  
  // Base64 encode in Deno
  return btoa(String.fromCharCode(...combined));
}

async function main() {
  const args = Deno.args;
  if (args.length < 2) {
    console.log("Usage: .bin\\deno.exe run --allow-read encrypt_cookies.ts <service_id> <path_to_cookies.json> [expires_in_days]");
    console.log("\nExample:");
    console.log("  .bin\\deno.exe run --allow-read encrypt_cookies.ts a1b2c3d4-e5f6-7890-abcd-ef1234567890 chatgpt_cookies.json 30");
    Deno.exit(1);
  }

  const serviceId = args[0];
  const jsonPath = args[1];
  const days = parseInt(args[2] || "7", 10);

  try {
    const rawContent = await Deno.readTextFile(jsonPath);
    
    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error("Error: Input file is not valid JSON.");
      Deno.exit(1);
    }

    const plaintext = JSON.stringify(parsed);
    const encryptedBase64 = await encrypt(plaintext, ENCRYPTION_KEY);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    const expiresAt = expiryDate.toISOString();

    console.log("\n=================== ENCRYPTION SUCCESSFUL ===================");
    console.log(`Service ID: ${serviceId}`);
    console.log(`Expires At: ${expiresAt} (${days} days)`);
    console.log("\nSQL INSERT STATEMENT:");
    console.log("-------------------------------------------------------------");
    console.log(`INSERT INTO public.shared_session_cookies (service_id, encrypted_cookie_data, expires_at, is_active)`);
    console.log(`VALUES (`);
    console.log(`  '${serviceId}',`);
    console.log(`  '${encryptedBase64}',`);
    console.log(`  '${expiresAt}',`);
    console.log(`  true`);
    console.log(`);`);
    console.log("-------------------------------------------------------------");
    console.log("\nEncrypted String (Raw):");
    console.log(encryptedBase64);
    console.log("=============================================================\n");

  } catch (err) {
    console.error("Encryption failed:", err);
    Deno.exit(1);
  }
}

main();
