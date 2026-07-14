import { request } from './http'
import type { PaginatedWells, ReviewStatus, Well } from './types'

export interface ListWellsParams {
  /** Filter to a single review status; omit for all. */
  review_status?: ReviewStatus
  limit?: number
  offset?: number
}

const DEFAULT_LIMIT = 50

/**
 * Wells captured in the field for the current tenant. The tenant is derived
 * from the access token's scope on the server — never send a client_id.
 */
export const wellsApi = {
  /** List this tenant's wells (newest first), paginated and filterable. */
  list: (params: ListWellsParams = {}) => {
    const qs = new URLSearchParams()
    if (params.review_status) qs.set('review_status', params.review_status)
    qs.set('limit', String(params.limit ?? DEFAULT_LIMIT))
    qs.set('offset', String(params.offset ?? 0))
    return request<PaginatedWells>(`/wells?${qs.toString()}`, { auth: 'access' })
  },

  /** A single well by server id (404 WELL_NOT_FOUND if not in this tenant). */
  get: (id: string) => request<Well>(`/wells/${id}`, { auth: 'access' }),
}
