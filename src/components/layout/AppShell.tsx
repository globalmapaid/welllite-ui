import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useCurrentTenant } from '@/features/tenants/queries'
import { ROLE_LABELS } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-context'
import { Sidebar } from './Sidebar'
import { TenantSwitcher } from './TenantSwitcher'
import { UserMenu } from './UserMenu'

export function AppShell() {
  const { isSuperAdmin, role } = useAuth()
  const tenant = useCurrentTenant()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-svh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 md:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <div className="flex flex-1 items-center gap-3">
            {isSuperAdmin ? (
              <TenantSwitcher />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    !tenant.data && 'text-muted-foreground',
                  )}
                >
                  {tenant.data?.name ?? 'WellLite'}
                </span>
                {role && <Badge variant="muted">{ROLE_LABELS[role]}</Badge>}
              </div>
            )}
          </div>

          <UserMenu />
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
