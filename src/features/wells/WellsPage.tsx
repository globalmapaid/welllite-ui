import { ChevronLeft, ChevronRight, List, MapIcon } from 'lucide-react'
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
  WELL_STATUS_LABELS,
  WELL_TYPE_LABELS,
} from '@/lib/wells'
import { useAuth } from '@/providers/auth-context'
import { useWells } from './queries'
import { WellsMap } from './WellsMap'

const PAGE_SIZE = 20

type View = 'list' | 'map'

const VIEWS = [
  { id: 'list', label: 'List', icon: List },
  { id: 'map', label: 'Map', icon: MapIcon },
] as const

export function WellsPage() {
  const { currentClientId } = useAuth()
  const [view, setView] = useState<View>('list')
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | ''>('')

  return (
    <div>
      <PageHeader
        title="Wells"
        description="Well surveys captured in the field, with server-validated WGS84 coordinates."
        actions={
          currentClientId && (
            <div className="flex overflow-hidden rounded-md border border-input">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  aria-pressed={view === v.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                    view === v.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <v.icon className="size-4" />
                  {v.label}
                </button>
              ))}
            </div>
          )
        }
      />

      {!currentClientId ? (
        <NeedsProject />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Label htmlFor="review-filter" className="text-muted-foreground">
              Review status
            </Label>
            <NativeSelect
              id="review-filter"
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

          {view === 'map' ? (
            // Keyed on the tenant so switching projects rebuilds the map and
            // re-fits it to the new tenant's wells.
            <WellsMap
              key={currentClientId}
              reviewStatus={reviewStatus || undefined}
            />
          ) : (
            // Keyed on the filter so changing it resets pagination to page 1.
            <WellsList key={reviewStatus} reviewStatus={reviewStatus} />
          )}
        </>
      )}
    </div>
  )
}

function WellsList({ reviewStatus }: { reviewStatus: ReviewStatus | '' }) {
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
  const wells = useWells(params)
  const items = wells.data?.items ?? []
  const total = wells.data?.total ?? 0

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

  return (
    <>
      {wells.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{messageForError(wells.error)}</AlertDescription>
        </Alert>
      )}

      <Card
        className={cn(
          'overflow-hidden transition-opacity',
          wells.isPlaceholderData && 'opacity-60',
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Captured</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wells.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!wells.isLoading &&
              items.map((w) => (
                <TableRow
                  key={w.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/wells/${w.id}`)}
                >
                  <TableCell className="font-medium">
                    {w.name || (
                      <span className="text-muted-foreground">Unnamed well</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.well_type ? WELL_TYPE_LABELS[w.well_type] : '—'}
                  </TableCell>
                  <TableCell>
                    {w.well_status ? (
                      <Badge
                        variant={w.well_status === 'working' ? 'success' : 'destructive'}
                      >
                        {WELL_STATUS_LABELS[w.well_status]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {w.latitude.toFixed(5)}, {w.longitude.toFixed(5)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={REVIEW_STATUS_VARIANT[w.review_status]}>
                      {REVIEW_STATUS_LABELS[w.review_status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(w.created_at)}
                  </TableCell>
                </TableRow>
              ))}

            {!wells.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  {reviewStatus
                    ? `No ${REVIEW_STATUS_LABELS[reviewStatus].toLowerCase()} wells.`
                    : 'No wells captured yet.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{total === 0 ? 'No wells' : `Showing ${from}–${to} of ${total}`}</span>
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
  )
}
