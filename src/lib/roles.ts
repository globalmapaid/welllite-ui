import type { Role } from './api/types'

/** Human-readable labels for membership roles. */
export const ROLE_LABELS: Record<Role, string> = {
  client_admin: 'Project admin',
  supervisor: 'Supervisor',
  member: 'Member',
}

/** All assignable roles, in descending order of authority. */
export const ROLES: readonly Role[] = ['client_admin', 'supervisor', 'member']
