import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Estados de carga, error y vacío de las listas (10.1).
export function LoadingBlock() {
  return (
    <div
      className="flex items-center justify-center gap-2 py-12 text-muted-foreground"
      role="status"
    >
      <LoaderCircle className="size-5 animate-spin" strokeWidth={1.5} aria-hidden="true" />
      Cargando…
    </div>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center" role="alert">
      <p className="text-muted-foreground">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

export function EmptyBlock({ children }: { children: string }) {
  return <p className="py-12 text-center text-muted-foreground">{children}</p>
}
