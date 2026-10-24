import { Undo2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QueueCard } from '@/components/QueueCard'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { useDeliveredToday, useRestore } from '@/hooks/useBarista'

// Pedidos entregados hoy (Caracas): «Restaurar» los devuelve a la cola en su posición original (8.7).
export default function RestorePage() {
  const delivered = useDeliveredToday()
  const restore = useRestore()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Restaurar pedidos</h1>
      <p className="text-sm text-muted-foreground">
        Pedidos entregados hoy. Al restaurarlos vuelven a la cola de barra.
      </p>
      {delivered.isPending && <LoadingBlock />}
      {delivered.isError && (
        <ErrorBlock message={delivered.error.message} onRetry={() => void delivered.refetch()} />
      )}
      {delivered.data && delivered.data.orders.length === 0 && (
        <EmptyBlock>Hoy no se ha entregado ningún pedido.</EmptyBlock>
      )}
      {delivered.data?.orders.map((order) => (
        <QueueCard
          key={order.id}
          order={order}
          time={order.deliveredAt}
          timeLabel="Entregado a las"
        >
          <ConfirmDialog
            trigger={
              <Button variant="outline">
                <Undo2 strokeWidth={1.5} aria-hidden="true" />
                Restaurar
              </Button>
            }
            title="¿Restaurar este pedido?"
            description={`El pedido ${order.pickupCode} de ${order.customerName} volverá a la cola de barra.`}
            confirmLabel="Restaurar"
            onConfirm={() => restore.mutate(order.id)}
          />
        </QueueCard>
      ))}
    </div>
  )
}
