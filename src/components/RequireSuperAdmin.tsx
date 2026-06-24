import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/providers/auth-context'

/** Restricts a route subtree to platform super-admins. */
export function RequireSuperAdmin() {
  const { isSuperAdmin } = useAuth()
  if (!isSuperAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
