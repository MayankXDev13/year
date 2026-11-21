# OAuth Setup Guide (GitHub & Google)

Year Board uses **Better Auth** with **GitHub and Google OAuth only** (email/password authentication is disabled).

## 1. GitHub OAuth App

1. Open [GitHub Developer Settings → OAuth Apps → New OAuth App](https://github.com/settings/applications/new).
2. Fill in the form:
   - **Application name:** `Year Board`
   - **Homepage URL:** `https://yearboard.mayanknair.com` *(or `http://localhost:5173` for local-only testing)*
   - **Redirect URIs** *(click **Add redirect URI** to include both local and production)*:
     - Local: `http://localhost:8787/api/auth/callback/github`
     - Production: `https://api.yearboard.mayanknair.com/api/auth/callback/github`
   - **Allow wildcard matching:** Unchecked
   - **Enable Device Flow:** Unchecked
   - **Expire user access tokens:** Checked
3. Click **Register application**.
4. Copy **Client ID** (`GITHUB_CLIENT_ID`) and click **Generate a new client secret** (`GITHUB_CLIENT_SECRET`).

## 2. Google Cloud OAuth Client (Separate GCP Project)

Best practice is to create a **dedicated Google Cloud project per app** so consent screen branding, authorized domains, and quotas stay isolated.

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project selector in the top-left bar → **New Project** → name it **Year Board** → **Create** and select it.
3. Navigate to **Google Auth Platform → Overview → Get Started**:
   - **App name:** `Year Board`
   - **Audience:** `External`
   - Add your support & developer contact email → **Create**.
4. Go to **Google Auth Platform → Clients → Create client**:
   - **Application type:** `Web application`
   - **Name:** `Year Board`
   - **Authorised JavaScript origins:**
     - `https://yearboard.mayanknair.com`
     - `https://api.yearboard.mayanknair.com`
     - *(Optional for local dev)* `http://localhost:5173` and `http://localhost:8787`
   - **Authorised redirect URIs:**
     - `http://localhost:8787/api/auth/callback/google`
     - `https://api.yearboard.mayanknair.com/api/auth/callback/google`
   - **Use this client for an AI-powered agent:** Unchecked
5. Click **Create** and save the **Client ID** (`GOOGLE_CLIENT_ID`) and **Client Secret** (`GOOGLE_CLIENT_SECRET`).
6. Under **Audience**, either add your Google account under **Test users** (while in Testing mode) or click **Publish app** for public sign-in.

## 3. Better Auth Error Handling

If any OAuth or Better Auth error occurs (such as `access_denied`, `state_mismatch`, or provider callback failure), Better Auth redirects the browser to:
```text
https://yearboard.mayanknair.com/auth/error?error=<CODE>&message=<MESSAGE>
```
The web app renders `AuthErrorPage` with a human-readable explanation and recovery actions back to `/login` or `/`.
