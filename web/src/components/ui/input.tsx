import * as React from 'react'
import { cn } from '@/lib/utils'

// 16 px de texto (evita el zoom de Safari en iPhone) y 44 px de alto mínimo (10.1).
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base transition-[color,border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
