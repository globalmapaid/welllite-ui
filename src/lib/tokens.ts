import type { Role, TokenPair } from './api/types'

/**
 * Token persistence.
 *
 * The backend returns tokens in the response body (not as httpOnly cookies),
 * so a browser SPA must keep them in JS-reachable storage. We use localStorage
 * for a persistent session. Trade-off: vulnerable to XSS, so the app must avoid
 * injecting untrusted HTML. If the backend later sets httpOnly refresh cookies,
 * move refresh-token handling there and keep only the access token in memory.
 */

const ACCESS_KEY = 'welllite.access'
const REFRESH_KEY = 'welllite.refresh'
const PREAUTH_KEY = 'welllite.preauth'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getPreAuthToken(): string | null {
  return localStorage.getItem(PREAUTH_KEY)
}

export function setTokenPair(pair: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, pair.access_token)
  localStorage.setItem(REFRESH_KEY, pair.refresh_token)
  localStorage.removeItem(PREAUTH_KEY)
}

export function setPreAuthToken(token: string): void {
  localStorage.setItem(PREAUTH_KEY, token)
}

export function clearPreAuthToken(): void {
  localStorage.removeItem(PREAUTH_KEY)
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(PREAUTH_KEY)
}

export interface AccessTokenClaims {
  sub: string
  role: Role | null
  membership_id: string | null
  client_id: string | null
  type: string
  exp: number
  iat: number
}

/** Decode a JWT payload without verifying the signature (UI gating only). */
export function decodeJwt(token: string | null): AccessTokenClaims | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as AccessTokenClaims
  } catch {
    return null
  }
}
