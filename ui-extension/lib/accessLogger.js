import { getAccessToken } from './supabaseClient.js';
import { SessionShareConfig } from './sessionShareConfig.js';

/**
 * Sends an audit log to the backend detailing a cookie action.
 * @param {string} serviceId - The ID of the service accessed.
 * @param {string} action - The action type: 'access' | 'inject' | 'export' | 'view'.
 * @returns {Promise<void>}
 */
export async function logCookieAccess(serviceId, action = 'inject') {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn('Cannot log cookie access: User not authenticated.');
      return;
    }

    const response = await fetch(`${SessionShareConfig.API_BASE}/logs-access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        action: action,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Failed to save access log on server:', errData.message || response.statusText);
    }
  } catch (error) {
    console.error('Error logging cookie access:', error);
  }
}
