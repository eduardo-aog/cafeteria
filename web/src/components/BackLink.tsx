import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Botón «Atrás» de todas las subpantallas: lleva a la pantalla de la que se viene (no depende del historial del navegador).
export function BackLink({ to, label = 'Atrás' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-1 self-start rounded-lg text-sm font-medium text-primary"
    >
      <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
      {label}
    </Link>
  )
}
