/**
 * SessionShare Extension Content Script
 * Executes DOM sanitization and page script injections.
 */

// Inject sessionshare.js into target page global context (for fetch interception)
function injectScript() {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('ui-extension/content/sessionshare.js');
    script.type = 'text/javascript';
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
    console.log("SessionShare interceptor script injected.");
  } catch (err) {
    console.error("SessionShare script injection failed:", err);
  }
}

// UI Sanitization Loop (Global scrubbing of settings, logout, upgrade buttons, billing links)
function sanitizeDOM() {
  const host = window.location.hostname;

  // ─── LAYER 2A: Global selector-based hiding ───────────────────────────────
  // Hides anchor elements pointing to known dangerous paths on ANY website.
  const globalSelectors = [
    'a[href*="/logout"]',
    'a[href*="/signout"]',
    'a[href*="/sign-out"]',
    'a[href*="/settings"]',
    'a[href*="/account/settings"]',
    'a[href*="/billing"]',
    'a[href*="/subscription"]',
    'a[href*="/manage-subscription"]',
    'a[href*="/pricing"]',
    'a[href*="/vip"]',
    'a[href*="/upgrade"]',
    'a[href*="/checkout"]',
    'a[href*="/EditProfiles"]',
    'a[href*="/ManageProfiles"]',
    'a[href*="/YourAccount"]',
  ];
  globalSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    });
  });

  // ─── LAYER 2B: Global text-based menu item hiding ─────────────────────────
  // Hides interactive elements whose visible text exactly matches known logout/settings labels.
  // Uses exact-match to avoid hiding unrelated elements (e.g. a button labelled "Settings & Tips").
  const blockedLabels = [
    'sign out', 'signout', 'log out', 'logout',
    'settings', 'account settings',
    'subscription', 'manage subscription', 'manage plan',
    'billing', 'payment',
    'upgrade', 'upgrade plan', 'upgrade to pro',
    'go pro', 'get pro', 'join pro', 'vip', 'join vip',
    'manage account', 'account & billing',
  ];
  document.querySelectorAll('a, button, [role="menuitem"], li, span, div').forEach(el => {
    // Only inspect leaf-like elements (avoids nuking entire nav sections)
    if (el.children.length <= 2) {
      const text = el.textContent.toLowerCase().trim();
      if (blockedLabels.includes(text)) {
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
      }
    }
  });

  // ─── LAYER 2C: Site-specific overrides ────────────────────────────────────

  if (host.includes('chatgpt.com')) {
    // Hide upgrade prompts by CSS class patterns (these don't rely on href)
    const chatgptUpgradeSelectors = [
      'div[class*="upgrade"]',
      'button[class*="upgrade"]',
      '.bg-token-main-surface-secondary button',
      'div[class*="Get Plus"]',
      'div[class*="Get Team"]',
      'div[class*="delete-chat-menu-item"]',
      'button[class*="delete-conversation"]',
      'button[class*="delete-all-chats"]',
      'button[class*="archive-all-chats"]',
    ];
    chatgptUpgradeSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.display = 'none';
      });
    });

    // Replace User Profile Avatar with SessionShare brand logo
    document.querySelectorAll('img[src*="avatar"], div[class*="avatar"]').forEach(avatar => {
      if (avatar.tagName === 'IMG') {
        avatar.src = 'https://www.sessionshare.web.id/logo.png';
      } else {
        avatar.style.backgroundImage = 'url(https://www.sessionshare.web.id/logo.png)';
        avatar.style.backgroundSize = 'cover';
      }
    });
  }
}

// Perform initial sequences
injectScript();
sanitizeDOM();

// Start periodic interval for UI sanitization (every 200ms)
setInterval(sanitizeDOM, 200);
