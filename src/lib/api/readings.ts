import { request } from './http'
import type { PaginatedReadings } from './types'

export interface ListReadingsParams {
  /** Filter to a single well's readings; omit for all. */
  well_id?: string
  limit?: number
  offset?: number
}

const DEFAULT_LIMIT = 50

/**
 * Static Water Level readings for the current tenant. The tenant is derived
 * from the access token's scope on the server — never send a client_id.
 */
export const readingsApi = {
  /** List readings (most-recently-measured first), paginated and filterable. */
  list: (params: ListReadingsParams = {}) => {
    const qs = new URLSearchParams()
    if (params.well_id) qs.set('well_id', params.well_id)
    qs.set('limit', String(params.limit ?? DEFAULT_LIMIT))
    qs.set('offset', String(params.offset ?? 0))
    return request<PaginatedReadings>(`/readings?${qs.toString()}`, {
      auth: 'access',
    })
  },
}
