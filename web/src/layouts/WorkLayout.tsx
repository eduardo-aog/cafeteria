import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { APP_NAME } from '@/config'
import { useMe } from '@/hooks/useMe'

export default function WorkLayout() {
  const { data: me } = useMe()
  const { pathname } = useLocation()
  const inHome = pathname === '/trabajo'

  return (
    <div className="mx-auto flex min-h-svh max-w-120 flex-col gap-6 px-4 py-4">
      <header className="flex items-center justify-between gap-4">
        <p className="font-heading text-xl font-semibold">{APP_NAME}</p>
        {inHome ? (
          <p className="truncate text-sm text-muted-foreground">{me?.name}</p>
        ) : (
          <Link
            to="/trabajo"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
          >
            <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
            Inicio
          </Link>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
