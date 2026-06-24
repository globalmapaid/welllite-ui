import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ComingSoonProps {
  title: string
  description: string
  icon?: LucideIcon
  endpoints?: string[]
}

/**
 * Placeholder for features whose backend endpoints are documented but not yet
 * implemented (wells, readings, sync). Swap the body for real data once the API
 * ships those routes.
 */
export function ComingSoon({
  title,
  description,
  icon: Icon = Construction,
  endpoints,
}: ComingSoonProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {endpoints && endpoints.length > 0 && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className="font-medium uppercase tracking-wide">Pending API</p>
            {endpoints.map((e) => (
              <code
                key={e}
                className="block rounded bg-muted px-2 py-1 font-mono"
              >
                {e}
              </code>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
