import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import type { ReviewStatus, WellStatus, WellType } from '@/lib/api/types'
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUSES,
  WELL_STATUS_LABELS,
  WELL_STATUSES,
  WELL_TYPE_LABELS,
  WELL_TYPES,
} from '@/lib/wells'
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  type WellFilterState,
} from './wellFilters'

/**
 * Filters shared by the List and Map views. Both endpoints accept the same
 * four, so switching view keeps the same wells in scope.
 */
export function WellsFilters({
  value,
  onChange,
}: {
  value: WellFilterState
  onChange: (next: WellFilterState) => void
}) {
  const set = <K extends keyof WellFilterState>(
    key: K,
    v: WellFilterState[K],
  ) => onChange({ ...value, [key]: v })

  const active = hasActiveFilters(value)

  return (
    <div className="mb-3 flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1 space-y-1.5">
        <Label htmlFor="well-search" className="text-muted-foreground">
          Search by name
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="well-search"
            type="search"
            value={value.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="e.g. Dessie"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type-filter" className="text-muted-foreground">
          Type
        </Label>
        <NativeSelect
          id="type-filter"
          className="w-auto"
          value={value.wellType}
          onChange={(e) => set('wellType', e.target.value as WellType | '')}
        >
          <option value="">Any</option>
          {WELL_TYPES.map((t) => (
            <option key={t} value={t}>
              {WELL_TYPE_LABELS[t]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status-filter" className="text-muted-foreground">
          Status
        </Label>
        <NativeSelect
          id="status-filter"
          className="w-auto"
          value={value.wellStatus}
          onChange={(e) => set('wellStatus', e.target.value as WellStatus | '')}
        >
          <option value="">Any</option>
          {WELL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {WELL_STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-filter" className="text-muted-foreground">
          Review status
        </Label>
        <NativeSelect
          id="review-filter"
          className="w-auto"
          value={value.reviewStatus}
          onChange={(e) =>
            set('reviewStatus', e.target.value as ReviewStatus | '')
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

      {active && (
        <Button
          variant="ghost"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-muted-foreground"
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
