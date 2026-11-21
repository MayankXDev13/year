# Year Board

A full-stack Turborepo Year Board wall planner built with React, TanStack Query, Hono, Better Auth (GitHub & Google OAuth only), Drizzle ORM, and Cloudflare D1 / Workers / Pages.

## Monorepo Structure

- `apps/web` — React 19 + Vite + Tailwind CSS v4 + TanStack Query + React Router (Cloudflare Pages)
- `apps/api` — Hono + Better Auth + Drizzle ORM (Cloudflare Workers + D1)
- `packages/shared` — Shared TypeScript types, Zod schemas, ISO-8601 week math, and streak/perfect-week calculators

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure API secrets:
   ```bash
   cp apps/api/.dev.vars.example apps/api/.dev.vars
   cp apps/web/.env.example apps/web/.env
   ```
   Fill in `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.

   Configure OAuth callback URLs in GitHub & Google developer consoles:
   - GitHub: `<BETTER_AUTH_URL>/api/auth/callback/github`
   - Google: `<BETTER_AUTH_URL>/api/auth/callback/google`

3. Apply local D1 migrations:
   ```bash
   pnpm db:migrate:local
   ```

4. Start both web and API with Turborepo:
   ```bash
   pnpm dev
   ```

## Cloudflare Deployment & CI/CD

1. Create a Cloudflare D1 database and update `database_id` in `apps/api/wrangler.toml`:
   ```bash
   npx wrangler d1 create year-board-db
   ```
2. Set Worker secrets:
   ```bash
   cd apps/api
   npx wrangler secret put BETTER_AUTH_SECRET
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```
3. Configure GitHub Actions secrets for `.github/workflows/deploy.yml`:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VITE_API_URL` (your deployed Worker URL, e.g. `https://year-board-api.<subdomain>.workers.dev`)
   - Optional repo variable: `CF_PAGES_PROJECT_NAME` (defaults to `year-board-web`)

Every push to `main` runs: **Verify → Deploy Cloudflare Pages (first) → Apply D1 Migrations → Deploy Cloudflare Worker → `/api/health` Smoke Check**.
