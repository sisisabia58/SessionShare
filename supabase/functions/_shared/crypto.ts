const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function importKey(keyString: string): Promise<CryptoKey> {
  if (!keyString) {
    throw new Error("Invalid encryption key: key string cannot be empty");
  }
  const encodedKey = new TextEncoder().encode(keyString);
  const keyHash = await crypto.subtle.digest("SHA-256", encodedKey);
  return crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(plaintext: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedPlaintext,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedBase64: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  let combined: Uint8Array;
  try {
    const binaryString = atob(encryptedBase64);
    combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
  } catch {
    throw new Error("Decryption failed: invalid base64 input");
  }

  if (combined.length < IV_LENGTH + 1) {
    throw new Error("Decryption failed: ciphertext too short");
  }

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Decryption failed: invalid key or tampered data");
  }
}
