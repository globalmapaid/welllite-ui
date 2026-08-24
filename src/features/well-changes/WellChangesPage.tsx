import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NeedsProject } from '@/components/NeedsProject'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ReviewStatus } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { cn, formatDateTime } from '@/lib/utils'
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_VARIANT,
  REVIEW_STATUSES,
} from '@/lib/wells'
import { useAuth } from '@/providers/auth-context'
import { useWellChanges } from './queries'

const PAGE_SIZE = 20

const EMPTY_COPY: Record<ReviewStatus | '', string> = {
  pending: 'Nothing waiting for review.',
  approved: 'No surveys have been applied yet.',
  discarded: 'No surveys have been rejected.',
  '': 'No surveys have been filed against these wells yet.',
}

export function WellChangesPage() {
  const { currentClientId } = useAuth()
  // The queue exists to be worked through, so it opens on the work to do.
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | ''>('pending')

  return (
    <div>
      <PageHeader
        title="Change requests"
        description="Surveys filed against existing wells. A survey never edits a well directly — a reviewer applies or rejects the whole submission."
      />

      {!currentClientId ? (
        <NeedsProject />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Label htmlFor="request-filter" className="text-muted-foreground">
              Request status
            </Label>
            <NativeSelect
              id="request-filter"
              className="w-auto"
              value={reviewStatus}
              onChange={(e) =>
                setReviewStatus(e.target.value as ReviewStatus | '')
              }
            >
              <option value="">All</option>
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REVIEW_STATUS_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
          </div>

          {/* Keyed on the filter so changing it resets pagination to page 1. */}
          <RequestList key={reviewStatus} reviewStatus={reviewStatus} />
        </>
      )}
    </div>
  )
}

function RequestList({ reviewStatus }: { reviewStatus: ReviewStatus | '' }) {
  const navigate = useNavigate()
  const [offset, setOffset] = useState(0)

  const params = useMemo(
    () => ({
      review_status: reviewStatus || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [reviewStatus, offset],
  )
  const requests = useWellChanges(params)
  const items = requests.data?.items ?? []
  const total = requests.data?.total ?? 0

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)

  return (
    <>
      {requests.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{messageForError(requests.error)}</AlertDescription>
        </Alert>
      )}

      <Card
        className={cn(
          'overflow-hidden transition-opacity',
          requests.isPlaceholderData && 'opacity-60',
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Well</TableHead>
              <TableHead>Proposed coordinates</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Decided</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!requests.isLoading &&
              items.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/well-changes/${r.id}`)}
                >
                  <TableCell className="font-medium">
                    {r.name || (
                      <span className="text-muted-foreground">Unnamed well</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(r.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={REVIEW_STATUS_VARIANT[r.review_status]}>
                      {REVIEW_STATUS_LABELS[r.review_status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(r.reviewed_at)}
                  </TableCell>
                </TableRow>
              ))}

            {!requests.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  {EMPTY_COPY[reviewStatus]}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total === 0 ? 'No requests' : `Showing ${from}–${to} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
