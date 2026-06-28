import { request } from './http'
import type { Member, Role } from './types'

export interface AssignMemberPayload {
  email: string
  role?: Role
}

export interface UpdateMemberPayload {
  role?: Role
  is_active?: boolean
}

/**
 * Tenant member management (client-admin only). The tenant is taken from the
 * access token's scope on the server — never send a client_id.
 */
export const membersApi = {
  /** List all members of the current tenant (active and soft-removed). */
  list: () => request<Member[]>('/clients/members', { auth: 'access' }),

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
