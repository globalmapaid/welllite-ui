import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { readingsApi, type ListReadingsParams } from '@/lib/api/readings'
import { useAuth } from '@/providers/auth-context'

const READINGS_KEY = ['readings'] as const

/** A page of the current tenant's readings, optionally scoped to one well.
 *  Disabled until a tenant is scoped (the endpoint 403s otherwise). */
export function useReadings(params: ListReadingsParams) {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: [...READINGS_KEY, currentClientId, params],
    queryFn: () => readingsApi.list(params),
    enabled: !!currentClientId,
    placeholderData: keepPreviousData,
  })
}
