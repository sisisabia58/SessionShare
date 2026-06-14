import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Crypto ───────────────────────────────────────────────────────
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
  return btoa(String.fromCharCode(...combined));
}

// ── Handler ──────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const encryptionKey = Deno.env.get("ENCRYPTION_KEY") ?? "";
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: services } = await admin.from("services").select("website_url").eq("is_folder", false);

  const fallback = [
    "codecademy.com","deepl.com","academia.edu","grammarly.com",
    "chatgpt.com","claude.ai","perplexity.ai","netflix.com",
    "spotify.com","canva.com","turnitin.com","writehuman.ai",
    "cursor.com","semrush.com","capcut.com","figma.com",
    "blackbox.ai","speechify.com","grok.com",
    "tv.apple.com","elicit.com","wolframalpha.com","scribd.com",
  ];

  let domains = [...fallback];
  if (services) {
    const dbDomains = services
      .map((s: { website_url: string }) => {
        try { return new URL(s.website_url).hostname.replace(/^www\./, ""); }
        catch { return null; }
      })
      .filter(Boolean) as string[];
    domains = Array.from(new Set([...domains, ...dbDomains]));
  }

  const encrypted = await encrypt(JSON.stringify(domains), encryptionKey);
  return new Response(encrypted, {
    headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
  });
});
