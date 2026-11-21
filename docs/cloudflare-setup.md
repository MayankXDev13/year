# Cloudflare Setup Guide

This guide covers getting your Cloudflare Account ID, creating a scoped API Token, provisioning D1, deploying the Worker & Pages apps, and attaching custom domains.

## 1. How to Get Your Cloudflare Account ID

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, click **Workers & Pages** (or select any domain).
3. On the right-hand sidebar, copy **Account ID** (a 32-character hex string).

Alternatively, via CLI:
```bash
npx wrangler whoami
```

## 2. How to Create the Cloudflare API Token

1. Go to [Cloudflare Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens).
2. Click **Create Token**.
3. Scroll to the bottom and click **Get started** next to **Create Custom Token**.
4. Name the token (e.g. `year-board-github-actions`).
5. Under **Permissions**, add these **4 Account permissions**:

| Scope | Resource | Permission | Why it is needed |
| :--- | :--- | :--- | :--- |
| `Account` | **Cloudflare Pages** | `Edit` | Deploy `apps/web/dist` to Pages |
| `Account` | **Workers Scripts** | `Edit` | Deploy `apps/api` Cloudflare Worker |
| `Account` | **D1** | `Edit` | Run remote D1 SQL migrations |
| `Account` | **Account Settings** | `Read` | Allow Wrangler to verify account metadata |

6. Under **Account Resources**, choose `Include` → your account (or `All accounts`).
7. Click **Continue to summary** → **Create Token**.
8. Copy the token immediately (Cloudflare only shows it once) and store it in your GitHub Actions secret `CLOUDFLARE_API_TOKEN`.

## 3. Provision Cloudflare D1 Database

1. Create the D1 database:
   ```bash
   cd apps/api
   npx wrangler d1 create year-board-db
   ```
2. Copy the returned `database_id` into `apps/api/wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "year-board-db"
   database_id = "<YOUR_D1_DATABASE_ID>"
   migrations_dir = "drizzle"
   ```
3. Apply migrations locally and remotely:
   ```bash
   # Local SQLite (for wrangler dev)
   pnpm db:migrate:local

   # Remote Cloudflare D1
   pnpm db:migrate:remote
   ```

## 4. Set Worker Runtime Secrets

Generate a strong 32+ character `BETTER_AUTH_SECRET`:
```bash
openssl rand -base64 32
```

Set all 5 secrets on the `year-board-api` Worker:
```bash
cd apps/api
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

For local development, copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` and fill in the same keys (never commit `.dev.vars`).

## 5. Create Cloudflare Pages Project & Custom Domains

1. Create the Pages project once (run from the repo root):
   ```bash
   ./apps/api/node_modules/.bin/wrangler pages project create year-board-web --production-branch main --force
   ```
2. Attach your custom domains in the Cloudflare Dashboard:
   - **Pages (`year-board-web`) → Custom domains → Set up a custom domain:**
     `yearboard.mayanknair.com`
   - **Workers (`year-board-api`) → Settings → Domains & Routes → Add → Custom Domain:**
     `api.yearboard.mayanknair.com`
3. Ensure `apps/api/wrangler.toml` `[vars]` matches your custom domains:
   ```toml
   [vars]
   BETTER_AUTH_URL = "https://api.yearboard.mayanknair.com"
   WEB_URL = "https://yearboard.mayanknair.com"
   ```
   > Because `api.yearboard.mayanknair.com` is a subdomain of `yearboard.mayanknair.com`, `apps/api/src/auth.ts` automatically enables first-party `.yearboard.mayanknair.com` cookies so strict browsers (Brave, Safari) never block sessions.
