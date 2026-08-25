import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Well, WellVerificationStatus } from '@/lib/api/types'
import { messageForError } from '@/lib/errorCodes'
import { cn } from '@/lib/utils'
import { useReviewWell } from './queries'

const VERDICTS: {
  value: WellVerificationStatus
  label: string
  description: string
}[] = [
  {
    value: 'approved',
    label: 'Verified',
    description: 'A supervisor confirms this record is correct.',
  },
  {
    value: 'pending',
    label: 'Not verified',
    description: 'Nobody senior has confirmed this record yet.',
  },
]

/**
 * A supervisor's verdict on a well — deliberately not an edit form. It changes
 * only whether the record is confirmed; correcting the data itself is a change
 * request, a separate flow.
 *
 * The note is pre-filled with whatever is already on the well, because the API
 * writes `review_note` verbatim: submitting an empty box would wipe a previous
 * reviewer's note rather than leave it alone.
 */
export function WellReviewDialog({
  well,
  open,
  onClose,
}: {
  well: Well
  open: boolean
  onClose: () => void
}) {
  // A well is only ever pending or approved; `discarded` is rejected by the API
  // and has no meaning here, so the toggle simply can't express it.
  const current: WellVerificationStatus =
    well.review_status === 'approved' ? 'approved' : 'pending'

  const [verdict, setVerdict] = useState<WellVerificationStatus>(
    current === 'approved' ? 'pending' : 'approved',
  )
  const [note, setNote] = useState(well.review_note ?? '')
  const review = useReviewWell()

  // Re-seed each time it opens, so a cancelled edit doesn't linger and the note
  // always starts from what's actually on the record.
  useEffect(() => {
    if (!open) return
    setVerdict(current === 'approved' ? 'pending' : 'approved')
    setNote(well.review_note ?? '')
  }, [open, current, well.review_note])

  const submit = () => {
    review.mutate(
      {
        id: well.id,
        // Send the note back even when unchanged: the API overwrites the field,
        // so omitting it would clear a note the reviewer never touched.
        payload: { review_status: verdict, review_note: note.trim() || null },
      },
      {
        onSuccess: () => {
          toast.success(
            verdict === 'approved'
              ? 'Well marked as verified.'
              : 'Well returned to unverified.',
          )
          onClose()
        },
        onError: (err) => toast.error(messageForError(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verification</DialogTitle>
          <DialogDescription>
            This records whether a supervisor has confirmed the record. It does
            not change any of the well's data — to correct the data itself, file
            a change request.
          </DialogDescription>
        </DialogHeader>

        <fieldset disabled={review.isPending} className="space-y-2">
          <legend className="sr-only">Verification state</legend>
          {VERDICTS.map((v) => {
            const selected = verdict === v.value
            return (
              <label
                key={v.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-accent',
                )}
              >
                <input
                  type="radio"
                  name="well-verdict"
                  value={v.value}
                  checked={selected}
                  onChange={() => setVerdict(v.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                    selected ? 'border-primary' : 'border-input',
                  )}
                >
                  {selected && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium leading-tight">
                    {v.label}
                    {v.value === current && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        current
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {v.description}
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="well-review-note">Review note (optional)</Label>
          <Textarea
            id="well-review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why this verdict — visible to anyone viewing the well."
            disabled={review.isPending}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={review.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={review.isPending || verdict === current}
          >
            {review.isPending
              ? 'Saving…'
              : verdict === 'approved'
                ? 'Mark as verified'
                : 'Return to unverified'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
