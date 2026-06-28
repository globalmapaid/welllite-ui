import { request } from './http'
import type { PaginatedUsers } from './types'

export interface ListUsersParams {
  /** Case-insensitive substring over email / first name / last name. */
  search?: string
  /** Omit for everyone; true/false to filter by account status. */
  is_active?: boolean
  limit?: number
  offset?: number
}

const DEFAULT_LIMIT = 50

/**
 * Platform-wide user directory — super-admin only, not tenant-scoped. Distinct
 * from membersApi (which is the single-tenant, client-admin member list).
 */
export const usersApi = {
  list: (params: ListUsersParams = {}): Promise<PaginatedUsers> => {
    const limit = params.limit ?? DEFAULT_LIMIT
    const offset = params.offset ?? 0
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
    qs.set('limit', String(limit))
    qs.set('offset', String(offset))
    return request<PaginatedUsers>(`/users?${qs.toString()}`, { auth: 'access' })
  },
}
