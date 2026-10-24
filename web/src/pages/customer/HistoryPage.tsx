import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useHistory } from '@/hooks/useHistory'
import { formatBs, formatDate, formatTime, formatUsd } from '@/lib/format'

// Historial (8.7): pedidos que ya pasaron por el mostrador, de 20 en 20. Sin QR ni código.
export default function HistoryPage() {
  const history = useHistory()
  const orders = history.data?.pages.flatMap((p) => p.orders) ?? []

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/pedidos"
        className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-primary"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
        Volver a pedidos
      </Link>
      <h1 className="text-2xl">Historial</h1>

      {history.isPending && <LoadingBlock />}
      {history.isError && (
        <ErrorBlock message={history.error.message} onRetry={() => void history.refetch()} />
      )}
      {history.isSuccess && orders.length === 0 && (
        <EmptyBlock>Todavía no tienes pedidos retirados.</EmptyBlock>
      )}

      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="flex flex-col gap-3">
            {order.scannedAt && (
              <p className="text-sm text-muted-foreground">
                {formatDate(order.scannedAt)} · {formatTime(order.scannedAt)}
              </p>
            )}
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
            {order.totalCents !== null && (
              <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                <span className="font-medium">Total pagado</span>
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-caramel">{formatUsd(order.totalCents)}</span>
                  {order.amountBsCents !== null && (
                    <span className="text-sm text-muted-foreground">
                      {formatBs(order.amountBsCents)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {history.hasNextPage && (
        <Button
          variant="secondary"
          disabled={history.isFetchingNextPage}
          onClick={() => void history.fetchNextPage()}
        >
          {history.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
        </Button>
      )}
    </div>
  )
}
