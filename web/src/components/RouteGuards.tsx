import { Navigate, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Splash } from '@/components/Splash'
import { useAuth } from '@/hooks/useAuth'
import { useMe } from '@/hooks/useMe'
import { usePermissions } from '@/hooks/usePermissions'
import type { Perm } from '@/lib/types'

export const homePath = (isStaff: boolean) => (isStaff ? '/trabajo' : '/menu')

// /login y /registro: con sesión activa se redirige a "/", que elige el inicio según la cuenta.
export function GuestOnly() {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}

// "/": lleva al menú o al panel de trabajo según el tipo de cuenta.
export function HomeRedirect() {
  const { session, loading } = useAuth()
  const me = useMe()
  if (loading || (session && me.isPending)) return <Splash />
  if (!session) return <Navigate to="/login" replace />
  if (!me.data) return <MeError />
  return <Navigate to={homePath(me.data.isStaff)} replace />
}

// Exige sesión y que el tipo de cuenta coincida: el cliente no entra a /trabajo ni al revés.
export function ProtectedRoute({ account }: { account: 'customer' | 'staff' }) {
  const { session, loading } = useAuth()
  const me = useMe()
  if (loading || (session && me.isPending)) return <Splash />
  if (!session) return <Navigate to="/login" replace />
  if (!me.data) return <MeError />
  if (me.data.isStaff !== (account === 'staff')) {
    return <Navigate to={homePath(me.data.isStaff)} replace />
  }
  return <Outlet />
}

// Dentro de /trabajo: una sección solo se abre con alguno de sus permisos.
export function RequirePerm({ perms }: { perms: Perm[] }) {
  const { hasAny } = usePermissions()
  if (!hasAny(perms)) return <Navigate to="/trabajo" replace />
  return <Outlet />
}

function MeError() {
  const { signOut } = useAuth()
  const me = useMe()
  return (
    <div className="mx-auto flex min-h-svh max-w-120 flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl">No pudimos cargar tu cuenta</h1>
      <p className="text-muted-foreground">{me.error?.message ?? 'Ocurrió un error inesperado.'}</p>
      <Button onClick={() => void me.refetch()}>Reintentar</Button>
      <Button variant="destructive" onClick={() => void signOut()}>
        Cerrar sesión
      </Button>
    </div>
  )
}
