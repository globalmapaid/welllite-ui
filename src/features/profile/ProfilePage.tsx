import { LogOut } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useCurrentTenant } from '@/features/tenants/queries'
import { ROLE_LABELS } from '@/lib/roles'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/providers/auth-context'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  )
}

export function ProfilePage() {
  const { user, role, isSuperAdmin, logout } = useAuth()
  const tenant = useCurrentTenant()

  return (
    <div>
      <PageHeader title="Profile" description="Your account details and session." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Row label="Name">
              {user?.first_name} {user?.last_name}
            </Row>
            <Row label="Email">{user?.email}</Row>
            <Row label="Email status">
              <Badge variant={user?.email_verified_at ? 'success' : 'muted'}>
                {user?.email_verified_at
                  ? `Verified ${formatDateTime(user.email_verified_at)}`
                  : 'Unverified'}
              </Badge>
            </Row>
            <Row label="Account type">
              {isSuperAdmin ? (
                <Badge>Super admin</Badge>
              ) : (
                <span className="text-muted-foreground">Standard</span>
              )}
            </Row>
            <Row label="User ID">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {user?.id}
              </code>
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <div className="text-sm text-muted-foreground">Organisation</div>
              <div className="font-medium">
                {tenant.data?.name ?? (isSuperAdmin ? 'Not scoped' : '—')}
              </div>
            </div>
            {role && (
              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <Badge variant="muted" className="mt-1">
                  {ROLE_LABELS[role]}
                </Badge>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => void logout()}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
