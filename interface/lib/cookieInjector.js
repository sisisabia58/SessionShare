import { getAccessToken } from './supabaseClient.js';
import { SessionShareConfig } from './sessionShareConfig.js';

/**
 * Helper to construct the target URL for a cookie.
 * @param {object} cookie 
 * @returns {string} url
 */
function getCookieUrl(cookie) {
  const domain = cookie.domain || '';
  const isSecure = cookie.secure || false;
  const path = cookie.path || '/';
  
  let cleanDomain = domain;
  if (cleanDomain.startsWith('.')) {
    cleanDomain = cleanDomain.substring(1);
  }
  
  const protocol = isSecure ? 'https://' : 'http://';
  return protocol + cleanDomain + path;
}

/**
 * Fetches and injects cookies for a given service.
 * @param {string} serviceId 
 * @returns {Promise<void>}
 */
export async function injectServiceCookies(serviceId) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  // 1. Fetch encrypted/decrypted cookies from Edge Function
  const response = await fetch(`${SessionShareConfig.API_BASE}/service-cookie?service_id=${serviceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to fetch service cookies (HTTP ${response.status})`);
  }

  const { cookie_data } = await response.json();
  if (!cookie_data) {
    throw new Error('No cookie data received from server.');
  }

  const cookies = JSON.parse(cookie_data);
  if (!Array.isArray(cookies)) {
    throw new Error('Invalid cookie data format received from server.');
  }

  // 2. Inject cookies using chrome.cookies API
  // Detect if we have chrome.cookies API
  const api = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
  if (!api || !api.cookies) {
    throw new Error('Extension cookies API is not available.');
  }

  const injectionPromises = cookies.map(cookie => {
    return new Promise((resolve) => {
      const url = getCookieUrl(cookie);
      
      // Map properties to match chrome.cookies.set details
      const details = {
        url: url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || undefined,
        path: cookie.path || undefined,
        secure: cookie.secure ?? undefined,
        httpOnly: cookie.httpOnly ?? undefined,
        sameSite: cookie.sameSite || undefined,
      };

      // If expirationDate is present, ensure it is a number or null
      if (cookie.expirationDate !== undefined && cookie.expirationDate !== null) {
        details.expirationDate = Number(cookie.expirationDate);
      }

      // If hostOnly is true, domain should not be passed to chrome.cookies.set
      if (cookie.hostOnly) {
        delete details.domain;
      }

      api.cookies.set(details, (cookieResult) => {
        const err = api.runtime ? api.runtime.lastError : null;
        if (err || !cookieResult) {
          console.error(`Failed to set cookie: ${cookie.name}`, err);
          resolve({ name: cookie.name, success: false, error: err ? err.message : 'Unknown error' });
        } else {
          resolve({ name: cookie.name, success: true });
        }
      });
    });
  });

  const results = await Promise.all(injectionPromises);
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.warn(`Failed to inject some cookies:`, failures);
    throw new Error(`Injected with errors. Failed to set: ${failures.map(f => f.name).join(', ')}`);
  }

  // 3. Log access audit event asynchronously
  try {
    const { logCookieAccess } = await import('./accessLogger.js');
    await logCookieAccess(serviceId, 'inject');
  } catch (logErr) {
    console.error('Failed to log cookie injection event:', logErr);
  }
}
