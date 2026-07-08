import { useQuery } from '@tanstack/react-query'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authApi } from '@/lib/api/auth'
import { messageForError } from '@/lib/errorCodes'
import { ROLE_LABELS } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useCurrentTenant } from '@/features/tenants/queries'
import { useAuth } from '@/providers/auth-context'

/**
 * Project switcher for a regular (non-super-admin) user. Lists the user's own
 * memberships and switches in-session via select-client with the current access
 * token — no re-login. Renders a plain label when the user has one project.
 */
export function MembershipSwitcher() {
  const { currentClientId, role, selectMembership } = useAuth()
  const tenant = useCurrentTenant()
  const memberships = useQuery({
    queryKey: ['memberships'],
    queryFn: authApi.memberships,
  })
  const [switching, setSwitching] = useState(false)

  const list = memberships.data ?? []
  const name = tenant.data?.name ?? 'WellLite'

  const onSelect = async (membershipId: string, clientId: string) => {
    if (clientId === currentClientId) return
    setSwitching(true)
    try {
      await selectMembership(membershipId, navigator.userAgent.slice(0, 60))
      toast.success('Switched project.')
    } catch (err) {
      toast.error(messageForError(err))
    } finally {
      setSwitching(false)
    }
  }

  // One (or zero) project → nothing to switch between; show a static label.
  if (list.length <= 1) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{name}</span>
        {role && <Badge variant="muted">{ROLE_LABELS[role]}</Badge>}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={switching}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
      >
        <Building2 className="size-4 text-muted-foreground" />
        <span className="max-w-[12rem] truncate">{name}</span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch project</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.map((m) => (
          <DropdownMenuItem
            key={m.membership_id}
            onSelect={() => onSelect(m.membership_id, m.client_id)}
          >
            <Check
              className={cn(
                'size-4',
                m.client_id === currentClientId ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span className="flex-1 truncate">{m.client_name}</span>
            <span className="text-xs text-muted-foreground">
              {ROLE_LABELS[m.role]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
