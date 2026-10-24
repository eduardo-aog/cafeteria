import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Dialog } from 'radix-ui'
import { House, LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/config'
import { useAuth } from '@/hooks/useAuth'
import { useMe } from '@/hooks/useMe'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'
import { STAFF_SECTIONS } from '@/pages/staff/sections'

export default function WorkLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-120 flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-2 bg-background px-4 py-2">
        <WorkMenu />
        <Link to="/trabajo" className="font-heading text-xl font-semibold">
          {APP_NAME}
        </Link>
      </header>
      <main className="flex-1 px-4 pt-4 pb-8">
        <Outlet />
      </main>
    </div>
  )
}

// Menú hamburguesa: panel desplegable a la izquierda con las secciones según los permisos.
function WorkMenu() {
  const [open, setOpen] = useState(false)
  const { data: me } = useMe()
  const { hasAny } = usePermissions()
  const { signOut } = useAuth()
  const sections = STAFF_SECTIONS.filter((section) => hasAny(section.perms))

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="icon" aria-label="Abrir menú de trabajo">
          <Menu strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 bg-primary-light p-4 text-primary-foreground outline-none"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Dialog.Title className="font-heading text-lg font-medium">
                Panel de trabajo
              </Dialog.Title>
              <p className="truncate text-sm text-primary-foreground/85">{me?.name}</p>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerrar menú"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <nav aria-label="Secciones de trabajo" className="-mx-2 flex-1 overflow-y-auto">
            <ul className="flex flex-col gap-1">
              <MenuLink
                to="/trabajo"
                label="Inicio"
                icon={House}
                end
                onNavigate={() => setOpen(false)}
              />
              {sections.map(({ path, label, icon }) => (
                <MenuLink
                  key={path}
                  to={`/trabajo/${path}`}
                  label={label}
                  icon={icon}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
          </nav>

          <Button
            variant="destructive"
            className="border-primary-foreground/65"
            onClick={() => void signOut()}
          >
            <LogOut strokeWidth={1.5} aria-hidden="true" />
            Cerrar sesión
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function MenuLink({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
}: {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  onNavigate: () => void
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-primary-foreground/10 font-semibold text-primary-foreground'
              : 'text-primary-foreground hover:bg-primary-foreground/10',
          )
        }
      >
        <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
        {label}
      </NavLink>
    </li>
  )
}
