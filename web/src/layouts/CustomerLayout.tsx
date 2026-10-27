import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Coffee, Receipt, ShoppingBag, Star, User, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { APP_NAME } from '@/config'
import { cn } from '@/lib/utils'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/menu', label: 'Menú', icon: Coffee },
  { to: '/checkout', label: 'Checkout', icon: ShoppingBag },
  { to: '/pedidos', label: 'Pedidos', icon: Receipt },
  { to: '/puntos', label: 'Puntos', icon: Star },
  { to: '/cuenta', label: 'Cuenta', icon: User },
]

// La pantalla es una columna de la altura visible real (`dvh`, que sigue a las barras del navegador del teléfono):
// encabezado, contenido que se desplaza por dentro y barra inferior como último elemento. Así la barra queda
// siempre pegada al borde inferior, sin depender de `position: fixed` (que en móviles puede quedar tapada
// hasta que se desliza la página o dejar un hueco debajo).
export default function CustomerLayout() {
  const { pathname } = useLocation()
  const scroller = useRef<HTMLElement>(null)

  // El contenido tiene su propio scroll: al cambiar de pantalla se vuelve arriba, como haría el navegador.
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-120 shrink-0 items-center gap-1 px-4 pt-4">
        <p className="font-heading text-xl font-semibold">{APP_NAME}</p>
        <Logo className="size-7 -translate-y-[3px]" />
      </header>
      <main ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-120 px-4 pt-6 pb-6">
          <Outlet />
        </div>
      </main>
      <nav
        aria-label="Navegación principal"
        // El borde superior distingue la barra de los botones verdes.
        className="shrink-0 border-t-2 border-primary-foreground/35 bg-primary text-primary-foreground"
      >
        <ul className="mx-auto flex max-w-120">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1 p-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    // El activo va en crema pleno, en negrita y sobre un fondo suave: no depende solo del color.
                    'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs transition-colors duration-150',
                    isActive
                      ? 'bg-primary-foreground/15 font-semibold text-primary-foreground'
                      : 'font-medium text-primary-foreground/70',
                  )
                }
              >
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
