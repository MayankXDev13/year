# GitHub Actions CI/CD Guide

This repository includes two workflows in `.github/workflows/`:

1. **`ci.yml`** (runs on pull requests to `main`):
   - Installs dependencies (`pnpm install --frozen-lockfile`)
   - Runs `pnpm lint`, `pnpm typecheck`, and `pnpm build` across all Turborepo packages
2. **`deploy.yml`** (runs on push to `main` and manual `workflow_dispatch`):
   - **Stage 1 (`verify`)**: Lint & Typecheck across `packages/shared`, `apps/api`, and `apps/web`
   - **Stage 2 (`deploy-pages`)**: Builds `apps/web` with `VITE_API_URL` and deploys to **Cloudflare Pages first**
   - **Stage 3 (`deploy-api`)**: Applies remote D1 migrations (`wrangler d1 migrations apply year-board-db --remote`), deploys the **Cloudflare Worker**, and runs a 5-attempt `/api/health` smoke check

## Required GitHub Repository Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions → Secrets** and add:

| Secret Name | Example / Value | Where to find it |
| :--- | :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | `e01af243c57f1deb498d5a6f5001002a` | Cloudflare Dashboard → Workers & Pages → Account ID |
| `CLOUDFLARE_API_TOKEN` | `<custom-api-token>` | [Cloudflare Setup Guide](./cloudflare-setup.md#2-how-to-create-the-cloudflare-api-token) |
| `VITE_API_URL` | `https://api.yearboard.mayanknair.com` | Your deployed Worker custom domain (no trailing slash) |

### Optional Repository Variables

Under **Settings → Secrets and variables → Actions → Variables**:

| Variable Name | Default | Description |
| :--- | :--- | :--- |
| `CF_PAGES_PROJECT_NAME` | `year-board-web` | Override if you renamed the Cloudflare Pages project |

## Common Troubleshooting

- **Missing secret error in `deploy-pages`:** Verify all 3 secrets exist under **Repository secrets** (not Environment secrets, unless you configured an environment in `deploy.yml`).
- **`Authentication error [code: 10000]` from Wrangler:** Double-check that your `CLOUDFLARE_API_TOKEN` has all 4 permissions (`Cloudflare Pages: Edit`, `Workers Scripts: Edit`, `D1: Edit`, `Account Settings: Read`).
- **Health check fails after Worker deploy:** Confirm `VITE_API_URL` is reachable over HTTPS (`curl https://api.yearboard.mayanknair.com/api/health`) and that your custom domain is attached to `year-board-api`.
