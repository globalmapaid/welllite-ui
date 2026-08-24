import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { ReviewWellChangePayload } from '@/lib/api/types'
import {
  wellChangesApi,
  type ListWellChangesParams,
} from '@/lib/api/wellChanges'
import { useAuth } from '@/providers/auth-context'

const WELL_CHANGES_KEY = ['well-changes'] as const

/** A page of the tenant's change requests. Disabled until a tenant is scoped
 *  (the endpoint 403s with AUTH_NO_TENANT_SELECTED otherwise). */
export function useWellChanges(params: ListWellChangesParams) {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: [...WELL_CHANGES_KEY, currentClientId, params],
    queryFn: () => wellChangesApi.list(params),
    enabled: !!currentClientId,
    placeholderData: keepPreviousData,
  })
}

/** One change request with its diff. */
export function useWellChange(id: string | undefined) {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: [...WELL_CHANGES_KEY, currentClientId, 'detail', id],
    queryFn: () => wellChangesApi.get(id!),
    enabled: !!currentClientId && !!id,
  })
}

/** Every survey filed against one well, newest first. */
export function useWellChangeHistory(wellId: string | undefined, limit = 50) {
  const { currentClientId } = useAuth()
  return useQuery({
    queryKey: [...WELL_CHANGES_KEY, currentClientId, 'for-well', wellId, limit],
    queryFn: () => wellChangesApi.forWell(wellId!, { limit }),
    enabled: !!currentClientId && !!wellId,
  })
}

/**
 * Decide a request. Approving rewrites the well, so this invalidates the wells
 * cache as well as the queue — the well list, map and detail all go stale.
 */
export function useReviewWellChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ReviewWellChangePayload
    }) => wellChangesApi.review(id, payload),
    onSettled: () => {
      // Also invalidated on failure: a 409 means someone else decided it, so
      // the queue on screen is already out of date.
      qc.invalidateQueries({ queryKey: WELL_CHANGES_KEY })
      qc.invalidateQueries({ queryKey: ['wells'] })
    },
  })
}
