import { Check, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Member, Role } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { ROLE_LABELS, ROLES } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useUpdateMember } from './queries'

/**
 * Inline role picker for a member row. Renders a static badge when not editable
 * (the admin's own row, or a removed member).
 */
export function MemberRoleSelect({
  member,
  editable,
}: {
  member: Member
  editable: boolean
}) {
  const update = useUpdateMember()

  if (!editable) {
    return <Badge variant="muted">{ROLE_LABELS[member.role]}</Badge>
  }

  const pick = (role: Role) => {
    if (role === member.role) return
    update.mutate(
      { userId: member.user_id, payload: { role } },
      {
        onSuccess: () => toast.success(`Role updated to ${ROLE_LABELS[role]}.`),
        onError: (err) => toast.error(messageForError(err)),
      },
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={update.isPending}
        className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-sm transition-colors hover:bg-accent disabled:opacity-60"
      >
        {ROLE_LABELS[member.role]}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ROLES.map((r) => (
          <DropdownMenuItem key={r} onSelect={() => pick(r)}>
            <Check
              className={cn('size-4', r === member.role ? 'opacity-100' : 'opacity-0')}
            />
            {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
