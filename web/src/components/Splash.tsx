import { LoaderCircle } from 'lucide-react'

export function Splash() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <LoaderCircle className="size-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
