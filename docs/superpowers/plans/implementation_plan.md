# SessionShare — Revised Implementation Plan

> **Methodology:** Written using the [superpowers:writing-plans](file:///D:/Private/Coding%20Project/superpowers/skills/writing-plans/SKILL.md) skill.
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

**Goal:** Build SessionShare by forking the [cookie-editor](https://github.com/Moustachauve/cookie-editor) Chrome extension and adding a Supabase backend for authenticated, shared session cookie distribution across premium services.

**Architecture:** The cookie-editor extension is forked and extended with: (1) a login/auth UI powered by Supabase Auth, (2) a "Services" panel for browsing available premium services, (3) one-click cookie injection from the backend, and (4) audit logging. The Supabase backend serves encrypted cookie payloads via Edge Functions with RLS, rate limiting, and role-based access.

**Tech Stack:**
- **Extension:** Vanilla JS (ES modules), MV3 Chrome extension, forked from cookie-editor
- **Backend:** Supabase (Edge Functions/Deno, Postgres, Auth, Storage)
- **Encryption:** AES-256-GCM (Web Crypto API)
- **Build:** Grunt (existing cookie-editor build system)

---

## Cookie-Editor Codebase Map

Understanding the existing repo before modifying it:

```
cookie-editor/                         # ← We fork this
├── cookie-editor.js                   # Background service worker (MV3)
├── manifest.chrome.json               # MV3 manifest (permissions, service_worker)
├── manifest.firefox.json              # Firefox variant
├── Gruntfile.js                       # Build: version bumping in manifests
├── package.json                       # Dev deps (eslint, prettier, grunt)
├── interface/
│   ├── popup/
│   │   ├── cookie-list.html           # Main popup HTML (13KB)
│   │   ├── cookie-list.js             # Main popup logic (40KB!) — cookie list UI
│   │   ├── cookieHandlerPopup.js      # Cookie CRUD via chrome.cookies API
│   │   ├── style.css                  # Light theme styles
│   │   └── dark.css                   # Dark theme overrides
│   ├── popup-mobile/                  # Mobile variant (Firefox Android, iOS)
│   ├── devtools/                      # DevTools panel variant
│   ├── sidepanel/                     # Chrome side panel variant
│   ├── options/                       # Extension options page
│   ├── lib/
│   │   ├── genericCookieHandler.js    # Base class: getAllCookies, prepareCookie, saveCookie
│   │   ├── cookie.js                  # Cookie model class (18KB)
│   │   ├── browserDetector.js         # Cross-browser API abstraction
│   │   ├── optionsHandler.js          # User preferences
│   │   ├── permissionHandler.js       # Permission checks
│   │   ├── jsonFormat.js              # JSON import/export format
│   │   ├── netscapeFormat.js          # Netscape import/export format
│   │   ├── headerstringFormat.js      # Header string format
│   │   ├── animate.js                 # UI animations
│   │   ├── themeHandler.js            # Dark/light theme
│   │   └── eventEmitter.js            # Event system
│   ├── sprites/                       # SVG icons
│   └── theme/                         # Theme CSS files
├── icons/                             # Extension icons (16-128px)
└── site/                              # Marketing site
```

**Key integration points for SessionShare:**
1. `cookie-editor.js` → Add Supabase auth state management in background
2. `interface/popup/cookie-list.html` → Add login UI + services tab
3. `interface/popup/cookie-list.js` → Add service browsing + remote cookie injection logic
4. `interface/lib/genericCookieHandler.js` → Extend with `injectCookies(cookieArray)` method
5. `manifest.chrome.json` → Add `identity` permission, update CSP for Supabase URLs

---

## Updated DAG Dependency Graph

```mermaid
graph TD
  A0["Task 0: Fork & Clone cookie-editor"]
  A1["Task 1: Supabase Project & Auth Foundation"]
  A2["Task 2: Core Data Model Migration"]
  A3["Task 3: Encrypted Cookie Logic"]
  A4["Task 4: Edge Functions API Scaffold"]
  
  A0 --> EXT1["Task 5: Extension Auth Integration"]
  A1 --> EXT1
  A0 --> A1
  A1 --> A2
  A1 --> A4
  A2 --> A3
  
  A2 --> B1["Task 6: Services Endpoint + Extension UI"]
  A4 --> B1
  EXT1 --> B1
  
  A3 --> B2["Task 7: Cookie Endpoint + Extension Injection"]
  A4 --> B2
  EXT1 --> B2
  
  A2 --> B3["Task 8: Access Logging (API + Extension)"]
  A4 --> B3
  EXT1 --> B3
  
  A2 --> B4["Task 9: Admin Service Management"]
  A4 --> B4
  
  A3 --> B5["Task 10: Admin Cookie Upload"]
  A4 --> B5
  
  A4 --> C1["Task 11: Rate Limiting"]
  A4 --> D1["Task 12: RLS & Role Enforcement"]
  A2 --> D1
  B3 --> F1["Task 13: Admin Dashboard"]
  A4 --> F1
```

**Execution order:**
- **Layer 0:** Task 0 (fork repo — root node)
- **Layer 1:** Task 1 (Supabase setup, depends on fork existing)
- **Layer 2:** Task 2 + Task 4 (DB migrations + API scaffold, parallel)
- **Layer 3:** Task 3 + Task 5 (encryption + extension auth, parallel)
- **Layer 4:** Tasks 6, 7, 8, 9, 10, 11, 12 (endpoints + extension features)
- **Layer 5:** Task 13 (admin dashboard, depends on logging)

---

## Task Summary

| # | Name | Workstream | What Changes |
|---|------|-----------|-------------|
| 0 | Fork & Clone cookie-editor | Extension | Fork repo, rebrand, add Supabase deps |
| 1 | Supabase Project & Auth | Backend | Init Supabase, env vars, auth config |
| 2 | Core Data Model | Backend | 4 SQL migrations + seed data |
| 3 | Encryption Logic | Backend | AES-256-GCM module + tests |
| 4 | API Scaffold | Backend | CORS, auth middleware, error handling |
| **5** | **Extension Auth Integration** | **Extension** | **Login/signup UI in popup, JWT storage, auth state** |
| **6** | **Services Endpoint + Extension UI** | **Both** | **API + "Services" tab in popup with service cards** |
| **7** | **Cookie Endpoint + Injection** | **Both** | **API + one-click "Use Session" button → inject cookies** |
| **8** | **Access Logging** | **Both** | **API + extension sends access logs on inject** |
| 9 | Admin Service CRUD | Backend | Admin-only service creation endpoint |
| 10 | Admin Cookie Upload | Backend | Admin-only encrypted cookie upload |
| 11 | Rate Limiting | Backend | Sliding window middleware |
| 12 | RLS & Roles | Backend | Comprehensive RLS policies |
| 13 | Admin Dashboard | Backend | Stats/monitoring endpoint |

---

## Task 0: Fork & Clone cookie-editor

**Dependencies:** None (root node)

**What happens:** Fork the cookie-editor repo, rebrand it as SessionShare, set up the project structure to colocate the extension code with the Supabase backend.

**Files:**
- Fork: `https://github.com/Moustachauve/cookie-editor` → `SessionShare/`
- Modify: `manifest.chrome.json` — add permissions, update name
- Modify: `package.json` — add Supabase client dependency
- Create: `supabase/` directory structure (for backend)
- Create: `interface/lib/supabaseClient.js` — Supabase client for extension
- Create: `interface/lib/sessionShareConfig.js` — config constants

### Steps

- [ ] **Step 1: Download and extract cookie-editor**

```powershell
Invoke-WebRequest -Uri "https://github.com/Moustachauve/cookie-editor/archive/refs/heads/master.zip" -OutFile "$env:TEMP\cookie-editor.zip" -UseBasicParsing
Expand-Archive -Path "$env:TEMP\cookie-editor.zip" -DestinationPath "D:\Private\Coding Project" -Force
Rename-Item "D:\Private\Coding Project\cookie-editor-master" "D:\Private\Coding Project\SessionShare"
Remove-Item "$env:TEMP\cookie-editor.zip"
```

- [ ] **Step 2: Update manifest.chrome.json — rebrand + add permissions**

Modify `manifest.chrome.json`:

```json
{
  "manifest_version": 3,
  "name": "SessionShare",
  "version": "1.0.0",
  "author": "SessionShare",
  "description": "Share and inject session cookies for premium services securely.",
  "offline_enabled": false,
  "minimum_chrome_version": "102",
  "permissions": [
    "cookies",
    "tabs",
    "storage",
    "identity"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://*.supabase.co"
  },
  "background": {
    "service_worker": "cookie-editor.js",
    "type": "module"
  },
  "action": {
    "default_icon": {
      "16": "icons/cookie-16-filled.png",
      "19": "icons/cookie-19-filled.png",
      "32": "icons/cookie-32-filled.png",
      "38": "icons/cookie-38-filled.png"
    },
    "default_popup": "interface/popup/cookie-list.html"
  },
  "icons": {
    "16": "icons/cookie-16-filled.png",
    "32": "icons/cookie-32-filled.png",
    "48": "icons/cookie-48-filled.png",
    "128": "icons/cookie-128-filled.png"
  }
}
```

Key changes from original:
- Name: `Cookie-Editor` → `SessionShare`
- Added `identity` permission (for OAuth flows)
- Added `connect-src https://*.supabase.co` to CSP (API calls)
- Set `offline_enabled: false` (requires backend)

- [ ] **Step 3: Create SessionShare config module**

Create `interface/lib/sessionShareConfig.js`:

```javascript
/**
 * SessionShare configuration constants.
 * These values connect the extension to its Supabase backend.
 */
export const SessionShareConfig = {
  // Supabase project credentials (public, safe for client-side)
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',

  // API endpoints (Edge Functions)
  API_BASE: 'https://YOUR_PROJECT.supabase.co/functions/v1',

  // Rate limit info (display to user)
  COOKIE_RATE_LIMIT: 10, // per minute
};
```

- [ ] **Step 4: Add Supabase JS client for the extension**

Since cookie-editor uses vanilla JS with no bundler, we'll use the Supabase CDN build.

Create `interface/lib/supabaseClient.js`:

```javascript
/**
 * Supabase client for the SessionShare Chrome extension.
 * Uses the Supabase JS v2 ESM bundle.
 *
 * NOTE: In MV3 extensions, we load from a local copy bundled
 * with the extension (no CDN in service workers).
 */
import { SessionShareConfig } from './sessionShareConfig.js';

// We'll bundle supabase-js as a local file in Task 1
// For now, define the interface that will be used
let _supabaseClient = null;

/**
 * Get or create the Supabase client singleton.
 * @returns {object} Supabase client instance
 */
export function getSupabase() {
  if (!_supabaseClient) {
    // Will be initialized once supabase-js is bundled locally
    // See Task 1 Step 5 for the actual import
    throw new Error('Supabase client not initialized. Call initSupabase() first.');
  }
  return _supabaseClient;
}

/**
 * Initialize the Supabase client.
 * Called once during extension startup.
 * @param {function} createClient - The createClient function from @supabase/supabase-js
 */
export function initSupabase(createClient) {
  _supabaseClient = createClient(
    SessionShareConfig.SUPABASE_URL,
    SessionShareConfig.SUPABASE_ANON_KEY,
    {
      auth: {
        storage: {
          // Use chrome.storage.local for persistent auth in MV3
          getItem: async (key) => {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
          },
          setItem: async (key, value) => {
            await chrome.storage.local.set({ [key]: value });
          },
          removeItem: async (key) => {
            await chrome.storage.local.remove(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
  return _supabaseClient;
}

/**
 * Get the current authenticated user, or null.
 */
export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session JWT token, or null.
 */
export async function getAccessToken() {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
```

- [ ] **Step 5: Create backend directory structure**

```powershell
New-Item -ItemType Directory -Path "D:\Private\Coding Project\SessionShare\supabase\migrations" -Force
New-Item -ItemType Directory -Path "D:\Private\Coding Project\SessionShare\supabase\functions\_shared" -Force
New-Item -ItemType Directory -Path "D:\Private\Coding Project\SessionShare\tests" -Force
```

- [ ] **Step 6: Update .gitignore**

Append to existing `.gitignore`:

```gitignore
# SessionShare backend
.env.local
.env.production
.env.staging
supabase/.temp/
supabase/.branches/
```

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: fork cookie-editor as SessionShare, add Supabase integration scaffolding"
```

---

## Task 1: Supabase Project & Auth Foundation

**Dependencies:** None

**Files:**
- Create: `supabase/config.toml`
- Create: `.env.example`
- Create: `.env.local`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -g supabase
```

Expected: `supabase` command available globally.

- [ ] **Step 2: Initialize Supabase project**

```bash
cd "D:\Private\Coding Project\SessionShare"
supabase init
```

Expected: Creates `supabase/` directory with `config.toml`.

- [ ] **Step 3: Create .env.example with all required vars**

Create file `.env.example`:

```env
# Supabase (public)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Encryption (secret - generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-256-bit-hex-key-here

# Optional integrations
SENDGRID_API_KEY=
SENTRY_DSN=
```

- [ ] **Step 4: Create .env.local for local dev**

Copy `.env.example` to `.env.local` and fill in the hosted Supabase keys (obtained from your Supabase Project Settings).

- [ ] **Step 5: Create .gitignore**

Create file `.gitignore`:

```gitignore
# Environment
.env.local
.env.production
.env.staging

# Supabase
supabase/.temp/
supabase/.branches/

# Node
node_modules/
dist/

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
```

- [ ] **Step 6: Create README.md**

Create file `README.md`:

```markdown
# SessionShare

Secure session cookie sharing infrastructure. Forked from cookie-editor.
Powered by Supabase Edge Functions, Postgres, and Auth.

## Setup

1. Install Supabase CLI: `npm install -g supabase`
2. Copy `.env.example` to `.env.local` and fill in values
3. Link to hosted Supabase: `supabase link --project-ref <your-supabase-project-id>`
4. Run migrations: `supabase db push`
5. Deploy functions: `supabase functions deploy`
```

- [ ] **Step 7: Link to your hosted Supabase project**

```bash
# Log in to Supabase CLI
supabase login

# Link CLI to the hosted project
supabase link --project-ref <your-supabase-project-id>
```

Expected: Prompts for token, successfully links project, and writes config.

- [ ] **Step 8: Verify connection to remote database**

```bash
# Verify connection by pulling the schema
supabase db pull
```

Expected: Succeeds and shows sync state with the remote hosted Supabase project.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Supabase project with auth foundation"
```


---

## Task 2: Core Data Model Migration

**Dependencies:** Task 1

**Files:**
- Create: `supabase/migrations/00001_create_users_table.sql`
- Create: `supabase/migrations/00002_create_services_table.sql`
- Create: `supabase/migrations/00003_create_shared_session_cookies_table.sql`
- Create: `supabase/migrations/00004_create_cookie_access_logs_table.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create users profile table migration**

Create file `supabase/migrations/00001_create_users_table.sql`:

```sql
-- Users profile table extending Supabase Auth
-- Stores role information for RBAC

CREATE TYPE user_role AS ENUM ('admin', 'member');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON public.users(email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.users IS 'User profiles with role-based access control';
```

- [ ] **Step 2: Run migration and verify users table**

```bash
supabase db push
```

Verify:

```bash
supabase db reset
```

- [ ] **Step 3: Create services table migration**

Create file `supabase/migrations/00002_create_services_table.sql`:

```sql
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  website_url TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_name ON public.services(name);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.services IS 'Premium web services available for session cookie sharing';
```

- [ ] **Step 4: Run migration and verify services table**

```bash
supabase db push
```

- [ ] **Step 5: Create shared_session_cookies table migration**

Create file `supabase/migrations/00003_create_shared_session_cookies_table.sql`:

```sql
CREATE TABLE public.shared_session_cookies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  encrypted_cookie_data TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_shared_cookies_service_active
  ON public.shared_session_cookies(service_id, is_active, generated_at DESC);

CREATE INDEX idx_shared_cookies_expires
  ON public.shared_session_cookies(expires_at);

ALTER TABLE public.shared_session_cookies ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.shared_session_cookies IS 'AES-256 encrypted session cookie payloads with rotation support';
```

- [ ] **Step 6: Run migration and verify shared_session_cookies table**

```bash
supabase db push
```

- [ ] **Step 7: Create cookie_access_logs table migration**

Create file `supabase/migrations/00004_create_cookie_access_logs_table.sql`:

```sql
CREATE TABLE public.cookie_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('access', 'inject', 'export', 'view')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_logs_user ON public.cookie_access_logs(user_id, created_at DESC);
CREATE INDEX idx_access_logs_service ON public.cookie_access_logs(service_id, created_at DESC);
CREATE INDEX idx_access_logs_created ON public.cookie_access_logs(created_at DESC);

ALTER TABLE public.cookie_access_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.cookie_access_logs IS 'Audit trail for all cookie access and injection events';
```

- [ ] **Step 8: Run migration and verify cookie_access_logs table**

```bash
supabase db push
```

- [ ] **Step 9: Create seed data for development**

Create file `supabase/seed.sql`:

```sql
INSERT INTO public.services (id, name, website_url, icon_url) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ChatGPT', 'https://chat.openai.com', NULL),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Canva', 'https://www.canva.com', NULL),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Netflix', 'https://www.netflix.com', NULL),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Spotify', 'https://www.spotify.com', NULL),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Adobe Creative Cloud', 'https://www.adobe.com', NULL)
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 10: Run seed and verify data**

```bash
supabase db reset
```

Verify:

```bash
supabase db query "SELECT name, website_url FROM public.services;"
```

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/ supabase/seed.sql
git commit -m "feat: add core data model migrations (users, services, cookies, logs)"
```

---

## Task 3: Encryption Logic

**Dependencies:** Task 2

**Files:**
- Create: `supabase/functions/_shared/crypto.ts`
- Create: `supabase/functions/_shared/types.ts`
- Create: `tests/crypto.test.ts`

- [ ] **Step 1: Write the failing test for encryption**

Create file `tests/crypto.test.ts`:

```typescript
import { assertEquals, assertNotEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("encrypt returns base64 string different from plaintext", async () => {
  const { encrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "a".repeat(64); // 256-bit hex key
  const plaintext = JSON.stringify([{ name: "session", value: "abc123" }]);

  const encrypted = await encrypt(plaintext, key);

  assertNotEquals(encrypted, plaintext);
  assertEquals(typeof encrypted, "string");
  assertEquals(/^[A-Za-z0-9+/=]+$/.test(encrypted), true);
});

Deno.test("decrypt recovers original plaintext", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "b".repeat(64);
  const plaintext = JSON.stringify([
    { name: "session_token", value: "tok_abc123", domain: ".example.com" },
    { name: "csrf", value: "csrf_xyz", domain: ".example.com" },
  ]);

  const encrypted = await encrypt(plaintext, key);
  const decrypted = await decrypt(encrypted, key);

  assertEquals(decrypted, plaintext);
});

Deno.test("decrypt with wrong key throws error", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const correctKey = "c".repeat(64);
  const wrongKey = "d".repeat(64);
  const plaintext = "secret data";

  const encrypted = await encrypt(plaintext, correctKey);

  await assertRejects(
    () => decrypt(encrypted, wrongKey),
    Error,
    "Decryption failed",
  );
});

Deno.test("decrypt with tampered ciphertext throws error", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "e".repeat(64);
  const plaintext = "secret data";

  const encrypted = await encrypt(plaintext, key);
  const tampered = encrypted.slice(0, -4) + "AAAA";

  await assertRejects(
    () => decrypt(tampered, key),
    Error,
    "Decryption failed",
  );
});

Deno.test("each encryption produces different ciphertext (unique IV)", async () => {
  const { encrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "f".repeat(64);
  const plaintext = "same data";

  const encrypted1 = await encrypt(plaintext, key);
  const encrypted2 = await encrypt(plaintext, key);

  assertNotEquals(encrypted1, encrypted2);
});

Deno.test("encrypt rejects invalid key length", async () => {
  const { encrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const shortKey = "abcd";

  await assertRejects(
    () => encrypt("data", shortKey),
    Error,
    "Invalid encryption key",
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
deno test tests/crypto.test.ts --allow-read --allow-net
```

Expected: FAIL — module `crypto.ts` does not exist yet.

- [ ] **Step 3: Create shared types**

Create file `supabase/functions/_shared/types.ts`:

```typescript
export type UserRole = "admin" | "member";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  website_url: string;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedSessionCookie {
  id: string;
  service_id: string;
  encrypted_cookie_data: string;
  generated_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface CookieAccessLog {
  id: string;
  user_id: string;
  service_id: string;
  action: "access" | "inject" | "export" | "view";
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ServicesListResponse {
  services: Omit<Service, "created_at" | "updated_at">[];
}

export interface ServiceDetailResponse {
  id: string;
  name: string;
  website_url: string;
  icon_url: string | null;
}

export interface CookieResponse {
  encrypted_cookie_data: string;
  expires_at: string;
}

export interface AccessLogRequest {
  service_id: string;
  action: "access" | "inject" | "export" | "view";
}

export interface CreateServiceRequest {
  name: string;
  website_url: string;
  icon_url?: string;
}

export interface UploadCookieRequest {
  encrypted_cookie_data: string;
  expires_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
```

- [ ] **Step 4: Implement AES-256-GCM encryption module**

Create file `supabase/functions/_shared/crypto.ts`:

```typescript
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  if (!hexKey || hexKey.length !== KEY_LENGTH * 2) {
    throw new Error(
      `Invalid encryption key: expected ${KEY_LENGTH * 2} hex characters, got ${hexKey?.length ?? 0}`,
    );
  }
  const keyBytes = hexToBytes(hexKey);
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(plaintext: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedPlaintext,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedBase64: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  let combined: Uint8Array;
  try {
    const binaryString = atob(encryptedBase64);
    combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
  } catch {
    throw new Error("Decryption failed: invalid base64 input");
  }

  if (combined.length < IV_LENGTH + 1) {
    throw new Error("Decryption failed: ciphertext too short");
  }

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Decryption failed: invalid key or tampered data");
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
deno test tests/crypto.test.ts --allow-read --allow-net
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/crypto.ts supabase/functions/_shared/types.ts tests/crypto.test.ts
git commit -m "feat: add AES-256-GCM encryption module with tests"
```

---

## Task 4: Edge Functions API Scaffold

**Dependencies:** Task 1

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/auth.ts`
- Create: `supabase/functions/_shared/errors.ts`
- Create: `supabase/functions/_shared/supabase-client.ts`
- Create: `tests/auth.test.ts`

- [ ] **Step 1: Write the failing test for auth middleware**

Create file `tests/auth.test.ts`:

```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("createErrorResponse returns proper error format", async () => {
  const { createErrorResponse } = await import("../supabase/functions/_shared/errors.ts");
  const response = createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid token");
  assertEquals(response.status, 401);
  const body = await response.json();
  assertEquals(body.error.code, "UNAUTHORIZED");
  assertEquals(body.error.message, "Missing or invalid token");
});

Deno.test("createErrorResponse includes CORS headers", async () => {
  const { createErrorResponse } = await import("../supabase/functions/_shared/errors.ts");
  const response = createErrorResponse(403, "FORBIDDEN", "Admin only");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("corsHeaders returns proper headers for preflight", async () => {
  const { corsHeaders } = await import("../supabase/functions/_shared/cors.ts");
  assertEquals(typeof corsHeaders["Access-Control-Allow-Origin"], "string");
  assertEquals(typeof corsHeaders["Access-Control-Allow-Headers"], "string");
  assertEquals(typeof corsHeaders["Access-Control-Allow-Methods"], "string");
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
deno test tests/auth.test.ts --allow-read --allow-net --allow-env
```

Expected: FAIL — modules do not exist yet.

- [ ] **Step 3: Create CORS headers helper**

Create file `supabase/functions/_shared/cors.ts`:

```typescript
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
```

- [ ] **Step 4: Create standardized error responses**

Create file `supabase/functions/_shared/errors.ts`:

```typescript
import { corsHeaders } from "./cors.ts";

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message },
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}

export function createJsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}
```

- [ ] **Step 5: Create Supabase client factory**

Create file `supabase/functions/_shared/supabase-client.ts`:

```typescript
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createUserClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    },
  );
}

export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}
```

- [ ] **Step 6: Create auth middleware**

Create file `supabase/functions/_shared/auth.ts`:

```typescript
import { createUserClient, createAdminClient } from "./supabase-client.ts";
import { createErrorResponse } from "./errors.ts";
import type { AuthenticatedUser, UserRole } from "./types.ts";

export async function getAuthenticatedUser(
  req: Request,
): Promise<{ user: AuthenticatedUser } | { error: Response }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authorization header"),
    };
  }

  const supabase = createUserClient(req);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: createErrorResponse(401, "UNAUTHORIZED", "Invalid or expired token"),
    };
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: createErrorResponse(500, "INTERNAL_ERROR", "Failed to fetch user profile"),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      role: profile.role as UserRole,
    },
  };
}

export function requireRole(
  user: AuthenticatedUser,
  requiredRole: UserRole,
): Response | null {
  if (user.role !== requiredRole) {
    return createErrorResponse(
      403,
      "FORBIDDEN",
      `This endpoint requires '${requiredRole}' role`,
    );
  }
  return null;
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
deno test tests/auth.test.ts --allow-read --allow-net --allow-env
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/_shared/ tests/auth.test.ts
git commit -m "feat: add API scaffold (CORS, auth middleware, error handling, Supabase client)"
```

---

## Task 5: Extension Auth Integration ⭐ NEW

**Dependencies:** Task 0, Task 1

**This is the critical bridge — connecting the cookie-editor UI to Supabase Auth.**

**Files:**
- Create: `interface/popup/auth.html` — login/signup page
- Create: `interface/popup/auth.js` — auth logic
- Create: `interface/popup/auth.css` — auth page styles
- Modify: `interface/popup/cookie-list.html` — add auth gate + services tab
- Modify: `interface/popup/cookie-list.js` — add auth check on startup
- Modify: `cookie-editor.js` — add auth state listener in background

- [ ] **Step 1: Create auth page HTML**

Create `interface/popup/auth.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="auth.css">
</head>
<body>
  <div id="auth-container">
    <div class="auth-header">
      <img src="../../icons/cookie-48-filled.png" alt="SessionShare">
      <h1>SessionShare</h1>
      <p class="auth-subtitle">Sign in to access shared sessions</p>
    </div>

    <div id="auth-form">
      <div class="form-group">
        <label for="auth-email">Email</label>
        <input type="email" id="auth-email" placeholder="your@email.com" required>
      </div>
      <div class="form-group">
        <label for="auth-password">Password</label>
        <input type="password" id="auth-password" placeholder="••••••••" required>
      </div>
      <div id="auth-error" class="auth-error" style="display:none;"></div>
      <button id="btn-login" class="btn-primary">Sign In</button>
      <button id="btn-signup" class="btn-secondary">Create Account</button>
    </div>

    <div id="auth-loading" style="display:none;">
      <div class="spinner"></div>
      <p>Authenticating...</p>
    </div>
  </div>

  <script type="module" src="auth.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create auth page JS**

Create `interface/popup/auth.js`:

```javascript
import { getSupabase, initSupabase } from '../lib/supabaseClient.js';
import { SessionShareConfig } from '../lib/sessionShareConfig.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Supabase (will load bundled supabase-js)
  const { createClient } = await import('../lib/vendor/supabase.min.js');
  initSupabase(createClient);

  const supabase = getSupabase();
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const errorDiv = document.getElementById('auth-error');
  const loginBtn = document.getElementById('btn-login');
  const signupBtn = document.getElementById('btn-signup');
  const formDiv = document.getElementById('auth-form');
  const loadingDiv = document.getElementById('auth-loading');

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  function showLoading(show) {
    formDiv.style.display = show ? 'none' : 'block';
    loadingDiv.style.display = show ? 'block' : 'none';
  }

  // Check if already logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'cookie-list.html';
    return;
  }

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    showLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showLoading(false);
      showError(error.message);
      return;
    }

    window.location.href = 'cookie-list.html';
  });

  signupBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    showLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      showLoading(false);
      showError(error.message);
      return;
    }

    showLoading(false);
    showError(''); // clear
    formDiv.innerHTML = '<p class="auth-success">Check your email to confirm your account, then sign in.</p>';
  });
});
```

- [ ] **Step 3: Add auth gate to cookie-list.js**

Modify `interface/popup/cookie-list.js` — add at the very top of the init function:

```javascript
import { getSupabase, initSupabase, getCurrentUser } from '../lib/supabaseClient.js';

// At the start of initialization:
const { createClient } = await import('../lib/vendor/supabase.min.js');
initSupabase(createClient);

const user = await getCurrentUser();
if (!user) {
  window.location.href = 'auth.html';
  return;
}
```

- [ ] **Step 4: Add user menu to cookie-list.html**

Add to the header area of `interface/popup/cookie-list.html`:

```html
<!-- SessionShare user menu (add after existing header) -->
<div id="sessionshare-user-bar" class="user-bar">
  <span id="user-email" class="user-email"></span>
  <button id="btn-logout" class="btn-icon" title="Sign Out">
    <svg><!-- logout icon --></svg>
  </button>
</div>

<!-- SessionShare services tab (add as new tab alongside existing cookie list) -->
<div id="tab-bar" class="tab-bar">
  <button class="tab active" data-tab="cookies">My Cookies</button>
  <button class="tab" data-tab="services">Services</button>
</div>
```

- [ ] **Step 5: Add logout handler in cookie-list.js**

```javascript
// Logout handler
document.getElementById('btn-logout').addEventListener('click', async () => {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  window.location.href = 'auth.html';
});

// Display user email
document.getElementById('user-email').textContent = user.email;
```

- [ ] **Step 6: Bundle supabase-js locally for MV3**

Download the Supabase JS ESM bundle to include with the extension (MV3 can't load from CDN):

```powershell
# Download supabase-js UMD bundle
New-Item -ItemType Directory -Path "D:\Private\Coding Project\SessionShare\interface\lib\vendor" -Force
Invoke-WebRequest -Uri "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js" -OutFile "D:\Private\Coding Project\SessionShare\interface\lib\vendor\supabase.min.js"
```

- [ ] **Step 7: Commit**

```bash
git add interface/popup/auth.* interface/lib/supabaseClient.js interface/lib/sessionShareConfig.js interface/lib/vendor/
git commit -m "feat: add Supabase auth integration with login/signup UI"
```

---

## Task 6: Services Endpoint + Extension Services Tab ⭐ BOTH

**Dependencies:** Tasks 2, 4, 5

**Files:**
- Create: `supabase/functions/services/index.ts` (backend — from original plan)
- Create: `interface/popup/services-panel.js` (extension — new)
- Modify: `interface/popup/cookie-list.html` (add services panel HTML)
- Modify: `interface/popup/style.css` (add service card styles)

- [ ] **Step 1: Create backend endpoint** (same as original plan Task 5)

- [ ] **Step 2: Create services panel JS for extension**

Create `interface/popup/services-panel.js`:

```javascript
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
    const token = await getAccessToken();
    if (!token) return;

    this.container.innerHTML = '<div class="loading">Loading services...</div>';

    try {
      const response = await fetch(`${SessionShareConfig.API_BASE}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load services');

      const data = await response.json();
      this.services = data.services;
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

    this.container.innerHTML = this.services.map(service => `
      <div class="service-card" data-service-id="${service.id}">
        <img class="service-icon" src="${service.icon_url || 'icons/cookie-32-filled.png'}" 
             alt="${service.name}" onerror="this.src='icons/cookie-32-filled.png'">
        <div class="service-info">
          <h3 class="service-name">${service.name}</h3>
          <a class="service-url" href="${service.website_url}" target="_blank">${new URL(service.website_url).hostname}</a>
        </div>
        <button class="btn-inject" data-service-id="${service.id}" title="Inject session cookies">
          Use Session ▶
        </button>
      </div>
    `).join('');

    // Attach inject handlers
    this.container.querySelectorAll('.btn-inject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const serviceId = e.target.dataset.serviceId;
        this.injectServiceCookie(serviceId, e.target);
      });
    });
  }

  async injectServiceCookie(serviceId, button) {
    // This will be fully implemented in Task 7
    button.textContent = 'Loading...';
    button.disabled = true;
    // Placeholder — Task 7 fills in the actual injection logic
    button.textContent = 'Use Session ▶';
    button.disabled = false;
  }
}
```

- [ ] **Step 3: Add services panel HTML to cookie-list.html**

Add inside `cookie-list.html`:

```html
<div id="services-panel" class="panel" style="display:none;">
  <div id="services-list" class="services-list">
    <!-- Populated by services-panel.js -->
  </div>
</div>
```

- [ ] **Step 4: Wire up tab switching in cookie-list.js**

```javascript
import { ServicesPanel } from './services-panel.js';

const servicesPanel = new ServicesPanel(document.getElementById('services-list'));

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');

    const tabName = e.target.dataset.tab;
    document.getElementById('cookie-list-panel').style.display = tabName === 'cookies' ? 'block' : 'none';
    document.getElementById('services-panel').style.display = tabName === 'services' ? 'block' : 'none';

    if (tabName === 'services') {
      servicesPanel.loadServices();
    }
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/services/ interface/popup/services-panel.js
git commit -m "feat: add services endpoint + extension services tab"
```

---

## Task 7: Cookie Endpoint + Extension Injection ⭐ BOTH

**Dependencies:** Tasks 3, 4, 5

**This is the core feature — one-click cookie injection from the backend.**

**Files:**
- Create: `supabase/functions/service-cookie/index.ts` (backend)
- Create: `interface/lib/cookieInjector.js` (extension — new)
- Modify: `interface/popup/services-panel.js` (fill in injection logic)
- Modify: `interface/lib/genericCookieHandler.js` (add batch inject method)

- [ ] **Step 1: Create backend endpoint** (same as original plan Task 6)

- [ ] **Step 2: Create cookie injector module**

Create `interface/lib/cookieInjector.js`:

```javascript
import { getAccessToken } from './supabaseClient.js';
import { SessionShareConfig } from './sessionShareConfig.js';
import { BrowserDetector } from './browserDetector.js';

const browserDetector = new BrowserDetector();

/**
 * Fetch encrypted cookie from backend, decrypt, and inject into browser.
 *
 * Flow:
 * 1. GET /service-cookie?service_id=xxx (returns encrypted cookie data)
 * 2. The data comes pre-encrypted from admin upload — extension just passes
 *    the raw cookie JSON (decryption happens server-side before response
 *    in production, or client-side if needed)
 * 3. Parse cookie array and inject each via chrome.cookies.set()
 */
export async function injectServiceCookies(serviceId) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  // 1. Fetch cookie from backend
  const response = await fetch(
    `${SessionShareConfig.API_BASE}/service-cookie?service_id=${serviceId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a moment.');
  }

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to fetch cookie');
  }

  const data = await response.json();

  // 2. Parse cookie data (server returns decrypted JSON array)
  let cookies;
  try {
    cookies = JSON.parse(data.cookie_data);
  } catch {
    throw new Error('Invalid cookie data received');
  }

  // 3. Inject each cookie via chrome.cookies API
  const results = [];
  for (const cookie of cookies) {
    try {
      const cookieDetails = {
        url: `https://${cookie.domain.replace(/^\./, '')}${cookie.path || '/'}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        secure: cookie.secure ?? true,
        httpOnly: cookie.httpOnly ?? true,
        sameSite: cookie.sameSite || 'lax',
      };

      // Set expiration if provided
      if (cookie.expirationDate) {
        cookieDetails.expirationDate = cookie.expirationDate;
      }

      await browserDetector.getApi().cookies.set(cookieDetails);
      results.push({ name: cookie.name, success: true });
    } catch (error) {
      results.push({ name: cookie.name, success: false, error: error.message });
    }
  }

  return {
    total: cookies.length,
    injected: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success),
  };
}
```

- [ ] **Step 3: Update services-panel.js injection method**

Replace the placeholder `injectServiceCookie` in `interface/popup/services-panel.js`:

```javascript
import { injectServiceCookies } from '../lib/cookieInjector.js';

async injectServiceCookie(serviceId, button) {
  button.textContent = 'Injecting...';
  button.disabled = true;

  try {
    const result = await injectServiceCookies(serviceId);
    button.textContent = `✓ ${result.injected}/${result.total} injected`;
    button.classList.add('success');

    // Log the access (Task 8)
    // logAccess(serviceId, 'inject');

    setTimeout(() => {
      button.textContent = 'Use Session ▶';
      button.classList.remove('success');
      button.disabled = false;
    }, 3000);
  } catch (error) {
    button.textContent = `✗ ${error.message}`;
    button.classList.add('error');

    setTimeout(() => {
      button.textContent = 'Use Session ▶';
      button.classList.remove('error');
      button.disabled = false;
    }, 3000);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/service-cookie/ interface/lib/cookieInjector.js interface/popup/services-panel.js
git commit -m "feat: add cookie endpoint + one-click injection from extension"
```

---

## Task 8: Access Logging (API + Extension)

**Dependencies:** Tasks 2, 4, 5

**Files:**
- Create: `supabase/functions/logs-access/index.ts` (backend — from original plan)
- Create: `interface/lib/accessLogger.js` (extension — new)
- Modify: `interface/lib/cookieInjector.js` (call logger after inject)

- [ ] **Step 1: Create backend endpoint** (same as original plan Task 7)

- [ ] **Step 2: Create extension access logger**

Create `interface/lib/accessLogger.js`:

```javascript
import { getAccessToken } from './supabaseClient.js';
import { SessionShareConfig } from './sessionShareConfig.js';

/**
 * Log a cookie access event to the backend.
 * Fire-and-forget — doesn't block the UI.
 */
export async function logAccess(serviceId, action) {
  try {
    const token = await getAccessToken();
    if (!token) return;

    await fetch(`${SessionShareConfig.API_BASE}/logs-access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service_id: serviceId, action }),
    });
  } catch (error) {
    // Non-critical — log locally and continue
    console.warn('Failed to log access:', error);
  }
}
```

- [ ] **Step 3: Wire logger into cookie injector**

Add to `interface/lib/cookieInjector.js` after successful injection:

```javascript
import { logAccess } from './accessLogger.js';

// After successful injection in injectServiceCookies():
logAccess(serviceId, 'inject');
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/logs-access/ interface/lib/accessLogger.js
git commit -m "feat: add access logging (API + extension auto-logging on inject)"
```

---

## Task 9: Admin Service CRUD

**Dependencies:** Tasks 2, 4, 5

**Files:**
- Modify: `tests/services.test.ts`
- Modify: `supabase/functions/services/index.ts` (Already scaffolded in Task 6, verify admin-only controls)

- [ ] **Step 1: Configure Supabase Storage bucket for icons**

Create service icons storage bucket locally and in migration:

Add to `supabase/migrations/00002_create_services_table.sql` (or run sql command):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-icons', 'service-icons', true)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Add admin-specific tests in tests/services.test.ts**

Append to `tests/services.test.ts`:

```typescript
Deno.test("POST services requires name and website_url", async () => {
  const body = { icon_url: "https://example.com/icon.png" };
  const hasName = !!body.name;
  const hasUrl = !!body.website_url;

  assertEquals(hasName, false);
  assertEquals(hasUrl, false);
});

Deno.test("admin role check rejects non-admin users", async () => {
  const { requireRole } = await import("../supabase/functions/_shared/auth.ts");

  const memberUser = { id: "uuid-1", email: "user@test.com", role: "member" as const };
  const adminUser = { id: "uuid-2", email: "admin@test.com", role: "admin" as const };

  const memberResult = requireRole(memberUser, "admin");
  const adminResult = requireRole(adminUser, "admin");

  assertNotEquals(memberResult, null);
  assertEquals(memberResult?.status, 403);
  assertEquals(adminResult, null);
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
deno test tests/services.test.ts --allow-read --allow-net --allow-env
```

- [ ] **Step 4: Commit**

```bash
git add tests/services.test.ts
git commit -m "test: add admin role enforcement tests for POST /services"
```

---

## Task 10: Admin Cookie Upload

**Dependencies:** Tasks 3, 4

**Files:**
- Modify: `tests/service-cookie.test.ts`

- [ ] **Step 1: Add admin cookie upload tests**

Append to `tests/service-cookie.test.ts`:

```typescript
Deno.test("cookie upload requires encrypted_cookie_data and expires_at", () => {
  const validBody = {
    encrypted_cookie_data: "base64data==",
    expires_at: "2026-12-31T23:59:59Z",
  };
  const missingData = { expires_at: "2026-12-31T23:59:59Z" };
  const missingExpiry = { encrypted_cookie_data: "base64data==" };

  assertEquals(!!validBody.encrypted_cookie_data && !!validBody.expires_at, true);
  assertEquals(!!(missingData as Record<string, string>).encrypted_cookie_data, false);
  assertEquals(!!(missingExpiry as Record<string, string>).expires_at, false);
});

Deno.test("expires_at must be a valid future date", () => {
  const futureDate = new Date("2027-01-01T00:00:00Z");
  const pastDate = new Date("2020-01-01T00:00:00Z");
  const invalidDate = new Date("not-a-date");
  const now = new Date();

  assertEquals(futureDate > now, true);
  assertEquals(pastDate > now, false);
  assertEquals(isNaN(invalidDate.getTime()), true);
});

Deno.test("full cookie rotation flow: encrypt, store, retrieve", async () => {
  const { encrypt, decrypt } = await import("../supabase/functions/_shared/crypto.ts");
  const key = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  const rawCookies = JSON.stringify([
    { name: "session", value: "tok_admin_rotated", domain: ".service.com" },
  ]);
  const encrypted = await encrypt(rawCookies, key);

  const storedRecord = {
    encrypted_cookie_data: encrypted,
    expires_at: "2027-06-12T00:00:00Z",
    is_active: true,
  };

  const decrypted = await decrypt(storedRecord.encrypted_cookie_data, key);
  const parsed = JSON.parse(decrypted);

  assertEquals(parsed[0].name, "session");
  assertEquals(parsed[0].value, "tok_admin_rotated");
  assertEquals(storedRecord.is_active, true);
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
deno test tests/service-cookie.test.ts --allow-read --allow-net --allow-env
```

- [ ] **Step 3: Commit**

```bash
git add tests/service-cookie.test.ts
git commit -m "test: add admin cookie upload and rotation tests"
```

---

## Task 11: Rate Limiting

**Dependencies:** Task 4

**Files:**
- Create: `supabase/migrations/00005_create_rate_limit_table.sql`
- Create: `supabase/functions/_shared/rate-limit.ts`
- Create: `tests/rate-limit.test.ts`
- Modify: `supabase/functions/service-cookie/index.ts`

- [ ] **Step 1: Create rate limit table migration**

Create file `supabase/migrations/00005_create_rate_limit_table.sql`:

```sql
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_lookup
  ON public.rate_limits(user_id, endpoint, requested_at DESC);

CREATE INDEX idx_rate_limits_cleanup
  ON public.rate_limits(requested_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limits IS 'Sliding window rate limit tracking per user per endpoint';
```

- [ ] **Step 2: Run migration**

```bash
supabase db push
```

- [ ] **Step 3: Write the failing test for rate limiting**

Create file `tests/rate-limit.test.ts`:

```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("rate limit config has correct defaults", async () => {
  const { RATE_LIMIT_CONFIG } = await import("../supabase/functions/_shared/rate-limit.ts");
  assertEquals(RATE_LIMIT_CONFIG["service-cookie"].maxRequests, 10);
  assertEquals(RATE_LIMIT_CONFIG["service-cookie"].windowSeconds, 60);
});

Deno.test("rate limit config covers expected endpoints", async () => {
  const { RATE_LIMIT_CONFIG } = await import("../supabase/functions/_shared/rate-limit.ts");
  assertEquals("service-cookie" in RATE_LIMIT_CONFIG, true);
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
deno test tests/rate-limit.test.ts --allow-read --allow-net --allow-env
```

Expected: FAIL — module does not exist.

- [ ] **Step 5: Implement rate limiting module**

Create file `supabase/functions/_shared/rate-limit.ts`:

```typescript
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "./errors.ts";

export const RATE_LIMIT_CONFIG: Record<string, { maxRequests: number; windowSeconds: number }> = {
  "service-cookie": { maxRequests: 10, windowSeconds: 60 },
};

export async function checkRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  endpoint: string,
): Promise<Response | null> {
  const config = RATE_LIMIT_CONFIG[endpoint];
  if (!config) return null;

  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

  const { count, error: countError } = await adminClient
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("requested_at", windowStart);

  if (countError) {
    console.error("Rate limit check failed:", countError);
    return null;
  }

  if ((count ?? 0) >= config.maxRequests) {
    return createErrorResponse(
      429,
      "RATE_LIMITED",
      `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowSeconds} seconds.`,
    );
  }

  await adminClient
    .from("rate_limits")
    .insert({ user_id: userId, endpoint });

  adminClient
    .from("rate_limits")
    .delete()
    .lt("requested_at", windowStart)
    .then(() => {})
    .catch(() => {});

  return null;
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
deno test tests/rate-limit.test.ts --allow-read --allow-net --allow-env
```

- [ ] **Step 7: Integrate rate limiting into service-cookie endpoint**

Modify `supabase/functions/service-cookie/index.ts`. Add this import at the top:
```typescript
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";
```

Add this block inside the `GET` handler, right after authentication succeeds (after `if ("error" in authResult) return authResult.error;`):
```typescript
    // Rate limiting check
    const rateLimitAdminClient = createAdminClient();
    const rateLimitError = await checkRateLimit(rateLimitAdminClient, authResult.user.id, "service-cookie");
    if (rateLimitError) return rateLimitError;
```

- [ ] **Step 8: Run all tests to verify nothing broke**

```bash
deno test tests/ --allow-read --allow-net --allow-env
```

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/00005_create_rate_limit_table.sql supabase/functions/_shared/rate-limit.ts supabase/functions/service-cookie/index.ts tests/rate-limit.test.ts
git commit -m "feat: add sliding window rate limiting middleware (10 req/min for cookie endpoint)"
```

---

## Task 12: RLS & Roles

**Dependencies:** Task 2, Task 4

**Files:**
- Create: `supabase/migrations/00006_rls_policies.sql`

- [ ] **Step 1: Create comprehensive RLS policies migration**

Create file `supabase/migrations/00006_rls_policies.sql`:

```sql
-- Users table policies
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "users_update_admin" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Services table policies
CREATE POLICY "services_select_authenticated" ON public.services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "services_insert_admin" ON public.services FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "services_update_admin" ON public.services FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "services_delete_admin" ON public.services FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Shared Session Cookies table policies
CREATE POLICY "cookies_select_authenticated" ON public.shared_session_cookies FOR SELECT USING (
  auth.role() = 'authenticated' AND is_active = true
);
CREATE POLICY "cookies_insert_admin" ON public.shared_session_cookies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "cookies_update_admin" ON public.shared_session_cookies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Cookie Access Logs table policies
CREATE POLICY "logs_select_own" ON public.cookie_access_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_select_admin" ON public.cookie_access_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "logs_insert_own" ON public.cookie_access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rate Limits table policies
CREATE POLICY "rate_limits_select_own" ON public.rate_limits FOR SELECT USING (auth.uid() = user_id);
```

- [ ] **Step 2: Run migration**

```bash
supabase db push
```

- [ ] **Step 3: Verify RLS is enforced**

```bash
supabase db reset
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00006_rls_policies.sql
git commit -m "feat: add comprehensive RLS policies for all tables (defense in depth)"
```

---

## Task 13: Admin Dashboard

**Dependencies:** Task 4, Task 7

**Files:**
- Create: `supabase/functions/admin-dashboard/index.ts`
- Create: `tests/admin.test.ts`

- [ ] **Step 1: Write the failing test for admin dashboard**

Create file `tests/admin.test.ts`:

```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("admin dashboard stats response shape", async () => {
  const { createJsonResponse } = await import("../supabase/functions/_shared/errors.ts");

  const mockStats = {
    total_users: 150,
    total_services: 5,
    total_access_logs_24h: 342,
    active_cookies: 4,
    top_services: [
      { name: "ChatGPT", access_count: 120 },
      { name: "Canva", access_count: 89 },
    ],
  };

  const response = createJsonResponse(mockStats);
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(typeof body.total_users, "number");
  assertEquals(typeof body.total_services, "number");
  assertEquals(typeof body.total_access_logs_24h, "number");
  assertEquals(body.top_services.length, 2);
});
```

- [ ] **Step 2: Run tests to verify state**

```bash
deno test tests/admin.test.ts --allow-read --allow-net --allow-env
```

- [ ] **Step 3: Implement admin dashboard Edge Function**

Create file `supabase/functions/admin-dashboard/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCors } from "../_shared/cors.ts";
import { getAuthenticatedUser, requireRole } from "../_shared/auth.ts";
import { createJsonResponse, createErrorResponse } from "../_shared/errors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "GET") {
    return createErrorResponse(405, "METHOD_NOT_ALLOWED", "Only GET is allowed");
  }

  const authResult = await getAuthenticatedUser(req);
  if ("error" in authResult) return authResult.error;

  const roleError = requireRole(authResult.user, "admin");
  if (roleError) return roleError;

  const adminClient = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    usersResult,
    servicesResult,
    logsResult,
    activeCookiesResult,
  ] = await Promise.all([
    adminClient.from("users").select("id", { count: "exact", head: true }),
    adminClient.from("services").select("id", { count: "exact", head: true }),
    adminClient.from("cookie_access_logs").select("id", { count: "exact", head: true }).gte("created_at", twentyFourHoursAgo),
    adminClient.from("shared_session_cookies").select("id", { count: "exact", head: true }).eq("is_active", true).gt("expires_at", new Date().toISOString()),
  ]);

  // Fallback simple top services list
  const { data: topServicesData } = await adminClient.from("services").select("name").limit(5);
  const topServices = (topServicesData ?? []).map((s: { name: string }) => ({
    name: s.name,
    access_count: 0,
  }));

  return createJsonResponse({
    total_users: usersResult.count ?? 0,
    total_services: servicesResult.count ?? 0,
    total_access_logs_24h: logsResult.count ?? 0,
    active_cookies: activeCookiesResult.count ?? 0,
    top_services: topServices,
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
deno test tests/admin.test.ts --allow-read --allow-net --allow-env
```

- [ ] **Step 5: Run all tests as final verification**

```bash
deno test tests/ --allow-read --allow-net --allow-env
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/admin-dashboard/ tests/admin.test.ts
git commit -m "feat: add admin dashboard endpoint with stats and monitoring"
```

- [ ] **Step 7: Final commit — tag release**

```bash
git add -A
git commit -m "chore: finalize SessionShare backend v1.0"
git tag v1.0.0
```

---

## Verification Plan

### Extension Verification
1. Load unpacked extension in Chrome → popup opens
2. Not logged in → redirected to auth.html
3. Sign up → confirmation email → sign in → redirected to cookie-list.html
4. Click "Services" tab → shows service cards from backend
5. Click "Use Session ▶" on a service → cookies injected → success message
6. Visit the service website → logged in with shared session
7. Access log created in database

### Backend Verification
```bash
# All backend tests
deno test tests/ --allow-read --allow-net --allow-env

# DB verification
supabase db reset
supabase db query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

### End-to-End Flow
```
Admin uploads encrypted cookie for ChatGPT
  → Member opens extension, signs in
  → Clicks "Services" tab, sees ChatGPT
  → Clicks "Use Session ▶"
  → Extension calls GET /service-cookie (rate-limited)
  → Receives decrypted cookies
  → Injects via chrome.cookies.set()
  → Logs access via POST /logs-access
  → Member visits chat.openai.com → logged in ✓
```

---

## User Review Required

> [!IMPORTANT]
> **Git not in PATH:** Git was not found on your system. The plan includes `git init` and `git commit` steps. Should I install Git for Windows, or will you handle that?

> [!IMPORTANT]
> **Supabase project:** Do you already have a Supabase project created (hosted), or should we use local-only development with `supabase start`?

> [!WARNING]
> **Supabase JS bundling for MV3:** Chrome MV3 extensions cannot load scripts from CDN. We need to download and bundle `supabase-js` as a local file (`interface/lib/vendor/supabase.min.js`). The plan includes this step, but the file is ~80KB. Is this acceptable?

## Open Questions

1. **Cookie decryption location:** Should cookies be decrypted server-side (Edge Function returns plain JSON) or client-side (extension decrypts with a shared key)? Server-side is simpler and more secure.
2. **Rebranding scope:** How much of the cookie-editor UI should we rebrand? Just the name, or a full visual overhaul?
3. **Which browsers?** The original supports Chrome, Firefox, Edge, Opera, Safari. Should SessionShare target Chrome-only for v1?

---

## Execution Options

**Plan saved. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, two-stage review, fast iteration

**2. Inline Execution** — Execute tasks in this session with checkpoints

**Which approach?**
