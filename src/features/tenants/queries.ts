import { useQuery } from '@tanstack/react-query'
import { clientsApi } from '@/lib/api/clients'
import { useAuth } from '@/providers/auth-context'

/** The tenant the current session is scoped to (null for unscoped super-admin). */
export function useCurrentTenant() {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: ['tenant', 'me', currentClientId],
    queryFn: clientsApi.me,
    enabled: !!currentClientId,
  })
}

/** Super-admin: all tenants. */
export function useTenantList(enabled: boolean) {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: clientsApi.list,
    enabled,
  })
}
