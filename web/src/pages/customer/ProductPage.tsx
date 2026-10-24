import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, LoaderCircle } from 'lucide-react'
import { Price } from '@/components/Price'
import { ProductImage } from '@/components/ProductImage'
import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { QuantityStepper } from '@/components/QuantityStepper'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { useAddToCheckout } from '@/hooks/useCheckouts'
import { useMenu, useProduct } from '@/hooks/useMenu'
import { useProductCoupons } from '@/hooks/useRewards'
import { describeOpening, formatDate } from '@/lib/format'
import { describeCoupon, describeDaysLeft } from '@/lib/rewards'
import { ApiError } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/types'

export default function ProductPage() {
  const { id } = useParams()
  const query = useProduct(id)
  const menu = useMenu()
  const coupons = useProductCoupons(id)
  const { add, isPending } = useAddToCheckout()
  const [quantity, setQuantity] = useState(1)
  const store = menu.data?.store
  const maxQuantity = menu.data?.limits.maxQuantityPerProduct ?? 10

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/menu"
        className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-primary"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
        Volver al menú
      </Link>

      {query.isPending && <LoadingBlock />}
      {query.isError &&
        (query.error instanceof ApiError && query.error.status === 404 ? (
          <p className="py-12 text-center text-muted-foreground">
            Este producto ya no está disponible.
          </p>
        ) : (
          <ErrorBlock message={query.error.message} onRetry={() => void query.refetch()} />
        ))}

      {query.data && (
        <article className="flex flex-col gap-4">
          <ProductImage
            imageUrl={query.data.product.imageUrl}
            category={query.data.product.category}
            name={query.data.product.name}
            dimmed={!query.data.product.isAvailable}
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {CATEGORY_LABELS[query.data.product.category]}
            </p>
            <h1 className="text-2xl font-semibold">{query.data.product.name}</h1>
            {!query.data.product.isAvailable && (
              <StatusBadge tone="created" className="self-start">
                Agotado
              </StatusBadge>
            )}
            <p className="text-muted-foreground">{query.data.product.description}</p>
            <Price
              priceCents={query.data.product.priceCents}
              priceBsCents={query.data.product.priceBsCents}
              className="pt-1"
            />
          </div>

          {store && !store.isOpen && (
            <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              <Clock className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <p>
                Cerrado
                {store.nextOpening && ` · Abrimos ${describeOpening(store.nextOpening)}`}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} />
            <Button
              className="flex-1"
              disabled={!query.data.product.isAvailable || !store?.isOpen || isPending}
              onClick={() => add(query.data.product, quantity)}
            >
              {isPending && (
                <LoaderCircle className="animate-spin" strokeWidth={1.5} aria-hidden="true" />
              )}
              {isPending ? 'Agregando…' : 'Agregar al checkout'}
            </Button>
          </div>

          {coupons.data && coupons.data.coupons.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg">Tus cupones para este producto</h2>
              <ul className="flex flex-col gap-3">
                {coupons.data.coupons.map((coupon) => (
                  <li
                    key={coupon.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                  >
                    <div>
                      <p className="font-semibold">{coupon.title}</p>
                      <p className="text-sm text-muted-foreground">{describeCoupon(coupon)}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence el {formatDate(coupon.expiresAt)} ·{' '}
                        {describeDaysLeft(coupon.daysLeft)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      disabled={!query.data.product.isAvailable || !store?.isOpen || isPending}
                      onClick={() => add(query.data.product, 1, coupon.id)}
                    >
                      Agregar con cupón
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}
    </div>
  )
}
