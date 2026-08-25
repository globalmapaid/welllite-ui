import type { ReviewStatus, WellStatus, WellType } from '@/lib/api/types'

/**
 * The filter bar's own state — every field a string so the selects can carry
 * '' for "any". Kept out of the component file so fast refresh stays clean.
 */
export interface WellFilterState {
  q: string
  reviewStatus: ReviewStatus | ''
  wellType: WellType | ''
  wellStatus: WellStatus | ''
}

export const EMPTY_FILTERS: WellFilterState = {
  q: '',
  reviewStatus: '',
  wellType: '',
  wellStatus: '',
}

/** True when anything is narrowing the results — drives the Clear button and
 *  tells an empty table apart from a tenant with no wells at all. */
export function hasActiveFilters(f: WellFilterState): boolean {
  return !!(f.q.trim() || f.reviewStatus || f.wellType || f.wellStatus)
}
