import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { BackLink } from '@/components/BackLink'
import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { useInventory } from '@/hooks/useOrders'
import { api } from '@/lib/api'
import { formatBs, formatUsd } from '@/lib/format'
import type { HistoryOrder } from '@/lib/types'

// Detalle del pedido pagado (8.7): QR grande, código corto, ítems y total pagado. Se refresca cada 10 s;
// al detectar que lo escaneó el cajero muestra «Pedido enviado a barra» y pasa al historial.
export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const inventory = useInventory()
  const order = inventory.data?.orders.find((o) => o.id === id)

  // Si ya no está en el inventario, se mira en el historial si fue por el escaneo.
  const missing = inventory.isSuccess && !order
  const sentCheck = useQuery({
    queryKey: ['order-sent', id],
    queryFn: async () => {
      const { orders } = await api<{ orders: HistoryOrder[] }>('/orders/history')
      return orders.some((o) => o.id === id)
    },
    enabled: missing,
  })
  const sentToBar = missing && sentCheck.data === true

  useEffect(() => {
    if (!sentToBar) return
    const timer = setTimeout(() => navigate('/historial', { replace: true }), 2500)
    return () => clearTimeout(timer)
  }, [sentToBar, navigate])

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/pedidos" />

      {inventory.isPending && <LoadingBlock />}
      {inventory.isError && (
        <ErrorBlock message={inventory.error.message} onRetry={() => void inventory.refetch()} />
      )}
      {missing && sentCheck.isPending && <LoadingBlock />}

      {sentToBar && (
        <div className="flex flex-col items-center gap-3 py-12 text-center" role="status">
          <CircleCheck className="size-10 text-success" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="text-2xl">Pedido enviado a barra</h1>
          <p className="text-muted-foreground">Te llevamos a tu historial…</p>
        </div>
      )}
      {missing && sentCheck.isSuccess && !sentCheck.data && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Este pedido ya no está en tu inventario.</p>
          <Button asChild variant="secondary">
            <Link to="/historial">Ver historial</Link>
          </Button>
        </div>
      )}

      {order && (
        <article className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <StatusBadge tone="paid">Pagado · Listo para retirar</StatusBadge>
            {/* El QR siempre va negro sobre blanco puro, con margen y en una tarjeta blanca: los escáneres necesitan el máximo contraste (10.6). */}
            <div className="rounded-lg border border-border bg-white p-4">
              <QRCodeSVG
                value={order.qrToken ?? ''}
                size={256}
                level="M"
                marginSize={2}
                bgColor="#FFFFFF"
                fgColor="#000000"
                style={{ width: 'min(100%, 16rem)', height: 'auto' }}
                aria-label="Código QR de tu pedido"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Sube el brillo de la pantalla para que se lea mejor.
            </p>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Código de respaldo</p>
              <p className="font-sans text-[28px] font-semibold tracking-[0.25em]">
                {order.pickupCode}
              </p>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg">Tu pedido</h2>
            <ul className="flex flex-col gap-1">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.quantity} × {item.name}
                    {item.couponTitle && (
                      <span className="text-sm text-muted-foreground">
                        {' '}
                        · Cupón: {item.couponTitle}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{formatUsd(item.lineTotalCents)}</span>
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
          </section>
        </article>
      )}
    </div>
  )
}
