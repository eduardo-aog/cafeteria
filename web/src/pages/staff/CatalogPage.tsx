import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Price } from '@/components/Price'
import { ProductImage } from '@/components/ProductImage'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { SegmentedControl } from '@/components/SegmentedControl'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { ViewToggle } from '@/components/ViewToggle'
import { gridColumnsClass, useGridColumns } from '@/hooks/useGridColumns'
import {
  productMutationOptions,
  productRequests,
  useManagerProducts,
  useProductMutation,
} from '@/hooks/useManagerProducts'
import { CATEGORY_LABELS, type Category, type Product } from '@/lib/types'

const CATEGORIES: Category[] = ['CAFE', 'BEBIDAS', 'POSTRES']

type Filter = 'all' | 'soldOut' | 'inactive'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'soldOut', label: 'Agotados' },
  { value: 'inactive', label: 'De baja' },
]

const FILTER_PREDICATES: Record<Filter, (product: Product) => boolean> = {
  all: () => true,
  soldOut: (product) => !product.isAvailable,
  inactive: (product) => !product.isActive,
}

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'Todavía no hay productos. Crea el primero con «Nuevo».',
  soldOut: 'No hay productos agotados.',
  inactive: 'No hay productos dados de baja.',
}

export default function CatalogPage() {
  const query = useManagerProducts()
  const [filter, setFilter] = useState<Filter>('all')
  const [columns, setColumns] = useGridColumns()

  const visible = query.data?.products.filter(FILTER_PREDICATES[filter]) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">Catálogo</h1>
        <Button asChild>
          <Link to="/trabajo/catalogo/nuevo">
            <Plus strokeWidth={1.5} aria-hidden="true" />
            Nuevo
          </Link>
        </Button>
      </div>

      <SegmentedControl
        label="Filtrar productos"
        value={filter}
        options={FILTERS}
        onChange={setFilter}
      />
      <div className="flex justify-end">
        <ViewToggle value={columns} onChange={setColumns} />
      </div>

      {query.isPending && <LoadingBlock />}
      {query.isError && (
        <ErrorBlock message={query.error.message} onRetry={() => void query.refetch()} />
      )}
      {query.data && visible.length === 0 && <EmptyBlock>{EMPTY_MESSAGES[filter]}</EmptyBlock>}

      {query.data &&
        CATEGORIES.map((category) => {
          const items = visible.filter((p) => p.category === category)
          if (items.length === 0) return null
          return (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="text-lg">{CATEGORY_LABELS[category]}</h2>
              <ul className={`grid gap-3 ${gridColumnsClass(columns)}`}>
                {items.map((product) => (
                  <li key={product.id}>
                    <CatalogCard product={product} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
    </div>
  )
}

// Todo el contenido va hacia abajo: imagen, nombre, precios y botones.
function CatalogCard({ product }: { product: Product }) {
  const availability = useProductMutation(
    productRequests.setAvailability,
    productMutationOptions.setAvailability,
  )

  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-2">
      <div className="relative">
        <ProductImage
          imageUrl={product.imageUrl}
          category={product.category}
          name={product.name}
          dimmed={!product.isActive || !product.isAvailable}
        />
        {(!product.isActive || !product.isAvailable) && (
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
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
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1">
        <h3 className="font-sans text-base font-semibold">{product.name}</h3>
        <Price priceCents={product.priceCents} priceBsCents={product.priceBsCents} />
      </div>
      <div className="mt-1 flex flex-col gap-2">
        <Button variant="secondary" asChild>
          <Link to={`/trabajo/catalogo/${product.id}`}>Editar</Link>
        </Button>
        <Button
          variant="outline"
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
    </div>
  )
}
