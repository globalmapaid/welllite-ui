import type {
  ChangeType,
  LatLon,
  WellFieldChange,
  WellStatus,
  WellType,
} from './api/types'
import { WELL_STATUS_LABELS, WELL_TYPE_LABELS } from './wells'

/** Human-readable labels for the kinds of difference a survey can propose. */
export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  changed: 'Changed',
  cleared: 'Cleared',
  filled: 'Filled in',
}

/** One-line explanation of each change type, for the diff legend. */
export const CHANGE_TYPE_HINTS: Record<ChangeType, string> = {
  changed: 'The survey contradicts a value the record already had.',
  cleared: 'The survey says an existing value should be empty.',
  filled: 'The survey completed a blank field.',
}

/** Badge tone per change type: contradictions and removals carry the risk. */
export const CHANGE_TYPE_VARIANT: Record<
  ChangeType,
  'default' | 'destructive' | 'muted'
> = {
  changed: 'default',
  cleared: 'destructive',
  filled: 'muted',
}

// Review order: contradictions first (they need a judgement), then removals,
// then the routine fill-ins. Unknown future types sort last.
const CHANGE_TYPE_RANK: Record<string, number> = {
  changed: 0,
  cleared: 1,
  filled: 2,
}

/** Order a diff so the rows a reviewer must think about come first. */
export function sortChanges(changes: WellFieldChange[]): WellFieldChange[] {
  return [...changes].sort(
    (a, b) =>
      (CHANGE_TYPE_RANK[a.change_type] ?? 3) -
      (CHANGE_TYPE_RANK[b.change_type] ?? 3),
  )
}

/** Count each kind of difference in a diff (missing kinds come back as 0). */
export function countChangeTypes(
  changes: WellFieldChange[],
): Record<ChangeType, number> {
  const counts: Record<ChangeType, number> = {
    changed: 0,
    cleared: 0,
    filled: 0,
  }
  for (const c of changes) {
    if (c.change_type in counts) counts[c.change_type] += 1
  }
  return counts
}

/** Labels for the well fields a survey can propose values for. */
export const WELL_FIELD_LABELS: Record<string, string> = {
  location: 'Location',
  latitude: 'Latitude',
  longitude: 'Longitude',
  name: 'Name',
  well_type: 'Type',
  well_status: 'Operating status',
  well_confirmed: 'Confirmed on site',
  daily_users_estimate: 'Daily users (est.)',
  distance_to_other_water_km: 'Distance to other water',
  opening_diameter_cm: 'Opening diameter',
  owner_name: 'Owner',
  owner_mobile: 'Owner mobile',
  comments: 'Comments',
}

/** Label a diff row's field, falling back to a humanised key so a field the
 *  backend adds later still reads sensibly instead of disappearing. */
export function fieldLabel(field: string): string {
  return (
    WELL_FIELD_LABELS[field] ??
    field.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
  )
}

function isLatLon(value: unknown): value is LatLon {
  return (
    typeof value === 'object' &&
    value !== null &&
    'latitude' in value &&
    'longitude' in value
  )
}

/**
 * Render one side of a diff row. Returns `null` for an empty value so callers
 * can style "no value" differently from a real one.
 */
export function formatChangeValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  if (field === 'location' && isLatLon(value)) {
    return `${Number(value.latitude).toFixed(6)}, ${Number(value.longitude).toFixed(6)}`
  }
  if (field === 'well_type') {
    return WELL_TYPE_LABELS[value as WellType] ?? String(value)
  }
  if (field === 'well_status') {
    return WELL_STATUS_LABELS[value as WellStatus] ?? String(value)
  }
  if (field === 'well_confirmed') return value ? 'Yes' : 'No'
  if (field === 'distance_to_other_water_km') return `${value} km`
  if (field === 'opening_diameter_cm') return `${value} cm`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
