import { ArrowLeft, ExternalLink, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { NeedsProject } from '@/components/NeedsProject'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { WellChangeDetail } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { formatDateTime } from '@/lib/utils'
import { countChangeTypes } from '@/lib/wellChanges'
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_VARIANT,
  WELL_STATUS_LABELS,
  WELL_TYPE_LABELS,
} from '@/lib/wells'
import { useAuth } from '@/providers/auth-context'
import { useWell } from '@/features/wells/queries'
import { ChangeDiff } from './ChangeDiff'
import { useWellChange } from './queries'
import { ReviewPanel } from './ReviewPanel'

function Field({ label, children }: { label: string; children: ReactNode }) {
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

/** The survey exactly as it was submitted — the record of what was proposed,
 *  used once a request has been decided and its diff no longer means anything. */
function SubmittedSurvey({ request }: { request: WellChangeDetail }) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Name">{request.name || dash}</Field>
      <Field label="Coordinates (WGS84)">
        <span className="font-mono">
          {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
        </span>
      </Field>
      <Field label="Confirmed on site">
        {request.well_confirmed ? 'Yes' : 'No'}
      </Field>
      <Field label="Type">
        {request.well_type ? WELL_TYPE_LABELS[request.well_type] : dash}
      </Field>
      <Field label="Operating status">
        {request.well_status ? WELL_STATUS_LABELS[request.well_status] : dash}
      </Field>
      <Field label="Daily users (est.)">
        {request.daily_users_estimate ?? dash}
      </Field>
      <Field label="Opening diameter">
        {request.opening_diameter_cm ? `${request.opening_diameter_cm} cm` : dash}
      </Field>
      <Field label="Distance to other water">
        {request.distance_to_other_water_km
          ? `${request.distance_to_other_water_km} km`
          : dash}
      </Field>
      <Field label="Owner">{request.owner_name || dash}</Field>
      <Field label="Owner mobile">{request.owner_mobile || dash}</Field>
      <Field label="Comments">{request.comments || dash}</Field>
    </dl>
  )
}

/** What became of a decided request. */
function Outcome({ request }: { request: WellChangeDetail }) {
  const approved = request.review_status === 'approved'
  return (
    <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Decision">
        <Badge variant={REVIEW_STATUS_VARIANT[request.review_status]}>
          {approved ? 'Applied to the well' : 'Discarded'}
        </Badge>
      </Field>
      <Field label="Decided">{formatDateTime(request.reviewed_at)}</Field>
      {approved && (
        <Field label="Applied">{formatDateTime(request.applied_at)}</Field>
      )}
      <Field label="Review note">{request.review_note || dash}</Field>
    </dl>
  )
}

export function WellChangeDetailPage() {
  const { currentClientId, role } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const change = useWellChange(id)
  const request = change.data
  const well = useWell(request?.well_id)

  const canReview = role === 'supervisor' || role === 'client_admin'

  const backLink = (
    <Link
      to="/well-changes"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to change requests
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

  if (change.isError) {
    return (
      <div>
        {backLink}
        <Alert variant="destructive">
          <AlertDescription>{messageForError(change.error)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (change.isLoading || !request) {
    return (
      <div>
        {backLink}
        <PageHeader title="Change request" />
        <Card>
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const pending = request.review_status === 'pending'
  const counts = countChangeTypes(request.changes)

  return (
    <div>
      {backLink}
      <PageHeader
        title={request.name || 'Unnamed well'}
        description={`Survey submitted ${formatDateTime(request.created_at)}.`}
        actions={
          <>
            <Badge variant={REVIEW_STATUS_VARIANT[request.review_status]}>
              {REVIEW_STATUS_LABELS[request.review_status]}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link to={`/wells/${request.well_id}`}>
                View well
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      {pending && request.stale && (
        <Alert variant="info" className="mb-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <AlertTitle>The well changed after this survey was filed</AlertTitle>
            <AlertDescription>
              The comparison below is against the well as it stands now, so it
              shows values the surveyor never saw. Applying this survey still
              writes the whole submitted snapshot over the current record.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {pending ? 'Proposed changes' : 'Submitted survey'}
          </CardTitle>
          {pending ? (
            <p className="text-sm text-muted-foreground">
              {request.changes.length === 0
                ? 'Nothing to apply — this survey already matches the well.'
                : `${counts.changed} contradicting ${counts.changed === 1 ? 'value' : 'values'}, ${counts.cleared} cleared, ${counts.filled} filled in.`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {request.review_status === 'approved'
                ? 'This survey was applied to the well, so there is nothing left to compare — the well already carries these values (later surveys may have changed them since).'
                : 'This survey was rejected, so none of it reached the well. It is kept as a record of what was proposed.'}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {pending ? (
            request.changes.length > 0 && (
              <ChangeDiff changes={request.changes} />
            )
          ) : (
            <SubmittedSurvey request={request} />
          )}
        </CardContent>
      </Card>

      {!pending && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Outcome</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Outcome request={request} />
          </CardContent>
        </Card>
      )}

      {pending &&
        (canReview ? (
          <div className="mt-6">
            <ReviewPanel
              request={request}
              onDecided={() => navigate('/well-changes')}
            />
          </div>
        ) : (
          <Alert className="mt-6">
            <AlertDescription>
              Only supervisors and project admins can decide change requests.
            </AlertDescription>
          </Alert>
        ))}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Well</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Current name">
              {well.data ? well.data.name || dash : <Skeleton className="h-5 w-32" />}
            </Field>
            <Field label="Well review status">
              {well.data ? (
                <Badge variant={REVIEW_STATUS_VARIANT[well.data.review_status]}>
                  {REVIEW_STATUS_LABELS[well.data.review_status]}
                </Badge>
              ) : (
                <Skeleton className="h-5 w-20" />
              )}
            </Field>
            <Field label="Device key">
              <span className="font-mono text-xs text-muted-foreground">
                {request.client_uuid}
              </span>
            </Field>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
