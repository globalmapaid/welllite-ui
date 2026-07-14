import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { wellsApi, type ListWellsParams } from '@/lib/api/wells'
import { useAuth } from '@/providers/auth-context'

const WELLS_KEY = ['wells'] as const

/** A page of the current tenant's wells. Disabled until a tenant is scoped
 *  (the endpoint 403s with AUTH_NO_TENANT_SELECTED otherwise). */
export function useWells(params: ListWellsParams) {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: [...WELLS_KEY, currentClientId, params],
    queryFn: () => wellsApi.list(params),
    enabled: !!currentClientId,
    placeholderData: keepPreviousData,
  })
}

/** A single well by id. */
export function useWell(id: string | undefined) {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: [...WELLS_KEY, currentClientId, 'detail', id],
    queryFn: () => wellsApi.get(id!),
    enabled: !!currentClientId && !!id,
  })
}
