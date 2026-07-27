import { request } from './http'
import type {
  PaginatedWells,
  ReviewStatus,
  Well,
  WellSearchResponse,
} from './types'

export interface ListWellsParams {
  /** Filter to a single review status; omit for all. */
  review_status?: ReviewStatus
  limit?: number
  offset?: number
}

/** A WGS84 bounding box; each `min_*` must be strictly below its `max_*`. */
export interface WellBounds {
  min_lat: number
  min_lon: number
  max_lat: number
  max_lon: number
}

export interface SearchWellsParams extends WellBounds {
  review_status?: ReviewStatus
  /** 1–2000; the server defaults to 500. */
  limit?: number
}

const DEFAULT_LIMIT = 50

/** Server-enforced ceiling on markers returned by /wells/search. */
export const SEARCH_MAX_LIMIT = 2000

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

  /**
   * Wells inside a map viewport, as lightweight markers. Re-run this as the
   * user pans/zooms. Rejects with 400 `WELL_INVALID_BOUNDS` when a `min_*` is
   * not strictly below its `max_*`, so callers must normalise first.
   */
  search: (params: SearchWellsParams) => {
    const qs = new URLSearchParams({
      min_lat: String(params.min_lat),
      min_lon: String(params.min_lon),
      max_lat: String(params.max_lat),
      max_lon: String(params.max_lon),
    })
    if (params.review_status) qs.set('review_status', params.review_status)
    if (params.limit != null) qs.set('limit', String(params.limit))
    return request<WellSearchResponse>(`/wells/search?${qs.toString()}`, {
      auth: 'access',
    })
  },

  /** A single well by server id (404 WELL_NOT_FOUND if not in this tenant). */
  get: (id: string) => request<Well>(`/wells/${id}`, { auth: 'access' }),
}
