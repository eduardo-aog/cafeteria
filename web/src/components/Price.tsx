import { formatBs, formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'

// Siempre ambos montos ($ y Bs) cuando hay tasa (6.1).
export function Price({
  priceCents,
  priceBsCents,
  className,
}: {
  priceCents: number
  priceBsCents: number | null
  className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className="font-semibold text-caramel">{formatUsd(priceCents)}</span>
      {priceBsCents !== null && (
        <span className="text-sm text-muted-foreground">{formatBs(priceBsCents)}</span>
      )}
    </div>
  )
}
