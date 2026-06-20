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

// UI Sanitization Loop (Scrubbing settings, upgrade buttons, billing links)
function sanitizeDOM() {
  const host = window.location.hostname;

  if (host.includes('chatgpt.com')) {
    // 1. Hide Upgrade Buttons / Prompts
    const upgradeSelectors = [
      'a[href*="/pricing"]',
      'a[href*="/checkout"]',
      'div[class*="upgrade"]',
      'button[class*="upgrade"]',
      '.bg-token-main-surface-secondary button',
      'div[class*="Get Plus"]',
      'div[class*="Get Team"]'
    ];
    upgradeSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.display = 'none';
      });
    });

    // 2. Hide User profile settings & Deletion elements
    const settingsSelectors = [
      'div[role="menuitem"]:has(a[href*="/settings"])',
      'div[class*="delete-chat-menu-item"]',
      'button[class*="delete-conversation"]',
      'button[class*="delete-all-chats"]',
      'button[class*="archive-all-chats"]',
      'div[role="menuitem"]:has(svg path[d*="M12"])' // matches settings icon paths sometimes
    ];
    settingsSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.display = 'none';
      });
    });

    // 3. Replace User Profile Avatar with Brand Display Logo
    const avatars = document.querySelectorAll('img[src*="avatar"], div[class*="avatar"]');
    avatars.forEach(avatar => {
      if (avatar.tagName === 'IMG') {
        avatar.src = 'https://www.sessionshare.web.id/logo.png';
      } else {
        avatar.style.backgroundImage = 'url(https://www.sessionshare.web.id/logo.png)';
        avatar.style.backgroundSize = 'cover';
      }
    });
  }

  if (host.includes('netflix.com')) {
    // Hide account setting access to prevent password/subscription changes
    const netflixSelectors = [
      'a[href*="/YourAccount"]',
      'a[href*="/EditProfiles"]',
      'a[href*="/ManageProfiles"]',
      'a[href*="/signout"]'
    ];
    netflixSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.3';
      });
    });
  }
}

// Perform initial sequences
injectScript();
sanitizeDOM();

// Start periodic interval for UI sanitization (every 200ms)
setInterval(sanitizeDOM, 200);
