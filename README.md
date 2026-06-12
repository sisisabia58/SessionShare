# SessionShare

Secure session cookie sharing Chrome extension and backend database infrastructure.
Forked from the excellent [cookie-editor](https://github.com/Moustachauve/cookie-editor) and extended with a Supabase backend for authenticated, shared session cookie distribution.

## Architecture

1. **Extension**: A Chrome Extension (MV3) with:
   - Supabase Auth integration for secure user login/signup.
   - Services dashboard showing allowed premium services.
   - One-click cookie injection directly into the current browser tab.
   - Local vendor integration with `supabase-js`.
2. **Backend**: A hosted Supabase instance containing:
   - Relational tables for Users, Services, Shared Session Cookies, and Cookie Access Logs.
   - Row-Level Security (RLS) to enforce authorization (Admins vs Members).
   - Encryption modules protecting cookie data with AES-256-GCM.
   - Serverless Edge Functions serving APIs with rate limiting and audit logging.

## Tech Stack

- **Extension**: HTML, CSS, Vanilla JS (ES modules)
- **Backend**: Supabase (Postgres Database, Auth, Storage, Edge Functions)
- **Encryption**: AES-256-GCM (Web Crypto API)
- **Build**: Grunt (existing cookie-editor build system)

---

## Getting Started

### Prerequisites

- Supabase CLI (a local copy has been downloaded to `.bin/supabase.exe`).
- Git.

### Setup Instructions

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the variables with your hosted Supabase credentials and an encryption key.

3. **Link to Hosted Supabase**:
   Log in to Supabase and link your local repository:
   ```bash
   .bin/supabase login
   .bin/supabase link --project-ref <your-supabase-project-ref>
   ```

4. **Deploy Database Schema**:
   Push the migrations to your remote Supabase database:
   ```bash
   .bin/supabase db push
   ```

5. **Deploy Edge Functions**:
   Deploy the serverless APIs:
   ```bash
   .bin/supabase functions deploy --no-verify-jwt
   ```
