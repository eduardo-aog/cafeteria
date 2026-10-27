import { Link } from 'react-router-dom'
import { Coffee, Gift, Star, Ticket } from 'lucide-react'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMe } from '@/hooks/useMe'
import { usePoints } from '@/hooks/useRewards'
import { formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

// Saldo, accesos a recompensas y cupones, e historial de movimientos (8.9, 10.3).
export default function PointsPage() {
  const { data: me } = useMe()
  const points = usePoints()
  const movements = points.data?.pages.flatMap((p) => p.movements) ?? []
  const balance = points.data?.pages[0]?.balance ?? me?.pointsBalance

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Puntos</h1>

      <Card>
        <CardContent className="flex items-center gap-3">
          <Star className="size-6 text-caramel" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="text-2xl font-semibold">{balance ?? '…'} puntos</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild>
          <Link to="/recompensas">
            <Gift strokeWidth={1.5} aria-hidden="true" />
            Recompensas
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/cupones">
            <Ticket strokeWidth={1.5} aria-hidden="true" />
            Mis cupones
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Movimientos</h2>
        {points.isPending && <LoadingBlock />}
        {points.isError && (
          <ErrorBlock message={points.error.message} onRetry={() => void points.refetch()} />
        )}
        {points.isSuccess && movements.length === 0 && (
          <EmptyBlock>Aún no tienes movimientos. Ganas puntos con cada pedido pagado.</EmptyBlock>
        )}
        {movements.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                {/* Ícono aislado en un círculo de color: caramelo para canjes, verde para compras. */}
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    m.type === 'EARN' ? 'bg-success/4 text-success' : 'bg-caramel/4 text-caramel',
                  )}
                >
                  {m.type === 'EARN' ? (
                    <Coffee className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Ticket className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {m.type === 'EARN'
                      ? 'Compra pagada'
                      : `Canje: ${m.couponTitle ?? 'recompensa'}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(m.createdAt)} · {formatTime(m.createdAt)}
                  </p>
                </div>
                <p
                  className={cn(
                    'shrink-0 font-semibold',
                    m.points > 0 ? 'text-success' : 'text-foreground',
                  )}
                >
                  {m.points > 0 ? '+' : '−'}
                  {Math.abs(m.points)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {points.hasNextPage && (
          <Button
            variant="secondary"
            disabled={points.isFetchingNextPage}
            onClick={() => void points.fetchNextPage()}
          >
            {points.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
          </Button>
        )}
      </section>
    </div>
  )
}
