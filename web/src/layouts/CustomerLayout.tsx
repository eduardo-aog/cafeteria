import { NavLink, Outlet } from 'react-router-dom'
import { Coffee, Receipt, ShoppingBag, Star, User, type LucideIcon } from 'lucide-react'
import { APP_NAME } from '@/config'
import { cn } from '@/lib/utils'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/menu', label: 'Menú', icon: Coffee },
  { to: '/checkout', label: 'Checkout', icon: ShoppingBag },
  { to: '/pedidos', label: 'Pedidos', icon: Receipt },
  { to: '/puntos', label: 'Puntos', icon: Star },
  { to: '/cuenta', label: 'Cuenta', icon: User },
]

export default function CustomerLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-120 flex-col">
      <header className="px-4 pt-4">
        <p className="font-heading text-xl font-semibold">{APP_NAME}</p>
      </header>
      <main className="flex-1 px-4 pt-6 pb-28">
        <Outlet />
      </main>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 border-t border-border bg-card"
      >
        <ul className="mx-auto flex max-w-120">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150',
                    isActive ? 'text-primary' : 'text-muted-foreground',
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
