import { request } from './http'
import type { Member, PaginatedMembers, Role } from './types'

export interface AssignMemberPayload {
  email: string
  role?: Role
}

export interface UpdateMemberPayload {
  role?: Role
  is_active?: boolean
}

export interface ListMembersParams {
  /** Case-insensitive substring over email / first name / last name. */
  search?: string
  /** Omit for both active and removed; true/false to filter. */
  is_active?: boolean
  limit?: number
  offset?: number
}

const DEFAULT_LIMIT = 50

/**
 * Tenant member management (client-admin only). The tenant is taken from the
 * access token's scope on the server — never send a client_id.
 */
export const membersApi = {
  /**
   * List members of the current tenant, paginated and searchable. Tolerant
   * reader: accepts the pagination envelope, or normalises a legacy bare array
   * (so it keeps working across the backend deploy boundary).
   */
  list: async (params: ListMembersParams = {}): Promise<PaginatedMembers> => {
    const limit = params.limit ?? DEFAULT_LIMIT
    const offset = params.offset ?? 0
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
    qs.set('limit', String(limit))
    qs.set('offset', String(offset))

    const res = await request<PaginatedMembers | Member[]>(
      `/clients/members?${qs.toString()}`,
      { auth: 'access' },
    )
    if (Array.isArray(res)) {
      return { items: res, total: res.length, limit: res.length || limit, offset: 0 }
    }
    return res
  },

  /**
   * Assign a member by email. Returns 201 with the created (or reactivated)
   * member on success, or an explicit error explaining why it couldn't proceed
   * (e.g. unknown email, already a member, account disabled/unverified).
   */
  assign: (payload: AssignMemberPayload) =>
    request<Member>('/clients/members', {
      method: 'POST',
      body: payload,
      auth: 'access',
    }),

  /** Change a member's role and/or active status. */
  update: (userId: string, payload: UpdateMemberPayload) =>
    request<Member>(`/clients/members/${userId}`, {
      method: 'PATCH',
      body: payload,
      auth: 'access',
    }),

  /** Soft-remove a member (sets is_active=false and revokes their sessions). */
  remove: (userId: string) =>
    request<void>(`/clients/members/${userId}`, {
      method: 'DELETE',
      auth: 'access',
    }),
}
