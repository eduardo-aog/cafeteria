import * as React from 'react'
import { cn } from '@/lib/utils'

// Select nativo: en el teléfono abre el selector del sistema, que es lo más cómodo.
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base transition-[color,border-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { NativeSelect }
