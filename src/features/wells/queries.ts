import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ReviewStatus } from '@/lib/api/types'
import {
  SEARCH_MAX_LIMIT,
  wellsApi,
  type ListWellsParams,
  type WellBounds,
} from '@/lib/api/wells'
import { boundsKey } from '@/lib/map'
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

/**
 * Markers inside the current map viewport. `bounds` must already be normalised
 * by `boundsFromViewport` — this hook does not validate them.
 *
 * Keeps the previous page of markers while a pan is in flight so pins don't
 * blink out; check `truncated` on the result to tell the user to zoom in.
 */
export function useWellSearch(
  bounds: WellBounds,
  reviewStatus: ReviewStatus | undefined,
) {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: [
      ...WELLS_KEY,
      currentClientId,
      'search',
      boundsKey(bounds),
      reviewStatus ?? 'all',
    ],
    queryFn: () =>
      wellsApi.search({
        ...bounds,
        review_status: reviewStatus,
        limit: SEARCH_MAX_LIMIT,
      }),
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
