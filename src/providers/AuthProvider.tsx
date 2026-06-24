import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api/auth'
import { setOnAuthLost } from '@/lib/api/http'
import { isPreAuth, type CurrentUser, type LoginResponse } from '@/lib/api/types'
import {
  clearSession,
  decodeJwt,
  getAccessToken,
  getPreAuthToken,
  getRefreshToken,
  setPreAuthToken,
  setTokenPair,
  type AccessTokenClaims,
} from '@/lib/tokens'
import { AuthContext, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [claims, setClaims] = useState<AccessTokenClaims | null>(null)

  const loadUser = useCallback(async () => {
    const me = await authApi.me()
    setUser(me)
    setClaims(decodeJwt(getAccessToken()))
    setStatus('authenticated')
  }, [])

  const reset = useCallback(() => {
    setUser(null)
    setClaims(null)
    setStatus('unauthenticated')
  }, [])

  // Reset + redirect when the API layer reports an unrecoverable auth failure.
  useEffect(() => {
    setOnAuthLost(() => {
      reset()
      queryClient.clear()
      navigate('/login', { replace: true })
    })
  }, [navigate, queryClient, reset])

  // Bootstrap session from any persisted tokens.
  useEffect(() => {
    let active = true
    ;(async () => {
      if (getAccessToken()) {
        try {
          await loadUser()
        } catch {
          if (active) {
            clearSession()
            reset()
          }
        }
      } else if (getPreAuthToken()) {
        if (active) setStatus('preauth')
      } else if (active) {
        setStatus('unauthenticated')
      }
    })()
    return () => {
      active = false
    }
  }, [loadUser, reset])

  const applyLoginResponse = useCallback(
    async (res: LoginResponse) => {
      if (isPreAuth(res)) {
        setPreAuthToken(res.pre_auth_token)
        setStatus('preauth')
        return
      }
      setTokenPair(res)
      await loadUser()
    },
    [loadUser],
  )

  const selectMembership = useCallback(
    async (membershipId: string, deviceHint?: string) => {
      const pair = await authApi.selectClient(membershipId, deviceHint)
      setTokenPair(pair)
      await loadUser()
    },
    [loadUser],
  )

  const switchTenant = useCallback(
    async (clientId: string) => {
      const pair = await authApi.switchClient(clientId)
      setTokenPair(pair)
      await loadUser()
      await queryClient.invalidateQueries()
    },
    [loadUser, queryClient],
  )

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    if (refresh) {
      try {
        await authApi.logout(refresh)
      } catch {
        // best effort — clear locally regardless
      }
    }
    clearSession()
    reset()
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [navigate, queryClient, reset])

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        claims,
        isSuperAdmin: user?.is_super_admin ?? false,
        currentClientId: claims?.client_id ?? null,
        role: claims?.role ?? null,
        applyLoginResponse,
        selectMembership,
        switchTenant,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
