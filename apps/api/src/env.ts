export interface Env {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  WEB_URL: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  image?: string | null
}

export interface AppVariables {
  user: AuthUser
  sessionId: string
}
