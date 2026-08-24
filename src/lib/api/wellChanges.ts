import { request } from './http'
import type {
  PaginatedWellChanges,
  ReviewStatus,
  ReviewWellChangePayload,
  ReviewWellChangeResponse,
  WellChangeDetail,
} from './types'

export interface ListWellChangesParams {
  /** Filter to a single request state; omit for all. */
  review_status?: ReviewStatus
  limit?: number
  offset?: number
}

const DEFAULT_LIMIT = 20

function listQuery(params: ListWellChangesParams): string {
  const qs = new URLSearchParams()
  if (params.review_status) qs.set('review_status', params.review_status)
  qs.set('limit', String(params.limit ?? DEFAULT_LIMIT))
  qs.set('offset', String(params.offset ?? 0))
  return qs.toString()
}

/**
 * Survey change requests for the current tenant. The tenant comes from the
 * access token's scope — never send a client_id.
 *
 * Reading the queue is open to any member; deciding one requires supervisor or
 * client-admin (403 `AUTH_SUPERVISOR_REQUIRED` otherwise).
 */
export const wellChangesApi = {
  /** The review queue, newest first. Pass `review_status: 'pending'` for the
   *  work-to-do view; the other states are history. */
  list: (params: ListWellChangesParams = {}) =>
    request<PaginatedWellChanges>(`/well-changes?${listQuery(params)}`, {
      auth: 'access',
    }),

  /** One request, with its diff against the well's *current* state. */
  get: (id: string) =>
    request<WellChangeDetail>(`/well-changes/${id}`, { auth: 'access' }),

  /**
   * Decide a request, returning the decided request *and* the resulting well.
   *
   * A request can only be decided once: a second attempt fails with 409
   * `WELL_CHANGE_NOT_PENDING`, which means another reviewer got there first —
   * refresh the queue rather than retrying.
   */
  review: (id: string, payload: ReviewWellChangePayload) =>
    request<ReviewWellChangeResponse>(`/well-changes/${id}/review`, {
      method: 'POST',
      body: payload,
      auth: 'access',
    }),

  /** One well's survey history, newest first. */
  forWell: (wellId: string, params: ListWellChangesParams = {}) =>
    request<PaginatedWellChanges>(
      `/wells/${wellId}/changes?${listQuery(params)}`,
      { auth: 'access' },
    ),
}
