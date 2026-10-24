import { Check } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QueueCard } from '@/components/QueueCard'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { useBaristaQueue, useDeliver } from '@/hooks/useBarista'
import { usePermissions } from '@/hooks/usePermissions'

// Cola de preparación (8.7): por orden de llegada, se refresca sola cada 5 s.
// «Entregado» solo aparece con permiso de barista; gerente y administrador la ven en solo lectura.
export default function BaristaPage() {
  const queue = useBaristaQueue()
  const deliver = useDeliver()
  const { has } = usePermissions()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Cola de barra</h1>
      {queue.isPending && <LoadingBlock />}
      {queue.isError && (
        <ErrorBlock message={queue.error.message} onRetry={() => void queue.refetch()} />
      )}
      {queue.data && queue.data.orders.length === 0 && (
        <EmptyBlock>No hay pedidos en la cola.</EmptyBlock>
      )}
      {queue.data?.orders.map((order) => (
        <QueueCard key={order.id} order={order} time={order.scannedAt} timeLabel="Llegó a las">
          {has('barista') && (
            <ConfirmDialog
              trigger={
                <Button>
                  <Check strokeWidth={1.5} aria-hidden="true" />
                  Entregado
                </Button>
              }
              title="¿Marcar como entregado?"
              description={`El pedido ${order.pickupCode} de ${order.customerName} saldrá de la cola.`}
              confirmLabel="Entregado"
              onConfirm={() => deliver.mutate(order.id)}
            />
          )}
        </QueueCard>
      ))}
    </div>
  )
}
