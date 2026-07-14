import type { ReviewStatus, WellStatus, WellType } from './api/types'

/** Human-readable labels for well types. */
export const WELL_TYPE_LABELS: Record<WellType, string> = {
  borehole: 'Borehole',
  hand_dug: 'Hand-dug',
  spring: 'Spring',
  oasis: 'Oasis',
}

/** Human-readable labels for well operating status. */
export const WELL_STATUS_LABELS: Record<WellStatus, string> = {
  working: 'Working',
  broken: 'Broken',
}

/** Human-readable labels for the moderation review status. */
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  discarded: 'Discarded',
}

export const REVIEW_STATUSES: readonly ReviewStatus[] = [
  'pending',
  'approved',
  'discarded',
]

/** Badge tone for each review status. */
export const REVIEW_STATUS_VARIANT: Record<
  ReviewStatus,
  'muted' | 'success' | 'destructive'
> = {
  pending: 'muted',
  approved: 'success',
  discarded: 'destructive',
}
