import { request } from './http'
import type { Member, MessageEnvelope, Role } from './types'

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
   * Assign a member by email. Deliberately non-revealing: returns 202 with a
   * generic envelope whether or not the email maps to a real account. Re-fetch
   * the list afterwards to see the real result.
   */
  assign: (payload: AssignMemberPayload) =>
    request<MessageEnvelope>('/clients/members', {
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
