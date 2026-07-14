import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NeedsProject } from '@/components/NeedsProject'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { messageForError } from '@/lib/errorCodes'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/providers/auth-context'
import { useReadings } from './queries'

const PAGE_SIZE = 20

export function ReadingsPage() {
  const { currentClientId } = useAuth()
  const [offset, setOffset] = useState(0)

  const params = useMemo(() => ({ limit: PAGE_SIZE, offset }), [offset])
  const readings = useReadings(params)
  const items = readings.data?.items ?? []
  const total = readings.data?.total ?? 0

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

  return (
    <div>
      <PageHeader
        title="Readings"
        description="Static Water Level (SWL) readings recorded against wells, most recent first."
      />

      {!currentClientId ? (
        <NeedsProject />
      ) : (
        <>
          {readings.isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {messageForError(readings.error)}
              </AlertDescription>
            </Alert>
          )}

          <Card
            className={cn(
              'overflow-hidden transition-opacity',
              readings.isPlaceholderData && 'opacity-60',
            )}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Measured on</TableHead>
                  <TableHead>SWL (metres)</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead className="text-right">Well</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!readings.isLoading &&
                  items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {formatDate(r.measured_on)}
                      </TableCell>
                      <TableCell className="font-mono">{r.swl_metres}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(r.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/wells/${r.well_id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View well →
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}

                {!readings.isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No readings recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total === 0 ? 'No readings' : `Showing ${from}–${to} of ${total}`}
            </span>
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
