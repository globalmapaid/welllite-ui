import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/providers/auth-context'

/**
 * Restricts a route subtree to client admins. A super-admin scoped into a tenant
 * carries `client_admin` in their token, so the same gate covers both.
 */
export function RequireClientAdmin() {
  const { role } = useAuth()
  if (role !== 'client_admin') return <Navigate to="/" replace />
  return <Outlet />
}
