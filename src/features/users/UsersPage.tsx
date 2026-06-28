import { ChevronLeft, ChevronRight, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { ApiError } from '@/lib/api/http'
import type { PlatformUser } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { ROLE_LABELS } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-context'
import { usePlatformUsers } from './queries'

const PAGE_SIZE = 20

function MembershipsCell({ user }: { user: PlatformUser }) {
  if (user.memberships.length === 0) {
    return <span className="text-xs text-muted-foreground">No projects</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {user.memberships.map((m) => (
        <Badge
          key={m.membership_id}
          variant={m.is_active ? 'secondary' : 'muted'}
          className={cn('font-normal', !m.is_active && 'line-through')}
          title={`${m.client_name} · ${ROLE_LABELS[m.role]}${m.is_active ? '' : ' (removed)'}`}
        >
          {m.client_name} · {ROLE_LABELS[m.role]}
        </Badge>
      ))}
    </div>
  )
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [offset, setOffset] = useState(0)

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
      is_active: activeOnly ? true : undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [search, activeOnly, offset],
  )
  const users = usePlatformUsers(params)
  const items = users.data?.items ?? []
  const total = users.data?.total ?? 0

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

  // The endpoint may not be deployed on this server yet — degrade gracefully.
  const notAvailable = users.error instanceof ApiError && users.error.status === 404

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search every user across all projects."
      />

      {notAvailable ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <h2 className="text-lg font-semibold">Not available yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Cross-platform user search isn’t enabled on this server yet. It will
              appear here automatically once the backend endpoint is deployed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {users.isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{messageForError(users.error)}</AlertDescription>
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
                aria-label="Search users"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active-only"
                checked={activeOnly}
                onCheckedChange={(v) => {
                  setActiveOnly(v)
                  setOffset(0)
                }}
              />
              <Label htmlFor="active-only" className="text-muted-foreground">
                Active accounts only
              </Label>
            </div>
          </div>

          <Card
            className={cn(
              'overflow-hidden transition-opacity',
              users.isPlaceholderData && 'opacity-60',
            )}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!users.isLoading &&
                  items.map((u) => {
                    const isSelf = u.id === currentUser?.id
                    return (
                      <TableRow key={u.id} className={u.is_active ? '' : 'opacity-60'}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {u.first_name} {u.last_name}
                            {u.is_super_admin && (
                              <Badge title="Super admin">
                                <ShieldCheck className="mr-1 size-3" />
                                Admin
                              </Badge>
                            )}
                            {isSelf && <Badge variant="secondary">You</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span>{u.email}</span>
                            {!u.email_verified_at && (
                              <span className="text-xs text-warning">Unverified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <MembershipsCell user={u} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? 'success' : 'muted'}>
                            {u.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                {!users.isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      {search ? `No users match “${search}”.` : 'No users found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{total === 0 ? 'No users' : `Showing ${from}–${to} of ${total}`}</span>
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
        </>
      )}
    </div>
  )
}
