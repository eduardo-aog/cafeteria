import { Link } from 'react-router-dom'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useInventory } from '@/hooks/useOrders'
import { formatBs, formatDate, formatTime, formatUsd } from '@/lib/format'

// Inventario: pedidos pagados listos para retirar. El detalle con QR y código llega en la Fase 7.
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
        <Card key={order.id}>
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
