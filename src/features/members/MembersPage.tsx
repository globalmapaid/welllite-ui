import { ChevronLeft, ChevronRight, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-context'
import { AddMemberDialog } from './AddMemberDialog'
import { MemberRoleSelect } from './MemberRoleSelect'
import { useMembers, useUpdateMember } from './queries'
import { RemoveMemberDialog } from './RemoveMemberDialog'

const PAGE_SIZE = 20

export function MembersPage() {
  const { user } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [showRemoved, setShowRemoved] = useState(false)
  const [offset, setOffset] = useState(0)
  const [toRemove, setToRemove] = useState<Member | null>(null)
  const reactivate = useUpdateMember()

  // Debounce the search box and reset to the first page on a new query.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setOffset(0)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const params = useMemo(
    () => ({
      search: search || undefined,
      is_active: showRemoved ? undefined : true,
      limit: PAGE_SIZE,
      offset,
    }),
    [search, showRemoved, offset],
  )
  const members = useMembers(params)
  const items = members.data?.items ?? []
  const total = members.data?.total ?? 0

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

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

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9"
            aria-label="Search members"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-removed"
            checked={showRemoved}
            onCheckedChange={(v) => {
              setShowRemoved(v)
              setOffset(0)
            }}
          />
          <Label htmlFor="show-removed" className="text-muted-foreground">
            Include removed
          </Label>
        </div>
      </div>

      <Card
        className={cn(
          'overflow-hidden transition-opacity',
          members.isPlaceholderData && 'opacity-60',
        )}
      >
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!members.isLoading &&
              items.map((m) => {
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

            {!members.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {search
                    ? `No members match “${search}”.`
                    : 'No members yet. Add the first one.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{total === 0 ? 'No members' : `Showing ${from}–${to} of ${total}`}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <RemoveMemberDialog member={toRemove} onClose={() => setToRemove(null)} />
    </div>
  )
}
