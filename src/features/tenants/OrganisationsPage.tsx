import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ClientTenant } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { formatDateTime } from '@/lib/utils'
import { useTenantList } from './queries'
import { CreateTenantDialog } from './CreateTenantDialog'
import { EditTenantDialog } from './EditTenantDialog'

export function OrganisationsPage() {
  const tenants = useTenantList(true)
  const [editing, setEditing] = useState<ClientTenant | null>(null)

  return (
    <div>
      <PageHeader
        title="Organisations"
        description="Tenants on the WellLite platform."
        actions={<CreateTenantDialog />}
      />

      {tenants.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{messageForError(tenants.error)}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {tenants.data?.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>
                  <Badge variant={t.is_active ? 'success' : 'muted'}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(t.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {tenants.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No organisations yet. Create the first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <EditTenantDialog tenant={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
