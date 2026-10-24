import { Link } from 'react-router-dom'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useInventory } from '@/hooks/useOrders'
import { formatBs, formatDate, formatTime, formatUsd } from '@/lib/format'

// Inventario: pedidos pagados listos para retirar. Cada tarjeta abre el detalle con el QR y el código.
export default function OrdersPage() {
  const inventory = useInventory()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Pedidos</h1>
      {inventory.isPending && <LoadingBlock />}
      {inventory.isError && (
        <ErrorBlock message={inventory.error.message} onRetry={() => void inventory.refetch()} />
      )}
      {inventory.data && inventory.data.orders.length === 0 && (
        <div className="flex flex-col items-center gap-4">
          <EmptyBlock>Aún no tienes pedidos pagados.</EmptyBlock>
          <Button asChild variant="secondary">
            <Link to="/menu">Ir al menú</Link>
          </Button>
        </div>
      )}
      {inventory.data?.orders.map((order) => (
        <Link key={order.id} to={`/pedidos/${order.id}`} className="block rounded-lg">
          <Card className="transition-colors duration-150 hover:bg-accent">
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge tone="paid">Pagado · Listo para retirar</StatusBadge>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.paidAt)} · {formatTime(order.paidAt)}
                </p>
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.name}
                    {item.couponTitle && (
                      <span className="text-muted-foreground"> · Cupón: {item.couponTitle}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                <span className="font-medium">Total pagado</span>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-semibold text-caramel">
                    {formatUsd(order.totalCents)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatBs(order.amountBsCents)}
                  </span>
                </div>
              </div>
              {order.pointsEarned !== null && order.pointsEarned > 0 && (
                <p className="text-sm text-success">+{order.pointsEarned} puntos</p>
              )}
              <p className="text-sm font-medium text-primary">Toca para ver tu QR</p>
            </CardContent>
          </Card>
        </Link>
      ))}
      <Button asChild variant="secondary">
        <Link to="/historial">Ver historial</Link>
      </Button>
    </div>
  )
}
