import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { messageForError } from '@/lib/errorCodes'
import { cn } from '@/lib/utils'
import { useTenantList } from '@/features/tenants/queries'
import { useAuth } from '@/providers/auth-context'

/** Super-admin tenant scope switcher (uses /auth/switch-client). */
export function TenantSwitcher() {
  const { currentClientId, switchTenant } = useAuth()
  const tenants = useTenantList(true)
  const [switching, setSwitching] = useState(false)

  const current = tenants.data?.find((t) => t.id === currentClientId)

  const onSwitch = async (clientId: string) => {
    if (clientId === currentClientId) return
    setSwitching(true)
    try {
      await switchTenant(clientId)
      toast.success('Switched organisation.')
    } catch (err) {
      toast.error(messageForError(err))
    } finally {
      setSwitching(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={switching}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
      >
        <Building2 className="size-4 text-muted-foreground" />
        <span className="max-w-[12rem] truncate">
          {current?.name ?? 'Select organisation'}
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Scope into organisation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.isLoading && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading…</div>
        )}
        {tenants.data?.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => onSwitch(t.id)}
            className={cn(!t.is_active && 'opacity-60')}
          >
            <Check
              className={cn(
                'size-4',
                t.id === currentClientId ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span className="flex-1 truncate">{t.name}</span>
            {!t.is_active && (
              <span className="text-xs text-muted-foreground">inactive</span>
            )}
          </DropdownMenuItem>
        ))}
        {tenants.data?.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No organisations yet.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
