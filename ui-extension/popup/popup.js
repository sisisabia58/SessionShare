import { initSupabase, getSupabase, getCurrentUser, getAccessToken } from '../lib/supabaseClient.js';
import { SessionShareConfig } from '../lib/sessionShareConfig.js';

// Application State
let supabase = null;
let currentUser = null;
let servicesData = [];
let folderHistory = [];
let currentFolderId = null;
let activeCategory = 'All';
let pinnedCardIds = [];

// DOM Elements
const loadingOverlay = document.getElementById('loading');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const paywallContainer = document.getElementById('paywall-container');
const webLoginBtn = document.getElementById('web-login-btn');
const activatePremiumBtn = document.getElementById('activate-premium-btn');
const searchInput = document.getElementById('appSearch');
const categoryFilters = document.getElementById('categoryFiltersContainer');
const servicesContainer = document.getElementById('servicesContainer');
const favoritesSection = document.getElementById('favoritesSection');
const pinnedContainer = document.getElementById('pinnedServicesContainer');
const folderNav = document.getElementById('folderNav');
const folderBackButton = document.getElementById('folderBackButton');
const currentFolderName = document.getElementById('currentFolderName');
const logoutButton = document.getElementById('logoutButton');
const themeToggle = document.getElementById('theme-toggle');
const customContextMenu = document.getElementById('customContextMenu');
const pinContextAction = document.getElementById('pinContextAction');
const pinActionText = document.getElementById('pinActionText');
const refreshButton = document.getElementById('refreshButton');
const logsButton = document.getElementById('logsButton');
const lockButton = document.getElementById('lockButton');
const megaphoneButton = document.getElementById('megaphoneButton');

// Target card currently interacted with via right click
let contextCardId = null;

// Account Picker elements
const accountPickerOverlay = document.getElementById('accountPickerOverlay');
const accountPickerClose   = document.getElementById('accountPickerClose');
const accountPickerName    = document.getElementById('accountPickerName');
const accountPickerCount   = document.getElementById('accountPickerCount');
const accountPickerIcon    = document.getElementById('accountPickerIcon');
const accountPickerList    = document.getElementById('accountPickerList');

function showAccountPicker(service) {
  accountPickerName.textContent = service.name;
  accountPickerCount.textContent = `${service.cookie_count} accounts available`;
  if (service.icon_url) {
    accountPickerIcon.innerHTML = `<img src="${service.icon_url}" alt="${service.name}"
      style="width:100%;height:100%;object-fit:cover;border-radius:10px;"
      onerror="this.parentNode.textContent='${service.name[0]}'">`;
    accountPickerIcon.style.background = '';
    accountPickerIcon.style.color = '';
  } else {
    accountPickerIcon.textContent = service.name[0];
    accountPickerIcon.style.background = '#4F46E5';
    accountPickerIcon.style.color = '#fff';
  }

  accountPickerList.innerHTML = '';
  for (let i = 1; i <= service.cookie_count; i++) {
    const btn = document.createElement('button');
    btn.className = 'account-item';
    btn.innerHTML = `
      <div class="account-avatar">${i}</div>
      <span class="account-item-label">Account ${i}</span>
      <svg class="account-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`;
    btn.addEventListener('click', () => {
      hideAccountPicker();
      syncSessionCookie(service, i);  // pass real slot number (1-based)
    });
    accountPickerList.appendChild(btn);
  }
  accountPickerOverlay.classList.remove('hidden');
}

function hideAccountPicker() {
  accountPickerOverlay.classList.add('hidden');
}

if (accountPickerClose) {
  accountPickerClose.addEventListener('click', hideAccountPicker);
}
if (accountPickerOverlay) {
  accountPickerOverlay.addEventListener('click', (e) => {
    if (e.target === accountPickerOverlay) hideAccountPicker();
  });
}

// Initial Setup
document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  
  // Initialize Supabase Client
  try {
    supabase = await initSupabase();
  } catch (err) {
    console.error("Supabase init error:", err);
    showLoading(false);
    showError("Connection failed. Please reload.");
    return;
  }

  // Check Theme Settings
  const theme = await chrome.storage.local.get('theme');
  if (theme.theme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    updateThemeIcons(true);
  }

  // Load Pinned Cards
  const pins = await chrome.storage.local.get('pinnedCards');
  pinnedCardIds = pins.pinnedCards || [];

  // Check Auth State
  currentUser = await getCurrentUser();
  if (currentUser) {
    chrome.runtime.sendMessage({ action: "checkPremiumStatus" }, (res) => {
      showLoading(false);
      if (res && res.isPremium) {
        initApp();
      } else {
        showPaywallScreen(true);
        chrome.tabs.create({ url: `${SessionShareConfig.WEBSITE_URL}/order-premium` });
      }
    });
  } else {
    showLoading(false);
    showAuthScreen(true);
  }
});

// App Initiation
async function initApp() {
  showAuthScreen(false);
  showPaywallScreen(false);
  showLoading(true);

  // Fetch Services list
  try {
    const token = await getAccessToken();
    const response = await fetch(`${SessionShareConfig.API_BASE}/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 402) {
        showLoading(false);
        showPaywallScreen(true);
        return;
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    servicesData = data.services || [];
    
    renderFilters();
    renderListing();
    showLoading(false);
    appContainer.classList.remove('hidden');
  } catch (err) {
    console.error("Failed to load services:", err);
    showLoading(false);
    showError("Could not retrieve premium services.");
  }
}

// Show/Hide Loading Overlay
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

// Show/Hide Auth Container
function showAuthScreen(show) {
  if (show) {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    showPaywallScreen(false);
  } else {
    authContainer.classList.add('hidden');
  }
}

// Show/Hide Paywall Container
function showPaywallScreen(show) {
  if (show) {
    paywallContainer.classList.remove('hidden');
    authContainer.classList.add('hidden');
    appContainer.classList.add('hidden');
  } else {
    paywallContainer.classList.add('hidden');
  }
}

// Display Auth Errors
function showError(message) {
  console.error("Auth error:", message);
  alert(message);
}

// Theme management
themeToggle.addEventListener('click', async () => {
  const isLight = document.body.classList.toggle('light-theme');
  document.body.classList.toggle('dark-theme', !isLight);
  await chrome.storage.local.set({ theme: isLight ? 'light' : 'dark' });
  updateThemeIcons(isLight);
});

function updateThemeIcons(isLight) {
  // CSS handles icon visibility via body.light-theme / body.dark-theme classes.
  // No-op needed — leave empty for compatibility.
}

// Web Login & Activation Actions
if (webLoginBtn) {
  webLoginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${SessionShareConfig.WEBSITE_URL}/login` });
  });
}

if (activatePremiumBtn) {
  activatePremiumBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${SessionShareConfig.WEBSITE_URL}/order-premium` });
  });
}

logoutButton.addEventListener('click', async () => {
  showLoading(true);
  await supabase.auth.signOut();
  currentUser = null;
  servicesData = [];
  folderHistory = [];
  currentFolderId = null;
  pinnedContainer.innerHTML = '';
  servicesContainer.innerHTML = '';
  showAuthScreen(true);
  showLoading(false);
});

const categoryDisplayMap = {
  'All':                   { emoji: '🔲', label: 'All' },
  'A.I':                   { emoji: '⚡', label: 'Productivity & AI Tools' },
  'Streaming':             { emoji: '🍿', label: 'Entertainment' },
  'Design':                { emoji: '🖼️', label: 'Visual Creation' },
  'Audio & Music':         { emoji: '🎧', label: 'Audio & Music' },
  'Learning':              { emoji: '📗', label: 'Learning' },
  'Essentials':            { emoji: '⚙️', label: 'Essentials' },
  'Pro Exclusive':         { emoji: '👑', label: 'Pro Exclusive' },
  'The Phantom Exclusive': { emoji: '👻', label: 'The Phantom Exclusive' },
};

function renderFilters() {
  const categorySlugs = new Set(['All']);
  servicesData.forEach(s => { if (s.category) categorySlugs.add(s.category); });

  categoryFilters.innerHTML = '';
  categorySlugs.forEach(slug => {
    const meta = categoryDisplayMap[slug] || { emoji: '', label: slug };
    const tag = document.createElement('button');
    tag.className = `filter-tag ${activeCategory === slug ? 'active' : ''}`;
    tag.dataset.slug = slug;
    tag.innerHTML = `<span>${meta.emoji}</span><span>${meta.label}</span>`;
    tag.addEventListener('click', () => {
      activeCategory = slug;
      document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      renderListing();
    });
    categoryFilters.appendChild(tag);
  });
}

// Filter and Render Services Listing
function renderListing() {
  const query = searchInput.value.toLowerCase();
  
  // Filter by category, search query, and current folder level
  const filtered = servicesData.filter(s => {
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(query) || (s.website_url && s.website_url.toLowerCase().includes(query));
    
    // In search mode, ignore folder depth and show matched results directly
    if (query.length > 0) {
      return matchesCategory && matchesSearch && !s.is_folder;
    }
    
    const matchesFolder = s.folder_id === currentFolderId;
    return matchesCategory && matchesFolder;
  });

  // Render Pinned Grid (Only on Root level and not in search mode)
  if (currentFolderId === null && query.length === 0) {
    const pinnedCards = servicesData.filter(s => pinnedCardIds.includes(s.id) && !s.is_folder);
    if (pinnedCards.length > 0) {
      favoritesSection.classList.remove('hidden');
      renderGrid(pinnedContainer, pinnedCards);
    } else {
      favoritesSection.classList.add('hidden');
    }
  } else {
    favoritesSection.classList.add('hidden');
  }

  // Render main Grid
  renderGrid(servicesContainer, filtered);
}

// Helper to render grid cells
function renderGrid(container, items) {
  container.innerHTML = '';
  if (items.length === 0) {
    const ph = document.createElement('div');
    ph.className = 'empty-state-text';
    ph.textContent = 'No services found.';
    container.appendChild(ph);
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `card ${item.is_folder ? 'folder-card' : ''} ${pinnedCardIds.includes(item.id) ? 'pinned' : ''}`;
    card.dataset.id = item.id;

    // Icon Wrapper
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-wrapper';

    const icon = document.createElement('div');
    icon.className = 'card-icon';
    if (item.is_folder) {
      icon.textContent = '📁';
    } else if (item.icon_url) {
      const img = document.createElement('img');
      img.src = item.icon_url;
      img.alt = item.name;
      img.className = 'service-logo';
      img.onerror = () => { img.style.display = 'none'; icon.textContent = item.name[0]; };
      icon.appendChild(img);
    } else {
      icon.textContent = item.name[0];
    }
    iconWrapper.appendChild(icon);

    const pinIndicator = document.createElement('div');
    pinIndicator.className = 'pin-indicator';
    pinIndicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="12" x2="12" y2="22"/><path d="M12 6c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"/></svg>`;
    iconWrapper.appendChild(pinIndicator);

    if (!item.is_folder && item.cookie_count > 0) {
      const badge = document.createElement('div');
      badge.className = 'card-badge';
      badge.textContent = item.name.toLowerCase() === 'capcut' ? `⏳${item.cookie_count}` : item.cookie_count;
      iconWrapper.appendChild(badge);
    }

    if (!item.is_folder && item.name.toLowerCase() === 'chatgpt') {
      const banner = document.createElement('div');
      banner.className = 'card-plus-banner';
      banner.textContent = 'PLUS';
      iconWrapper.appendChild(banner);
    }

    card.appendChild(iconWrapper);

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.name;
    card.appendChild(title);

    card.addEventListener('dblclick', () => { if (item.is_folder) enterFolder(item.id, item.name); });
    card.addEventListener('click', () => {
      if (!item.is_folder) {
        if (item.cookie_count > 1) {
          showAccountPicker(item);
        } else {
          syncSessionCookie(item);
        }
      }
    });
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!item.is_folder) openContextMenu(e, item.id);
    });

    // Stagger animation
    card.style.animationDelay = `${index * 30}ms`;
    card.classList.add('animate-in');

    container.appendChild(card);
  });
}

// Folder Navigation
function enterFolder(folderId, folderName) {
  folderHistory.push({ id: currentFolderId, name: currentFolderName.textContent });
  currentFolderId = folderId;
  
  currentFolderName.textContent = folderName;
  folderNav.classList.remove('hidden');
  searchInput.value = ''; // Clear search when navigating
  renderListing();
}

folderBackButton.addEventListener('click', () => {
  const previous = folderHistory.pop();
  if (previous) {
    currentFolderId = previous.id;
    currentFolderName.textContent = previous.name;
    if (currentFolderId === null) {
      folderNav.classList.add('hidden');
    }
    renderListing();
  }
});

// Context Menu (Pin/Unpin logic)
function openContextMenu(e, cardId) {
  contextCardId = cardId;
  const isPinned = pinnedCardIds.includes(cardId);
  pinActionText.textContent = isPinned ? 'Unpin Card' : 'Pin Card';

  // Position context menu
  const rect = appContainer.getBoundingClientRect();
  const menuX = Math.min(e.clientX - rect.left, rect.width - 130);
  const menuY = Math.min(e.clientY - rect.top, rect.height - 40);

  customContextMenu.style.left = `${menuX}px`;
  customContextMenu.style.top = `${menuY}px`;
  customContextMenu.classList.remove('hidden');

  // Dismiss context menu on click elsewhere
  document.addEventListener('click', closeContextMenu);
}

function closeContextMenu() {
  customContextMenu.classList.add('hidden');
  document.removeEventListener('click', closeContextMenu);
}

pinContextAction.addEventListener('click', async () => {
  if (!contextCardId) return;

  const idx = pinnedCardIds.indexOf(contextCardId);
  if (idx !== -1) {
    pinnedCardIds.splice(idx, 1);
  } else {
    pinnedCardIds.push(contextCardId);
  }

  await chrome.storage.local.set({ pinnedCards: pinnedCardIds });
  renderListing();
  closeContextMenu();
});

// Search input listener
searchInput.addEventListener('input', () => {
  renderListing();
});

// Categories Accordion Toggle
const categoriesSection = document.getElementById('categoriesSection');
const categoriesHeader  = document.getElementById('categoriesHeader');
if (categoriesHeader && categoriesSection) {
  categoriesHeader.addEventListener('click', () => {
    categoriesSection.classList.toggle('collapsed');
  });
}

// Footer Button Event Listeners
if (refreshButton) {
  refreshButton.addEventListener('click', () => {
    initApp();
  });
}
if (logsButton) {
  logsButton.addEventListener('click', () => {
    alert("Activity Logs feature coming soon!");
  });
}
if (lockButton) {
  lockButton.addEventListener('click', () => {
    alert("Security Lock feature coming soon!");
  });
}
if (megaphoneButton) {
  megaphoneButton.addEventListener('click', () => {
    alert("Announcements feature coming soon!");
  });
}

// Cookie Synchronization (Injection)
async function syncSessionCookie(service, accountSlot = 1) {
  showLoading(true);
  try {
    const token = await getAccessToken();
    const slotQuery = accountSlot > 1 ? `&account_slot=${accountSlot}` : '';
    const response = await fetch(`${SessionShareConfig.API_BASE}/service-cookie?service_id=${service.id}${slotQuery}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errCode = errData.error?.code || '';
      if (response.status === 402 || errCode === 'PREMIUM_REQUIRED') {
        showLoading(false);
        showPaywallScreen(true);
        chrome.tabs.create({ url: `${SessionShareConfig.WEBSITE_URL}/order-premium` });
        return;
      }
      throw new Error(errData.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    const cookieData = JSON.parse(data.cookie_data);
    const domainUrl = new URL(service.website_url);

    // Call background.js to clear previous and set new cookies
    chrome.runtime.sendMessage({
      action: "clearCookiesv2",
      payload: {
        domain: domainUrl.hostname,
        cookies: cookieData
      }
    }, (res) => {
      showLoading(false);
      if (res && res.success) {
        // Open target url in a new tab
        chrome.tabs.create({ url: service.website_url });
      } else {
        alert("Failed to inject premium session: " + (res?.error || "Unknown error"));
      }
    });

  } catch (err) {
    console.error("Cookie sync failed:", err);
    showLoading(false);
    alert("Session load failed. Please check your network or token.");
  }
}
