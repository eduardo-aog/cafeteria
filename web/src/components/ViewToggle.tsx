import { LayoutGrid, Square, type LucideIcon } from 'lucide-react'
import type { GridColumns } from '@/hooks/useGridColumns'
import { cn } from '@/lib/utils'

const OPTIONS: { value: GridColumns; label: string; icon: LucideIcon }[] = [
  { value: 1, label: 'Ver en una columna', icon: Square },
  { value: 2, label: 'Ver en dos columnas', icon: LayoutGrid },
]

// Cambia entre una y dos columnas en las vistas de catálogo.
export function ViewToggle({
  value,
  onChange,
}: {
  value: GridColumns
  onChange: (value: GridColumns) => void
}) {
  return (
    <div role="group" aria-label="Vista del catálogo" className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Vista</span>
      <div className="flex overflow-hidden rounded-lg border border-input">
        {OPTIONS.map(({ value: option, label, icon: Icon }) => (
          <button
            key={option}
            type="button"
            aria-label={label}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn(
              'flex size-11 items-center justify-center transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              value === option
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-accent',
            )}
          >
            <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
