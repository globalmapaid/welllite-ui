import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RequireClientAdmin } from '@/components/RequireClientAdmin'
import { RequireSuperAdmin } from '@/components/RequireSuperAdmin'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { SelectOrganisationPage } from '@/features/auth/SelectOrganisationPage'
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { ReadingsPage } from '@/features/placeholders/ReadingsPage'
import { WellsPage } from '@/features/placeholders/WellsPage'
import { MembersPage } from '@/features/members/MembersPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { OrganisationsPage } from '@/features/tenants/OrganisationsPage'
import { UsersPage } from '@/features/users/UsersPage'

function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/select-organisation" element={<SelectOrganisationPage />} />

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wells" element={<WellsPage />} />
          <Route path="/readings" element={<ReadingsPage />} />
          <Route element={<RequireClientAdmin />}>
            <Route path="/members" element={<MembersPage />} />
          </Route>
          <Route element={<RequireSuperAdmin />}>
            <Route path="/organisations" element={<OrganisationsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
