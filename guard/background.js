/**
 * SessionShare Guard Companion Extension - background.js
 */

const SHARED_KEY_STRING = "th3k3yt0unl0ckpr3m1umt0g3th3r15gr0upyJSON";
const IV_LENGTH = 12;

const HARDCODED_DOMAINS = [
  "codecademy.com", "deepl.com", "academia.edu", "grammarly.com",
  "chatgpt.com", "claude.ai", "perplexity.ai", "netflix.com",
  "spotify.com", "canva.com", "turnitin.com", "writehuman.ai",
  "cursor.com", "semrush.com", "capcut.com", "figma.com",
  "blackbox.ai", "speechify.com", "sora.chatgpt.com", "grok.com",
  "tv.apple.com", "elicit.com", "zutrix.com", "wolframalpha.com"
];

// Derive 256-bit AES-GCM CryptoKey using SHA-256
async function getCryptoKey() {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SHARED_KEY_STRING);
  const hash = await crypto.subtle.digest("SHA-256", keyBytes);
  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}

// Decrypt base64 AES-GCM payload
async function decryptPayload(encryptedBase64) {
  const key = await getCryptoKey();
  
  const binaryString = atob(encryptedBase64);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  if (combined.length < IV_LENGTH + 1) {
    throw new Error("Ciphertext too short");
  }

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Sweep/delete active premium session cookies
async function sweepPremiumSessions() {
  console.log("SessionShare Guard: Wiping premium account sessions...");
  let domainsToClear = [...HARDCODED_DOMAINS];

  try {
    const response = await fetch("https://qohaalvaxkmtdpzdqahn.supabase.co/functions/v1/domain");
    if (response.ok) {
      const encryptedPayload = await response.text();
      const decryptedJSON = await decryptPayload(encryptedPayload);
      const dynamicDomains = JSON.parse(decryptedJSON);
      if (Array.isArray(dynamicDomains)) {
        domainsToClear = Array.from(new Set([...domainsToClear, ...dynamicDomains]));
      }
    }
  } catch (err) {
    console.warn("Domains API failed, using fallback domains list:", err);
  }

  domainsToClear.forEach(domain => {
    chrome.cookies.getAll({ domain }, (cookies) => {
      if (!cookies) return;
      cookies.forEach(cookie => {
        const secure = cookie.secure;
        const prefix = secure ? "https://" : "http://";
        const url = `${prefix}${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`;
        
        chrome.cookies.remove({ url, name: cookie.name }, () => {
          if (chrome.runtime.lastError) {
            console.error(`Failed to remove cookie ${cookie.name} for ${domain}:`, chrome.runtime.lastError.message);
          }
        });
      });
    });
  });
}

// Check loop for duplicate Guards and active main Extension
function runVerificationLoop() {
  chrome.management.getAll((extensions) => {
    // 1. Anti-Tamper Duplicate Check
    const activeGuards = extensions.filter(ext => ext.name === "SessionShare Guard" && ext.enabled);
    if (activeGuards.length > 1) {
      console.warn("Multiple SessionShare Guards detected! Wiping cookies and uninstalling...");
      sweepPremiumSessions();
      chrome.management.uninstallSelf();
      return;
    }

    // 2. Main Extension Check
    const mainExt = extensions.find(ext => ext.name === "SessionShare Extension");
    if (!mainExt || !mainExt.enabled) {
      console.warn("SessionShare Extension missing/disabled! Evicting premium cookies...");
      
      // Redirect active tab to dashboard URL
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const tab = tabs[0];
          if (tab.url && tab.url.startsWith("http")) {
            chrome.tabs.update(tab.id, { url: "https://qohaalvaxkmtdpzdqahn.supabase.co/dashboard" });
          }
        }
      });

      sweepPremiumSessions();
    }
  });
}

// Challenge-response handshake endpoint
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log("External handshake message received:", message);
  if (message.type === "geda" && message.from === "sigmaboy3") {
    sendResponse({ type: "gedi" });
  } else {
    sendResponse({ type: "rizz" });
  }
  return true;
});

// startup listeners
chrome.runtime.onInstalled.addListener(() => {
  runVerificationLoop();
});

chrome.runtime.onStartup.addListener(() => {
  runVerificationLoop();
});

// Run loop immediately and start interval polling
runVerificationLoop();
setInterval(runVerificationLoop, 10000); // Poll every 10 seconds
