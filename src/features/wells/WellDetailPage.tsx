import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { NeedsProject } from '@/components/NeedsProject'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Well } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_VARIANT,
  WELL_STATUS_LABELS,
  WELL_TYPE_LABELS,
} from '@/lib/wells'
import { useAuth } from '@/providers/auth-context'
import { useReadings } from '@/features/readings/queries'
import { useWell } from './queries'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

const dash = <span className="text-muted-foreground">—</span>

export function WellDetailPage() {
  const { currentClientId } = useAuth()
  const { id } = useParams<{ id: string }>()
  const well = useWell(id)
  const readings = useReadings({ well_id: id, limit: 200 })

  const backLink = (
    <Link
      to="/wells"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to wells
    </Link>
  )

  if (!currentClientId) {
    return (
      <div>
        {backLink}
        <NeedsProject />
      </div>
    )
  }

  if (well.isError) {
    return (
      <div>
        {backLink}
        <Alert variant="destructive">
          <AlertDescription>{messageForError(well.error)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const w: Well | undefined = well.data
  const readingItems = readings.data?.items ?? []

  return (
    <div>
      {backLink}
      <PageHeader
        title={well.isLoading ? 'Well' : w?.name || 'Unnamed well'}
        description="Survey details and Static Water Level readings for this well."
        actions={
          w && (
            <Badge variant={REVIEW_STATUS_VARIANT[w.review_status]}>
              {REVIEW_STATUS_LABELS[w.review_status]}
            </Badge>
          )
        }
      />

      <Card>
        <CardContent className="pt-6">
          {well.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : w ? (
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Coordinates (WGS84)">
                <span className="font-mono">
                  {w.latitude.toFixed(6)}, {w.longitude.toFixed(6)}
                </span>
              </Detail>
              <Detail label="Confirmed on site">
                {w.well_confirmed ? 'Yes' : 'No'}
              </Detail>
              <Detail label="Type">
                {w.well_type ? WELL_TYPE_LABELS[w.well_type] : dash}
              </Detail>
              <Detail label="Operating status">
                {w.well_status ? (
                  <Badge
                    variant={w.well_status === 'working' ? 'success' : 'destructive'}
                  >
                    {WELL_STATUS_LABELS[w.well_status]}
                  </Badge>
                ) : (
                  dash
                )}
              </Detail>
              <Detail label="Daily users (est.)">
                {w.daily_users_estimate ?? dash}
              </Detail>
              <Detail label="Opening diameter">
                {w.opening_diameter_cm ? `${w.opening_diameter_cm} cm` : dash}
              </Detail>
              <Detail label="Distance to other water">
                {w.distance_to_other_water_km
                  ? `${w.distance_to_other_water_km} km`
                  : dash}
              </Detail>
              <Detail label="Owner">{w.owner_name || dash}</Detail>
              <Detail label="Owner mobile">{w.owner_mobile || dash}</Detail>
              <Detail label="Captured">{formatDateTime(w.created_at)}</Detail>
              <Detail label="Comments">{w.comments || dash}</Detail>
              {w.review_note && (
                <Detail label="Review note">{w.review_note}</Detail>
              )}
            </dl>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            Readings{readings.data ? ` (${readings.data.total})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {readings.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {messageForError(readings.error)}
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Measured on</TableHead>
                  <TableHead>SWL (metres)</TableHead>
                  <TableHead>Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.isLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!readings.isLoading &&
                  readingItems.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {formatDate(r.measured_on)}
                      </TableCell>
                      <TableCell className="font-mono">{r.swl_metres}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(r.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}

                {!readings.isLoading && readingItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No readings recorded for this well yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
