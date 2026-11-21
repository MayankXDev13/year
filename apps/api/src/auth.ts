import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'
import type { Env } from './env'

export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema })
  const webUrl = (env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '')
  const apiUrl = (env.BETTER_AUTH_URL || 'http://localhost:8787').replace(/\/$/, '')
  const isSecure = apiUrl.startsWith('https://')

  let cookieDomain: string | undefined
  try {
    const webHost = new URL(webUrl).hostname
    const apiHost = new URL(apiUrl).hostname
    if (isSecure && apiHost.endsWith(`.${webHost}`)) {
      cookieDomain = `.${webHost}`
    }
  } catch {
    // ignore URL parse error
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: apiUrl,
    trustedOrigins: [webUrl],
    // OAuth only (GitHub & Google) — password authentication is explicitly disabled
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
    },
    onAPIError: {
      errorURL: `${webUrl}/auth/error`,
    },
    advanced: {
      ...(cookieDomain
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: cookieDomain,
            },
          }
        : {}),
      defaultCookieAttributes: {
        sameSite: cookieDomain || !isSecure ? 'lax' : 'none',
        secure: isSecure,
        httpOnly: true,
      },
    },
  })
}
