import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/http'
import type {
  ReviewDecision,
  WellChangeDetail,
  WellVerdict,
} from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { cn } from '@/lib/utils'
import { useReviewWellChange } from './queries'

interface Choice<T extends string> {
  value: T
  label: string
  description: string
}

function ChoiceGroup<T extends string>({
  name,
  legend,
  hint,
  choices,
  value,
  onChange,
  disabled,
}: {
  name: string
  legend: string
  hint: string
  choices: Choice<T>[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className="space-y-2 disabled:opacity-50">
      <legend className="text-sm font-medium">{legend}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="grid gap-2 pt-1 sm:grid-cols-2">
        {choices.map((c) => {
          const selected = value === c.value
          return (
            <label
              key={c.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent',
              )}
            >
              <input
                type="radio"
                name={name}
                value={c.value}
                checked={selected}
                onChange={() => onChange(c.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-primary' : 'border-input',
                )}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-medium leading-tight">
                  {c.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {c.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

const DECISIONS: Choice<ReviewDecision>[] = [
  {
    value: 'approved',
    label: 'Apply to the well',
    description:
      'Writes the whole survey onto the well. There is no per-field accept.',
  },
  {
    value: 'discarded',
    label: 'Discard the survey',
    description: 'Rejects the submission and leaves the well exactly as it is.',
  },
]

const VERDICTS: Choice<WellVerdict>[] = [
  {
    value: 'pending',
    label: 'Still incomplete',
    description:
      'The survey improved the record, but it isn’t confirmed yet. The usual outcome.',
  },
  {
    value: 'approved',
    label: 'Verified',
    description: 'The record is now confirmed and needs no further survey.',
  },
]

/**
 * The reviewer's two independent judgements, deliberately kept as separate
 * controls: what happens to the proposed data, and — only when it is applied —
 * whether the well itself now counts as verified. Approving a survey does not
 * imply the record is complete, so there is no single "Approve" button.
 */
export function ReviewPanel({
  request,
  onDecided,
}: {
  request: WellChangeDetail
  onDecided: () => void
}) {
  const [decision, setDecision] = useState<ReviewDecision | null>(null)
  const [verdict, setVerdict] = useState<WellVerdict>('pending')
  const [note, setNote] = useState('')
  const review = useReviewWellChange()

  const submit = () => {
    if (!decision) return
    review.mutate(
      {
        id: request.id,
        payload: {
          decision,
          // Required when approving, and rejected outright when discarding.
          ...(decision === 'approved' ? { well_review_status: verdict } : {}),
          ...(note.trim() ? { review_note: note.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            decision === 'discarded'
              ? 'Survey discarded. The well was left unchanged.'
              : verdict === 'approved'
                ? 'Survey applied. The well is now verified.'
                : 'Survey applied. The well is still pending review.',
          )
          onDecided()
        },
        onError: (err) => {
          // Not a failure to retry: someone else decided it first.
          if (
            err instanceof ApiError &&
            err.code === 'WELL_CHANGE_NOT_PENDING'
          ) {
            toast.info('Another reviewer has already handled this request.')
            onDecided()
            return
          }
          toast.error(messageForError(err))
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <ChoiceGroup
          name="decision"
          legend="Proposed data"
          hint="Does the survey belong on the well record?"
          choices={DECISIONS}
          value={decision}
          onChange={setDecision}
          disabled={review.isPending}
        />

        {decision === 'approved' && (
          <ChoiceGroup
            name="well_review_status"
            legend="Well record status"
            hint="A separate judgement: does this survey leave the record complete?"
            choices={VERDICTS}
            value={verdict}
            onChange={setVerdict}
            disabled={review.isPending}
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="review-note">Review note (optional)</Label>
          <Textarea
            id="review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              decision === 'discarded'
                ? 'Why is this survey being rejected?'
                : 'Anything the field team should know.'
            }
            disabled={review.isPending}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={decision === 'discarded' ? 'destructive' : 'default'}
            disabled={!decision || review.isPending}
            onClick={submit}
          >
            {review.isPending
              ? 'Submitting…'
              : decision === 'discarded'
                ? 'Discard survey'
                : 'Apply survey'}
          </Button>
          {!decision && (
            <span className="text-sm text-muted-foreground">
              Choose what happens to the proposed data.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
