import { useIsMutating } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QuantityStepper } from '@/components/QuantityStepper'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge, type BadgeTone } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CHECKOUT_MUTATION_KEY,
  useCancelCheckout,
  useCheckouts,
  useRemoveItem,
  useUpdateItem,
} from '@/hooks/useCheckouts'
import { useNow } from '@/hooks/useNow'
import { formatBs, formatRemaining, formatTime, formatUsd } from '@/lib/format'
import {
  REJECT_REASON_LABELS,
  type Checkout,
  type CheckoutItem,
  type OrderStatus,
} from '@/lib/types'

const STATUS_BADGES: Partial<Record<OrderStatus, { tone: BadgeTone; label: string }>> = {
  CREATED: { tone: 'created', label: 'Creado' },
  IN_VERIFICATION: { tone: 'verifying', label: 'En verificación' },
  EXPIRED: { tone: 'expired', label: 'Expirado' },
}

export default function CheckoutPage() {
  const query = useCheckouts()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Checkout</h1>

      {query.isPending && <LoadingBlock />}
      {query.isError && (
        <ErrorBlock message={query.error.message} onRetry={() => void query.refetch()} />
      )}
      {query.data && query.data.checkouts.length === 0 && (
        <div className="flex flex-col items-center gap-4">
          <EmptyBlock>Tu checkout está vacío. Agrega productos desde el menú.</EmptyBlock>
          <Button asChild variant="secondary">
            <Link to="/menu">Ir al menú</Link>
          </Button>
        </div>
      )}
      {query.data?.checkouts.map((checkout) => (
        <CheckoutCard
          key={checkout.id}
          checkout={checkout}
          maxQuantity={query.data.maxQuantityPerProduct}
        />
      ))}
    </div>
  )
}

function CheckoutCard({ checkout, maxQuantity }: { checkout: Checkout; maxQuantity: number }) {
  const now = useNow()
  const cancel = useCancelCheckout()
  // Los montos los calcula el servidor: mientras hay un cambio en curso se atenúan hasta que llegue la respuesta.
  const updating = useIsMutating({ mutationKey: CHECKOUT_MUTATION_KEY }) > 0
  const badge = STATUS_BADGES[checkout.status]
  const editable = checkout.status === 'CREATED'
  const rejection = checkout.lastRejection
  const blocked = checkout.blockedUntil && new Date(checkout.blockedUntil) > now

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {badge && <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>}
          {editable && rejection?.reason && (
            <StatusBadge tone="rejected">
              Rechazado: {REJECT_REASON_LABELS[rejection.reason].toLowerCase()}
            </StatusBadge>
          )}
        </div>

        {editable && rejection && (
          <p className="text-sm text-muted-foreground">
            Motivo del último rechazo: {rejection.reason && REJECT_REASON_LABELS[rejection.reason]}
            {rejection.note && ` — ${rejection.note}`}. Corrige y vuelve a enviar la referencia.
          </p>
        )}
        {editable && blocked && checkout.blockedUntil && (
          <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
            Podrás reenviar la referencia a las {formatTime(checkout.blockedUntil)}
          </p>
        )}

        <ul className="flex flex-col divide-y divide-border">
          {checkout.items.map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <CheckoutLine
                item={item}
                updating={updating}
                maxQuantity={maxQuantity}
                editable={editable}
                isLast={checkout.items.length === 1}
              />
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
          <span className="font-medium">Total</span>
          <div
            className={`flex flex-col items-end transition-opacity duration-150 ${updating ? 'opacity-50' : ''}`}
          >
            <span className="text-lg font-semibold text-caramel">
              {formatUsd(checkout.totalCents)}
            </span>
            {checkout.totalBsCents !== null && (
              <span className="text-sm text-muted-foreground">
                {formatBs(checkout.totalBsCents)}
              </span>
            )}
          </div>
        </div>

        {editable && checkout.expiresAt && (
          <p className="text-sm text-muted-foreground">
            Expira en {formatRemaining(checkout.expiresAt, now)}. Cada producto que agregas reinicia
            el plazo.
          </p>
        )}
        {checkout.status === 'EXPIRED' && (
          <p className="text-sm text-muted-foreground">
            Este checkout expiró y ya no se puede modificar. Puedes armar uno nuevo desde el menú.
          </p>
        )}
        {checkout.status === 'IN_VERIFICATION' && (
          <p className="text-sm text-muted-foreground">
            Tu pago está en verificación. Un cajero lo revisará en breve.
          </p>
        )}

        {editable && (
          <ConfirmDialog
            trigger={
              <Button variant="destructive" disabled={cancel.isPending}>
                Cancelar checkout
              </Button>
            }
            title="¿Cancelar este checkout?"
            description="Se vaciará por completo y no podrás recuperarlo. Puedes armar uno nuevo desde el menú."
            confirmLabel="Cancelar checkout"
            destructive
            onConfirm={() =>
              cancel.mutate(checkout.id, { onSuccess: () => toast.success('Checkout cancelado.') })
            }
          />
        )}
      </CardContent>
    </Card>
  )
}

function CheckoutLine({
  item,
  maxQuantity,
  editable,
  isLast,
  updating,
}: {
  item: CheckoutItem
  maxQuantity: number
  editable: boolean
  isLast: boolean
  updating: boolean
}) {
  const update = useUpdateItem()
  const remove = useRemoveItem()
  const unavailable = !item.isActive
    ? 'Ya no está disponible'
    : !item.isAvailable
      ? 'Agotado'
      : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">{formatUsd(item.unitPriceCents)} c/u</p>
          {unavailable && editable && <p className="text-sm text-warning">{unavailable}</p>}
        </div>
        <div
          className={`flex shrink-0 flex-col items-end transition-opacity duration-150 ${updating ? 'opacity-50' : ''}`}
        >
          <span className="font-semibold text-caramel">{formatUsd(item.lineTotalCents)}</span>
          {item.lineTotalBsCents !== null && (
            <span className="text-sm text-muted-foreground">{formatBs(item.lineTotalBsCents)}</span>
          )}
        </div>
      </div>

      {editable ? (
        <div className="flex items-center justify-between gap-3">
          <QuantityStepper
            value={item.quantity}
            max={maxQuantity}
            onChange={(quantity) => update.mutate({ itemId: item.id, quantity })}
          />
          {isLast ? (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label={`Quitar ${item.name}`}>
                  <Trash2 strokeWidth={1.5} aria-hidden="true" />
                </Button>
              }
              title="¿Quitar el último producto?"
              description="Al quitarlo se cancela el checkout, porque ya no quedaría nada en él."
              confirmLabel="Quitar y cancelar"
              destructive
              onConfirm={() =>
                remove.mutate(item.id, { onSuccess: () => toast.success('Checkout cancelado.') })
              }
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Quitar ${item.name}`}
              onClick={() => remove.mutate(item.id)}
            >
              <Trash2 strokeWidth={1.5} aria-hidden="true" />
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
      )}
    </div>
  )
}
