import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/providers/auth-context'
import { FullPageLoader } from './FullPageLoader'

/** Gates the authenticated app: redirects based on session status. */
export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageLoader />
  if (status === 'preauth') return <Navigate to="/select-project" replace />
  if (status !== 'authenticated') return <Navigate to="/login" replace />

  return <Outlet />
}
