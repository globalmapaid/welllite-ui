import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/providers/auth-context'

/**
 * Restricts a route subtree to client admins of a selected project. A
 * super-admin carries `client_admin` authority but is unscoped until they pick a
 * project, so we also require a current client_id — otherwise the per-project
 * pages have no project to act on and we send them back to the dashboard.
 */
export function RequireClientAdmin() {
  const { role, currentClientId } = useAuth()
  if (role !== 'client_admin' || !currentClientId) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
