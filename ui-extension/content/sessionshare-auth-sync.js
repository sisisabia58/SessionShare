/**
 * SessionShare Extension Auth Sync Content Script
 * Synchronizes the Supabase authentication token from the website to the extension.
 */

function syncToken() {
  const key = 'sb-qohaalvaxkmtdpzdqahn-auth-token';
  try {
    const token = localStorage.getItem(key);
    chrome.runtime.sendMessage({ action: "syncSessionToken", token }, (res) => {
      if (chrome.runtime.lastError) {
        console.warn("Sync message error:", chrome.runtime.lastError.message);
      } else {
        console.log("SessionShare auth sync response:", res);
      }
    });
  } catch (err) {
    console.error("SessionShare failed to read localStorage:", err);
  }
}

// Perform initial sync
syncToken();

// Listen for storage changes (login/logout events on the web app)
window.addEventListener('storage', (e) => {
  if (e.key === 'sb-qohaalvaxkmtdpzdqahn-auth-token') {
    syncToken();
  }
});
