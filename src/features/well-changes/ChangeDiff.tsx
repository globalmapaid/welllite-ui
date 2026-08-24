import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ChangeType, WellFieldChange } from '@/lib/api/types'
import {
  CHANGE_TYPE_HINTS,
  CHANGE_TYPE_LABELS,
  CHANGE_TYPE_VARIANT,
  fieldLabel,
  formatChangeValue,
  sortChanges,
} from '@/lib/wellChanges'
import { cn } from '@/lib/utils'

function Value({ field, value }: { field: string; value: unknown }) {
  const text = formatChangeValue(field, value)
  if (text === null) {
    return <span className="text-muted-foreground italic">Empty</span>
  }
  return (
    <span className={cn(field === 'location' && 'font-mono text-xs')}>
      {text}
    </span>
  )
}

/**
 * The field-by-field difference between a well and a submitted survey, ordered
 * so the rows that need a judgement (`changed`, then `cleared`) come before the
 * routine fill-ins.
 */
export function ChangeDiff({ changes }: { changes: WellFieldChange[] }) {
  const rows = sortChanges(changes)
  const kinds = [...new Set(rows.map((r) => r.change_type))].filter(
    (k): k is ChangeType => k in CHANGE_TYPE_LABELS,
  )

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Currently</TableHead>
            <TableHead>Proposed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.field}>
              <TableCell className="align-top">
                <div className="font-medium">{fieldLabel(c.field)}</div>
                <Badge
                  variant={CHANGE_TYPE_VARIANT[c.change_type] ?? 'muted'}
                  className="mt-1"
                >
                  {CHANGE_TYPE_LABELS[c.change_type] ?? c.change_type}
                </Badge>
              </TableCell>
              <TableCell className="align-top text-muted-foreground">
                <Value field={c.field} value={c.current_value} />
              </TableCell>
              <TableCell className="align-top">
                <div className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <Value field={c.field} value={c.proposed_value} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {kinds.length > 0 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 px-4 pb-1 text-xs text-muted-foreground">
          {kinds.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <dt>
                <Badge variant={CHANGE_TYPE_VARIANT[k]}>
                  {CHANGE_TYPE_LABELS[k]}
                </Badge>
              </dt>
              <dd>{CHANGE_TYPE_HINTS[k]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
