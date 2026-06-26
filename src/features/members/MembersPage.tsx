import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Member } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { useAuth } from '@/providers/auth-context'
import { AddMemberDialog } from './AddMemberDialog'
import { MemberRoleSelect } from './MemberRoleSelect'
import { useMembers, useUpdateMember } from './queries'
import { RemoveMemberDialog } from './RemoveMemberDialog'

export function MembersPage() {
  const { user } = useAuth()
  const members = useMembers()
  const reactivate = useUpdateMember()
  const [showRemoved, setShowRemoved] = useState(false)
  const [toRemove, setToRemove] = useState<Member | null>(null)

  const all = members.data ?? []
  const removedCount = all.filter((m) => !m.is_active).length
  const visible = showRemoved ? all : all.filter((m) => m.is_active)

  const onReactivate = (member: Member) => {
    reactivate.mutate(
      { userId: member.user_id, payload: { is_active: true } },
      {
        onSuccess: () => toast.success('Member reactivated.'),
        onError: (err) => toast.error(messageForError(err)),
      },
    )
  }

  return (
    <div>
      <PageHeader
        title="Team members"
        description="Manage who belongs to this organisation."
        actions={<AddMemberDialog />}
      />

      {members.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{messageForError(members.error)}</AlertDescription>
        </Alert>
      )}

      <div className="mb-3 flex items-center gap-2">
        <Switch
          id="show-removed"
          checked={showRemoved}
          onCheckedChange={setShowRemoved}
          disabled={removedCount === 0}
        />
        <Label htmlFor="show-removed" className="text-muted-foreground">
          Show removed members
          {removedCount > 0 && ` (${removedCount})`}
        </Label>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {visible.map((m) => {
              const isSelf = m.user_id === user?.id
              return (
                <TableRow key={m.id} className={m.is_active ? '' : 'opacity-60'}>
                  <TableCell className="font-medium">
                    {m.first_name} {m.last_name}
                    {isSelf && (
                      <Badge variant="secondary" className="ml-2">
                        You
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <MemberRoleSelect member={m} editable={m.is_active && !isSelf} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.is_active ? 'success' : 'muted'}>
                      {m.is_active ? 'Active' : 'Removed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : m.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setToRemove(m)}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReactivate(m)}
                        disabled={reactivate.isPending}
                      >
                        <RotateCcw className="size-4" />
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}

            {!members.isLoading && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {all.length === 0
                    ? 'No members yet. Add the first one.'
                    : 'No active members to show.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <RemoveMemberDialog member={toRemove} onClose={() => setToRemove(null)} />
    </div>
  )
}
