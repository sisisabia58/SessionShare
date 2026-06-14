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
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const authError = document.getElementById('auth-error');
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
    await initApp();
  } else {
    showLoading(false);
    showAuthScreen(true);
  }
});

// App Initiation
async function initApp() {
  showAuthScreen(false);
  showLoading(true);

  // Fetch Services list
  try {
    const token = await getAccessToken();
    const response = await fetch(`${SessionShareConfig.API_BASE}/service`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    servicesData = data.services || [];
    
    renderFilters();
    renderListing();
    showLoading(false);
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
  } else {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
  }
}

// Display Auth Errors
function showError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
}

// Theme management
themeToggle.addEventListener('click', async () => {
  const isLight = document.body.classList.toggle('light-theme');
  document.body.classList.toggle('dark-theme', !isLight);
  await chrome.storage.local.set({ theme: isLight ? 'light' : 'dark' });
  updateThemeIcons(isLight);
});

function updateThemeIcons(isLight) {
  const sunIcon = themeToggle.querySelector('.theme-sun');
  const moonIcon = themeToggle.querySelector('.theme-moon');
  if (isLight) {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

// Auth Actions
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.classList.add('hidden');
  showLoading(true);

  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showLoading(false);
    showError(error.message);
  } else {
    currentUser = data.user;
    await initApp();
  }
});

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
  'All': 'All',
  'A.I': '⚡ Productivity & AI Tools',
  'Streaming': '🍿 Entertainment',
  'Design': '🖼️ Visual Creation',
  'Audio & Music': '🎧 Audio & Music',
  'Learning': '📚 Learning',
  'Essentials': '⚙️ Essentials',
  'Pro Exclusive': '👑 Pro Exclusive',
  'The Phantom Exclusive': '👻 The Phantom Exclusive'
};

function getCategoryDisplayName(cat) {
  return categoryDisplayMap[cat] || cat;
}

// Render Category Filter Tags
function renderFilters() {
  const categories = new Set(['All']);
  servicesData.forEach(s => {
    if (s.category) categories.add(s.category);
  });

  categoryFilters.innerHTML = '';
  categories.forEach(cat => {
    const filterTag = document.createElement('button');
    filterTag.className = `filter-tag ${activeCategory === cat ? 'active' : ''}`;
    filterTag.textContent = getCategoryDisplayName(cat);
    filterTag.addEventListener('click', () => {
      activeCategory = cat;
      document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
      filterTag.classList.add('active');
      renderListing();
    });
    categoryFilters.appendChild(filterTag);
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
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-text';
    placeholder.textContent = 'No services found.';
    placeholder.style.gridColumn = 'span 2';
    placeholder.style.textAlign = 'center';
    placeholder.style.padding = '24px';
    placeholder.style.color = 'var(--text-muted)';
    placeholder.style.fontSize = '12px';
    container.appendChild(placeholder);
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = `card ${item.is_folder ? 'folder-card' : ''} ${pinnedCardIds.includes(item.id) ? 'pinned' : ''}`;
    card.dataset.id = item.id;

    // Icon Wrapper
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-wrapper';

    // Card icon (Image, folder symbol, or first letter as fallback)
    const icon = document.createElement('div');
    icon.className = 'card-icon';
    if (item.is_folder) {
      icon.textContent = '📁';
    } else if (item.icon_url) {
      const img = document.createElement('img');
      img.src = item.icon_url;
      img.alt = item.name;
      img.className = 'service-logo';
      img.onerror = () => {
        img.style.display = 'none';
        icon.textContent = item.name[0];
      };
      icon.appendChild(img);
    } else {
      icon.textContent = item.name[0];
    }
    iconWrapper.appendChild(icon);

    // Pin indicator icon inside iconWrapper
    const pinIndicator = document.createElement('div');
    pinIndicator.className = 'pin-indicator';
    pinIndicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="12" x2="12" y2="22"/><path d="M12 6c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"/></svg>`;
    iconWrapper.appendChild(pinIndicator);

    // Cookie count badge
    if (!item.is_folder && item.cookie_count > 0) {
      const badge = document.createElement('div');
      badge.className = 'card-badge';
      badge.textContent = item.name.toLowerCase() === 'capcut' ? `⏳${item.cookie_count}` : item.cookie_count;
      iconWrapper.appendChild(badge);
    }

    // ChatGPT Plus banner
    if (!item.is_folder && item.name.toLowerCase() === 'chatgpt') {
      const banner = document.createElement('div');
      banner.className = 'card-plus-banner';
      banner.textContent = 'PLUS';
      iconWrapper.appendChild(banner);
    }

    card.appendChild(iconWrapper);

    // Card Title
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.name;
    card.appendChild(title);

    // Event handlers
    card.addEventListener('dblclick', () => {
      if (item.is_folder) {
        enterFolder(item.id, item.name);
      }
    });

    card.addEventListener('click', () => {
      if (!item.is_folder) {
        syncSessionCookie(item);
      }
    });

    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!item.is_folder) {
        openContextMenu(e, item.id);
      }
    });

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
const categoriesHeader = document.getElementById('categoriesHeader');
const categoriesAccordion = document.querySelector('.categories-accordion');
if (categoriesHeader && categoriesAccordion) {
  categoriesHeader.addEventListener('click', () => {
    categoriesAccordion.classList.toggle('collapsed');
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
async function syncSessionCookie(service) {
  showLoading(true);
  try {
    const token = await getAccessToken();
    const response = await fetch(`${SessionShareConfig.API_BASE}/service-cookie?service_id=${service.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
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
