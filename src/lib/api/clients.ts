import { request } from './http'
import type { ClientTenant } from './types'

export interface UpdateTenantPayload {
  name?: string
  is_active?: boolean
}

export const clientsApi = {
  /** Current tenant the session is scoped to (for branding). */
  me: () => request<ClientTenant>('/clients/me', { auth: 'access' }),

  /** Super-admin: list all tenants. */
  list: () => request<ClientTenant[]>('/clients', { auth: 'access' }),

  /** Super-admin: create a tenant. */
  create: (name: string) =>
    request<ClientTenant>('/clients', {
      method: 'POST',
      body: { name },
      auth: 'access',
    }),

  /** Super-admin: update a tenant. */
  update: (id: string, payload: UpdateTenantPayload) =>
    request<ClientTenant>(`/clients/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: 'access',
    }),
}
