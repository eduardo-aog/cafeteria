import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

// Filtro de una sola opción activa, con botones grandes para el teléfono.
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex overflow-hidden rounded-lg border border-input"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-11 flex-1 px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              selected
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-accent',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
