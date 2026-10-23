import { cn } from '@/lib/utils'

const STYLES = {
  created: 'bg-secondary text-secondary-foreground',
  verifying: 'bg-warning/12 text-warning',
  paid: 'bg-success/12 text-success',
  expired: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive',
} as const

export type BadgeTone = keyof typeof STYLES

// Píldora con texto: el estado nunca se comunica solo con color.
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
