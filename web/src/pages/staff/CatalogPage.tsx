import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Price } from '@/components/Price'
import { ProductImage } from '@/components/ProductImage'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { productRequests, useManagerProducts, useProductMutation } from '@/hooks/useManagerProducts'
import { CATEGORY_LABELS, type Category, type Product } from '@/lib/types'

const CATEGORIES: Category[] = ['CAFE', 'BEBIDAS', 'POSTRES']

export default function CatalogPage() {
  const query = useManagerProducts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">Catálogo</h1>
        <Button asChild>
          <Link to="/trabajo/catalogo/nuevo">
            <Plus strokeWidth={1.5} aria-hidden="true" />
            Nuevo
          </Link>
        </Button>
      </div>

      {query.isPending && <LoadingBlock />}
      {query.isError && (
        <ErrorBlock message={query.error.message} onRetry={() => void query.refetch()} />
      )}
      {query.data && query.data.products.length === 0 && (
        <EmptyBlock>Todavía no hay productos. Crea el primero con «Nuevo».</EmptyBlock>
      )}

      {query.data &&
        CATEGORIES.map((category) => {
          const items = query.data.products.filter((p) => p.category === category)
          if (items.length === 0) return null
          return (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="text-lg">{CATEGORY_LABELS[category]}</h2>
              <ul className="flex flex-col gap-3">
                {items.map((product) => (
                  <li key={product.id}>
                    <CatalogRow product={product} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
    </div>
  )
}

function CatalogRow({ product }: { product: Product }) {
  const availability = useProductMutation(productRequests.setAvailability)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-3">
          <ProductImage
            imageUrl={product.imageUrl}
            category={product.category}
            name={product.name}
            dimmed={!product.isActive}
            className="w-24 shrink-0"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-semibold">{product.name}</p>
            <Price priceCents={product.priceCents} priceBsCents={product.priceBsCents} />
            <div className="flex flex-wrap gap-1">
              {!product.isActive && (
                <StatusBadge tone="expired" className="px-2 py-0.5 text-xs">
                  Dado de baja
                </StatusBadge>
              )}
              {!product.isAvailable && (
                <StatusBadge tone="created" className="px-2 py-0.5 text-xs">
                  Agotado
                </StatusBadge>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" asChild>
            <Link to={`/trabajo/catalogo/${product.id}`}>Editar</Link>
          </Button>
          <Button
            variant="outline"
            disabled={availability.isPending}
            onClick={() =>
              availability.mutate(
                { id: product.id, isAvailable: !product.isAvailable },
                {
                  onSuccess: () =>
                    toast.success(
                      product.isAvailable ? 'Marcado como agotado.' : 'Disponible de nuevo.',
                    ),
                },
              )
            }
          >
            {product.isAvailable ? 'Marcar agotado' : 'Marcar disponible'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
