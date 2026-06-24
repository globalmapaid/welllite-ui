import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm flex gap-3 items-start',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border-border',
        destructive:
          'border-destructive/40 text-destructive bg-destructive/5 [&_svg]:text-destructive',
        info: 'border-primary/30 text-foreground bg-primary/5 [&_svg]:text-primary',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: ComponentProps<'h5'>) {
  return (
    <h5 className={cn('mb-0.5 font-medium leading-none', className)} {...props} />
  )
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
  )
}
