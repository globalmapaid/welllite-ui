import {
  clearSession,
  getAccessToken,
  getPreAuthToken,
  getRefreshToken,
  setTokenPair,
} from '../tokens'
import type { FieldError, TokenPair } from './types'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api/v1'

/** Typed error carrying the backend's stable `code` and any field errors. */
export class ApiError extends Error {
  status: number
  code: string
  params: Record<string, unknown>
  errors: FieldError[]

  constructor(
    status: number,
    code: string,
    message: string,
    params: Record<string, unknown> = {},
    errors: FieldError[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.params = params
    this.errors = errors
  }
}

/** Called when refresh fails — wired by AuthProvider to reset state + redirect. */
let onAuthLost: (() => void) | null = null
export function setOnAuthLost(handler: () => void) {
  onAuthLost = handler
}

// 'session' prefers the pre-auth token (login handshake) and falls back to the
// access token — used by endpoints the backend accepts either on (memberships,
// select-client), so the same call works during login and for in-session switches.
type AuthMode = 'access' | 'preauth' | 'session' | 'none'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Which token to attach. Defaults to the access token when present. */
  auth?: AuthMode
  /** Disable the automatic refresh-and-retry on a 401 (used by /auth/refresh). */
  skipRefresh?: boolean
}

function authHeader(mode: AuthMode): Record<string, string> {
  if (mode === 'none') return {}
  let token: string | null
  if (mode === 'preauth') token = getPreAuthToken()
  else if (mode === 'session') token = getPreAuthToken() ?? getAccessToken()
  else token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined
  const text = await res.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return { code: 'UNKNOWN', message: text }
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const env = (body ?? {}) as {
    code?: string
    message?: string
    params?: Record<string, unknown>
    errors?: FieldError[]
  }
  return new ApiError(
    status,
    env.code ?? 'UNKNOWN',
    env.message ?? 'Request failed',
    env.params ?? {},
    env.errors ?? [],
  )
}

// De-dupe concurrent refreshes into a single in-flight request.
let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const refresh_token = getRefreshToken()
    if (!refresh_token) return false
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      })
      if (!res.ok) return false
      const pair = (await res.json()) as TokenPair
      setTokenPair(pair)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

/** Perform a typed request against the API, handling the coded envelope. */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = 'access', skipRefresh = false } = options

  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeader(auth),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  let res = await doFetch()

  // Access token expired → refresh once and retry. (During the login pre-auth
  // handshake there is no refresh token yet, so this simply doesn't fire.)
  if (
    res.status === 401 &&
    (auth === 'access' || auth === 'session') &&
    !skipRefresh &&
    getRefreshToken()
  ) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      res = await doFetch()
    } else {
      clearSession()
      onAuthLost?.()
    }
  }

  const parsed = await parseBody(res)
  if (!res.ok) {
    if (res.status === 401 && (auth === 'access' || auth === 'session')) {
      clearSession()
      onAuthLost?.()
    }
    throw toApiError(res.status, parsed)
  }
  return parsed as T
}
