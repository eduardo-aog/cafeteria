import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Price } from '@/components/Price'
import { ProductImage } from '@/components/ProductImage'
import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { useProduct } from '@/hooks/useMenu'
import { ApiError } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/types'

export default function ProductPage() {
  const { id } = useParams()
  const query = useProduct(id)

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
        </article>
      )}
    </div>
  )
}
