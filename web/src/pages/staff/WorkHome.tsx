import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { STAFF_SECTIONS } from '@/pages/staff/sections'

export default function WorkHome() {
  const { hasAny } = usePermissions()
  const { signOut } = useAuth()
  const sections = STAFF_SECTIONS.filter((s) => hasAny(s.perms))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Panel de trabajo</h1>
      <ul className="flex flex-col gap-3">
        {sections.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <Link to={`/trabajo/${path}`} className="block rounded-lg">
              <Card className="transition-colors duration-150 hover:bg-accent">
                <CardContent className="flex min-h-11 items-center gap-3">
                  <Icon className="size-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                  <span className="font-medium">{label}</span>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={() => void signOut()}>
        Cerrar sesión
      </Button>
    </div>
  )
}
