import { request } from './http'
import type {
  PaginatedWells,
  ReviewStatus,
  Well,
  WellSearchResponse,
  WellStatus,
  WellType,
} from './types'

/**
 * The filters both `/wells` and `/wells/search` accept, shared so the List and
 * Map views can't drift apart. All optional; the server ANDs whatever is set.
 */
export interface WellFilters {
  /** Filter to a single review status; omit for all. */
  review_status?: ReviewStatus
  well_type?: WellType
  well_status?: WellStatus
  /**
   * Case-insensitive substring match on the well's name. Wells with no name
   * never match. `%` is escaped server-side, not treated as a wildcard.
   */
  q?: string
}

export interface ListWellsParams extends WellFilters {
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

export interface SearchWellsParams extends WellBounds, WellFilters {
  /** 1–2000; the server defaults to 500. */
  limit?: number
}

const DEFAULT_LIMIT = 50

/**
 * Append the shared filters to a query string, skipping any that are unset.
 *
 * `q` is trimmed and dropped when blank: the server doesn't trim, so a stray
 * space would otherwise be a real substring match (every name containing one).
 */
function appendFilters(qs: URLSearchParams, filters: WellFilters): void {
  if (filters.review_status) qs.set('review_status', filters.review_status)
  if (filters.well_type) qs.set('well_type', filters.well_type)
  if (filters.well_status) qs.set('well_status', filters.well_status)
  const q = filters.q?.trim()
  if (q) qs.set('q', q)
}

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
    appendFilters(qs, params)
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
    appendFilters(qs, params)
    if (params.limit != null) qs.set('limit', String(params.limit))
    return request<WellSearchResponse>(`/wells/search?${qs.toString()}`, {
      auth: 'access',
    })
  },

  /** A single well by server id (404 WELL_NOT_FOUND if not in this tenant). */
  get: (id: string) => request<Well>(`/wells/${id}`, { auth: 'access' }),
}
