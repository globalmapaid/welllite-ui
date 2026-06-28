import {
  Database,
  Gauge,
  LayoutDashboard,
  UserCircle,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-context'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  soon?: boolean
  superAdmin?: boolean
  clientAdmin?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organisations', label: 'Organisations', icon: Database, superAdmin: true },
  { to: '/users', label: 'Users', icon: UsersRound, superAdmin: true },
  { to: '/members', label: 'Team', icon: Users, clientAdmin: true },
  { to: '/wells', label: 'Wells', icon: Gauge, soon: true },
  { to: '/readings', label: 'Readings', icon: Gauge, soon: true },
  { to: '/profile', label: 'Profile', icon: UserCircle },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isSuperAdmin, role, currentClientId } = useAuth()
  // Client-admin areas are per-organisation, so they need a selected tenant.
  // A super-admin carries client_admin authority but is unscoped until they
  // pick an organisation — hide those links until then.
  const isClientAdmin = role === 'client_admin' && currentClientId != null
  const items = NAV.filter(
    (i) =>
      (!i.superAdmin || isSuperAdmin) && (!i.clientAdmin || isClientAdmin),
  )

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <BrandMark subtitle="Console" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
        WellMapr™ · WellLite
      </div>
    </div>
  )
}
