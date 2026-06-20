/**
 * SessionShare Extension Background Service Worker
 */

// Initialize declarativeNetRequest rules for header injection and tab blocking
async function registerNetRules() {
  const rules = [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [{
          header: "oai-device-id",
          operation: "set",
          value: "a749af93-4e7d-4ed1-82d9-1221c72c09dd"
        }]
      },
      condition: {
        urlFilter: "*chatgpt.com*",
        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "other"]
      }
    },
    {
      id: 2,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: "*logout*",
        resourceTypes: ["main_frame", "xmlhttprequest", "other"]
      }
    },
    {
      id: 3,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: "*signout*",
        resourceTypes: ["main_frame", "xmlhttprequest", "other"]
      }
    },
    {
      id: 4,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: "*sign-out*",
        resourceTypes: ["main_frame", "xmlhttprequest", "other"]
      }
    },
    {
      id: 5,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: "*billing.stripe.com/p/session*",
        resourceTypes: ["main_frame", "xmlhttprequest", "other"]
      }
    },
    {
      id: 6,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: "*checkout.you.com/p/session*",
        resourceTypes: ["main_frame", "xmlhttprequest", "other"]
      }
    }
  ];

  try {
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(r => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: rules
    });
    console.log("declarativeNetRequest rules registered successfully.");
  } catch (err) {
    console.error("Failed to register declarativeNetRequest rules:", err);
  }
}

// Polling loop to verify SessionShare Guard integrity
function verifySessionShareGuard() {
  chrome.management.getAll((extensions) => {
    const guard = extensions.find(ext => ext.name === "SessionShare Guard");
    if (!guard || !guard.enabled) {
      console.warn("SessionShare Guard is missing or disabled! Enforcement triggered.");
      
      // Redirect active tab to guardrequired landing page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const tab = tabs[0];
          // Only redirect if visiting web pages
          if (tab.url && tab.url.startsWith("http")) {
            chrome.tabs.update(tab.id, { url: "https://qohaalvaxkmtdpzdqahn.supabase.co/guardrequired" });
          }
        }
      });

      // Self-disable the SessionShare Extension
      chrome.management.setEnabled(chrome.runtime.id, false);
    }
  });
}

// Handshake listener for external messages from SessionShare Guard
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log("External message received:", message);
  if (message.type === "geda" && message.from === "sigmaboy3") {
    sendResponse({ type: "gedi" });
  } else {
    sendResponse({ type: "rizz" });
  }
  return true;
});

// Helper to retrieve token from storage
async function getSessionToken() {
  const key = 'sb-qohaalvaxkmtdpzdqahn-auth-token';
  const result = await chrome.storage.local.get(key);
  const sessionStr = result[key];
  if (!sessionStr) return null;
  try {
    const session = JSON.parse(sessionStr);
    return session.access_token || null;
  } catch (e) {
    return null;
  }
}

// Fetch premium status from user-profile API
async function checkPremiumStatus() {
  const token = await getSessionToken();
  if (!token) {
    return { isPremium: false, plan: 'free', premium_until: null };
  }

  try {
    const response = await fetch('https://qohaalvaxkmtdpzdqahn.supabase.co/functions/v1/user-profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return { isPremium: false, plan: 'free', premium_until: null };
    }

    const data = await response.json();
    const profile = data.profile;
    if (!profile) {
      return { isPremium: false, plan: 'free', premium_until: null };
    }

    const isPremium = (profile.plan !== 'free' && profile.premium_until && new Date(profile.premium_until) > new Date()) || profile.role === 'admin';

    return {
      isPremium,
      plan: profile.plan || 'free',
      premium_until: profile.premium_until || null
    };
  } catch (err) {
    console.error("Failed to verify premium status:", err);
    return { isPremium: false, plan: 'free', premium_until: null };
  }
}

// Listener for popup messages (cookie sync & clearing)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "syncSessionToken") {
    const key = 'sb-qohaalvaxkmtdpzdqahn-auth-token';
    if (request.token) {
      chrome.storage.local.set({ [key]: request.token }, () => {
        sendResponse({ success: true, action: "set" });
      });
    } else {
      chrome.storage.local.remove(key, () => {
        sendResponse({ success: true, action: "remove" });
      });
    }
    return true; // Keep channel open for async response
  }

  if (request.action === "checkPremiumStatus") {
    checkPremiumStatus().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === "clearCookiesv2") {
    const { domain, cookies } = request.payload;
    
    // Clear cookies for origin and subdomains
    chrome.browsingData.remove({
      origins: [`https://${domain}`, `https://www.${domain}`]
    }, {
      cookies: true
    }, () => {
      // Set new cookies
      const promises = cookies.map(c => {
        // Build correct cookie URL
        const domainClean = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
        const url = `https://${domainClean}${c.path}`;
        
        const cookieDetails = {
          url: url,
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure ?? true,
          httpOnly: c.httpOnly ?? false,
        };

        if (c.expirationDate) {
          cookieDetails.expirationDate = c.expirationDate;
        }

        if (c.sameSite) {
          // If 'no_restriction', map it. Note: Chrome expects exactly "no_restriction", "lax", "strict", or "unspecified"
          cookieDetails.sameSite = c.sameSite;
        }

        return chrome.cookies.set(cookieDetails).catch(err => {
          console.error(`Failed to set cookie ${c.name} for ${domainClean}:`, err);
        });
      });
      
      Promise.all(promises)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true; // Keep channel open for async response
  }
});

// Perform startup sequences
chrome.runtime.onInstalled.addListener(() => {
  registerNetRules();
  verifySessionShareGuard();
});

chrome.runtime.onStartup.addListener(() => {
  registerNetRules();
  verifySessionShareGuard();
});

// Run immediate verification and start polling
verifySessionShareGuard();
setInterval(verifySessionShareGuard, 10000);
