import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createAuthClient } from 'better-auth/react'
import { API_BASE_URL, apiFetch } from './api'

export interface SessionUser {
  id: string
  name: string
  email: string
  image?: string | null
}

export interface SessionResponse {
  user: SessionUser
  session: {
    id: string
    expiresAt: string
  }
}

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    credentials: 'include',
  },
})

export const sessionQueryKey = ['auth', 'session'] as const

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      try {
        return await apiFetch<SessionResponse | null>('/api/auth/get-session')
      } catch {
        return null
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}

export async function signInWithProvider(provider: 'github' | 'google') {
  const origin = window.location.origin
  const result = await authClient.signIn.social({
    provider,
    callbackURL: `${origin}/`,
    errorCallbackURL: `${origin}/auth/error`,
  })

  if (result?.error) {
    const params = new URLSearchParams({
      error: result.error.code || 'OAUTH_SIGNIN_FAILED',
      message: result.error.message || `Could not sign in with ${provider}.`,
      provider,
    })
    window.location.assign(`${origin}/auth/error?${params.toString()}`)
    throw new Error(result.error.message || 'Sign in failed')
  }

  return result
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return async () => {
    const result = await authClient.signOut({})
    if (result?.error) {
      throw new Error(result.error.message || 'Sign out failed')
    }
    queryClient.setQueryData(sessionQueryKey, null)
    await queryClient.invalidateQueries({ queryKey: ['board'] })
  }
}
