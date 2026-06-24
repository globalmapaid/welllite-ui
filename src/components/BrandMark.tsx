import { Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'

/** WellLite wordmark + droplet glyph. */
export function BrandMark({
  className,
  subtitle = 'Console',
}: {
  className?: string
  subtitle?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Droplets className="size-5" />
      </div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight">WellLite</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </div>
  )
}
