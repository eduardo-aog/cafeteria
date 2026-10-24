import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuantityStepperProps {
  value: number
  min?: number
  max: number
  disabled?: boolean
  onChange: (value: number) => void
}

export function QuantityStepper({ value, min = 1, max, disabled, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Cantidad">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Disminuir cantidad"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus strokeWidth={1.5} aria-hidden="true" />
      </Button>
      <span className="min-w-8 text-center font-semibold" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Aumentar cantidad"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus strokeWidth={1.5} aria-hidden="true" />
      </Button>
    </div>
  )
}
