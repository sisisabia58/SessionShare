/**
 * SessionShare Cookie Encrypter Utility
 * 
 * Encrypts raw JSON cookies (exported from Cookie-Editor / EditThisCookie)
 * using the shared ENCRYPTION_KEY so they can be inserted into the database.
 * 
 * Usage:
 *   node encrypt_cookies.js <service_id> <path_to_cookies.json> [expires_in_days]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default Encryption key from configuration
const ENCRYPTION_KEY = "th3k3yt0unl0ckpr3m1umt0g3th3r15gr0upyJSON";
const IV_LENGTH = 12;

async function encrypt(plaintext, keyString) {
  // Derive key via SHA-256 of the key string
  const hash = crypto.createHash('sha256').update(keyString).digest();
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', hash, iv);
  
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  // Combined = iv + encrypted + tag (matches Web Crypto GCM format)
  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString('base64');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: node encrypt_cookies.js <service_id> <path_to_cookies.json> [expires_in_days]");
    console.log("\nExample:");
    console.log("  node encrypt_cookies.js a1b2c3d4-e5f6-7890-abcd-ef1234567890 chatgpt_cookies.json 30");
    process.exit(1);
  }

  const serviceId = args[0];
  const jsonPath = path.resolve(args[1]);
  const days = parseInt(args[2] || "7", 10);

  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found at ${jsonPath}`);
    process.exit(1);
  }

  try {
    const rawContent = fs.readFileSync(jsonPath, 'utf8');
    
    // Validate that it's valid JSON
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      console.error("Error: Input file is not valid JSON.");
      process.exit(1);
    }

    // Convert back to clean compacted string
    const plaintext = JSON.stringify(parsed);

    // Encrypt
    const encryptedBase64 = await encrypt(plaintext, ENCRYPTION_KEY);

    // Calculate expiry timestamp
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
    process.exit(1);
  }
}

main();
