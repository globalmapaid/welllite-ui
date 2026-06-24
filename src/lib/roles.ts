import type { Role } from './api/types'

/** Human-readable labels for membership roles. */
export const ROLE_LABELS: Record<Role, string> = {
  client_admin: 'Organisation admin',
  supervisor: 'Supervisor',
  member: 'Member',
}
