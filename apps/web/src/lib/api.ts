export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8787'
).replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection.')
  }

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const errObj =
      payload && typeof payload === 'object' && 'error' in payload
        ? (payload as { error?: { code?: string; message?: string } }).error
        : null
    throw new ApiError(
      response.status,
      errObj?.code ?? `HTTP_${response.status}`,
      errObj?.message ?? response.statusText ?? 'Request failed',
    )
  }

  return payload as T
}
