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

  /**
   * Super-admin: create a tenant, optionally with its operating countries.
   * Unsupported codes fail with `422 CLIENT_UNSUPPORTED_COUNTRY`
   * (`params.countries` = bad codes).
   */
  create: (name: string, countries: string[] = []) =>
    request<ClientTenant>('/clients', {
      method: 'POST',
      body: { name, countries },
      auth: 'access',
    }),

  /** Super-admin: update a tenant's name and/or active flag. */
  update: (id: string, payload: UpdateTenantPayload) =>
    request<ClientTenant>(`/clients/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: 'access',
    }),

  /**
   * Super-admin: replace a tenant's full country list (authoritative — codes
   * not in the array are removed). Each must be supported by the geo validator,
   * else `422 CLIENT_UNSUPPORTED_COUNTRY` with `params.countries` = bad codes.
   */
  setCountries: (id: string, countries: string[]) =>
    request<ClientTenant>(`/clients/${id}/countries`, {
      method: 'PUT',
      body: { countries },
      auth: 'access',
    }),
}
