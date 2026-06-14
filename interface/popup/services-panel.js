import { getAccessToken } from '../lib/supabaseClient.js';
import { SessionShareConfig } from '../lib/sessionShareConfig.js';

/**
 * Services panel — displays available premium services
 * and allows one-click cookie injection.
 */
export class ServicesPanel {
  constructor(containerElement) {
    this.container = containerElement;
    this.services = [];
  }

  async loadServices() {
    let token;
    try {
      token = await getAccessToken();
    } catch (err) {
      console.error('Failed to retrieve access token:', err);
    }

    if (!token) {
      this.container.innerHTML = '<div class="error">Authentication token not found. Please re-login.</div>';
      return;
    }

    this.container.innerHTML = '<div class="loading">Loading services...</div>';

    try {
      const response = await fetch(`${SessionShareConfig.API_BASE}/service`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load services');

      const data = await response.json();
      this.services = (data.services || []).filter(s => !s.is_folder);
      this.render();
    } catch (error) {
      this.container.innerHTML = `<div class="error">Failed to load services: ${error.message}</div>`;
    }
  }

  render() {
    if (this.services.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No services available yet.</div>';
      return;
    }

    this.container.innerHTML = this.services.map(service => {
      let hostname = '';
      try {
        hostname = new URL(service.website_url).hostname;
      } catch {
        hostname = service.website_url;
      }

      const badgeText = service.cookie_count > 0 ? ` (${service.cookie_count})` : '';

      return `
        <div class="service-card" data-service-id="${service.id}">
          <img class="service-icon" src="${service.icon_url || '../../icons/cookie-32-filled.png'}" 
               alt="${service.name}" onerror="this.src='../../icons/cookie-32-filled.png'">
          <div class="service-info">
            <h3 class="service-name">${service.name}${badgeText}</h3>
            <a class="service-url" href="${service.website_url}" target="_blank">${hostname}</a>
          </div>
          <button class="btn-inject" data-service-id="${service.id}" title="Inject session cookies">
            Use Session ▶
          </button>
        </div>
      `;
    }).join('');

    // Attach inject handlers
    this.container.querySelectorAll('.btn-inject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        let target = e.target;
        if (target.nodeName !== 'BUTTON') {
          target = target.closest('button');
        }
        const serviceId = target.dataset.serviceId;
        this.injectServiceCookie(serviceId, target);
      });
    });
  }

  async injectServiceCookie(serviceId, button) {
    const originalText = button.textContent;
    button.textContent = 'Injecting...';
    button.disabled = true;
    button.classList.remove('success', 'error');

    try {
      const { injectServiceCookies } = await import('../lib/cookieInjector.js');
      await injectServiceCookies(serviceId);
      
      button.textContent = 'Success! ✓';
      button.classList.add('success');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('success');
      }, 2000);
    } catch (error) {
      console.error('Cookie injection failed:', error);
      button.textContent = 'Failed ✗';
      button.classList.add('error');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('error');
      }, 3000);
    }
  }
}
