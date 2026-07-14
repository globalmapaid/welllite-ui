import { Building2, Database, Gauge, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentTenant, useTenantList } from '@/features/tenants/queries'
import { ROLE_LABELS } from '@/lib/roles'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/providers/auth-context'

export function DashboardPage() {
  const { user, isSuperAdmin, role, currentClientId } = useAuth()
  const tenant = useCurrentTenant()
  const tenants = useTenantList(isSuperAdmin)

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.first_name ?? ''}`.trim()}
        description="Manage WellLite accounts and projects from here."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current project
            </CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {tenant.data?.name ??
                (currentClientId ? '…' : isSuperAdmin ? 'Not scoped' : '—')}
            </div>
            {role && (
              <Badge variant="muted" className="mt-2">
                {ROLE_LABELS[role]}
              </Badge>
            )}
            {isSuperAdmin && !currentClientId && (
              <p className="mt-2 text-xs text-muted-foreground">
                Use the project switcher above to select one.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account
            </CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-base font-medium">{user?.email}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {isSuperAdmin && <Badge>Super admin</Badge>}
              <Badge variant={user?.email_verified_at ? 'success' : 'muted'}>
                {user?.email_verified_at ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            {user?.email_verified_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Verified {formatDateTime(user.email_verified_at)}
              </p>
            )}
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projects
              </CardTitle>
              <Database className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {tenants.data?.length ?? '—'}
              </div>
              <Link
                to="/projects"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Manage projects →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-4 text-primary" />
            Field data
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Wells and Static Water Level readings are captured in the WellLite mobile
          app. Browse this project's{' '}
          <Link to="/wells" className="text-primary hover:underline">
            wells
          </Link>{' '}
          and{' '}
          <Link to="/readings" className="text-primary hover:underline">
            readings
          </Link>
          , including each well's validated coordinates and review status.
        </CardContent>
      </Card>
    </div>
  )
}
