import { createContext, useContext } from 'react'
import type { CurrentUser, LoginResponse, Role } from '@/lib/api/types'
import type { AccessTokenClaims } from '@/lib/tokens'

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'preauth'
  | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  user: CurrentUser | null
  claims: AccessTokenClaims | null
  isSuperAdmin: boolean
  /** Tenant the current access token is scoped to (null = unscoped super-admin). */
  currentClientId: string | null
  role: Role | null
  /** Branch a login response into a session or a pending client-selection. */
  applyLoginResponse: (res: LoginResponse) => Promise<void>
  /** Exchange a pre-auth session + chosen membership for a full session. */
  selectMembership: (membershipId: string, deviceHint?: string) => Promise<void>
  /** Super-admin: scope the session into a tenant. */
  switchTenant: (clientId: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
