import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, LoaderCircle, Plus } from 'lucide-react'
import { Price } from '@/components/Price'
import { ProductImage } from '@/components/ProductImage'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { SegmentedControl } from '@/components/SegmentedControl'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { useAddToCheckout } from '@/hooks/useCheckouts'
import { ViewToggle } from '@/components/ViewToggle'
import { gridColumnsClass, useGridColumns } from '@/hooks/useGridColumns'
import { useMenu } from '@/hooks/useMenu'
import { describeOpening, formatBs } from '@/lib/format'
import { CATEGORY_LABELS, type Category, type Product } from '@/lib/types'

const CATEGORIES: Category[] = ['CAFE', 'BEBIDAS', 'POSTRES']

type CategoryFilter = 'ALL' | Category

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'Todo' },
  ...CATEGORIES.map((category) => ({ value: category, label: CATEGORY_LABELS[category] })),
]

export default function MenuPage() {
  const menu = useMenu()
  const [columns, setColumns] = useGridColumns()
  const [filter, setFilter] = useState<CategoryFilter>('ALL')

  if (menu.isPending) return <LoadingBlock />
  if (menu.isError)
    return <ErrorBlock message={menu.error.message} onRetry={() => void menu.refetch()} />

  const { products, rate, store } = menu.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">Menú</h1>
        <div className="flex items-center gap-4">
          {rate && (
            <p className="text-sm leading-tight text-muted-foreground">
              Tasa del día:
              <br />
              <span className="font-semibold text-foreground">{formatBs(rate.rateHundredths)}</span>
            </p>
          )}
          <ViewToggle value={columns} onChange={setColumns} />
        </div>
      </div>

      <SegmentedControl
        label="Filtrar por tipo"
        value={filter}
        options={CATEGORY_FILTERS}
        onChange={setFilter}
      />

      {!store.isOpen && (
        <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          <Clock className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <p>
            Cerrado
            {store.nextOpening && ` · Abrimos ${describeOpening(store.nextOpening)}`}
          </p>
        </div>
      )}

      {products.length === 0 && <EmptyBlock>Aún no hay productos en el menú.</EmptyBlock>}
      {products.length > 0 && filter !== 'ALL' && !products.some((p) => p.category === filter) && (
        <EmptyBlock>No hay productos en esta categoría.</EmptyBlock>
      )}

      {CATEGORIES.filter((category) => filter === 'ALL' || category === filter).map((category) => {
        const items = products.filter((p) => p.category === category)
        if (items.length === 0) return null
        return (
          <section key={category} className="flex flex-col gap-3">
            <h2 className="text-lg">{CATEGORY_LABELS[category]}</h2>
            <ul className={`grid gap-3 ${gridColumnsClass(columns)}`}>
              {items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} storeOpen={store.isOpen} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function ProductCard({ product, storeOpen }: { product: Product; storeOpen: boolean }) {
  const { add, isPending } = useAddToCheckout()

  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-2">
      <Link
        to={`/producto/${product.id}`}
        className="flex flex-1 flex-col gap-2 rounded-lg transition-colors duration-150 hover:bg-accent"
      >
        <div className="relative">
          <ProductImage
            imageUrl={product.imageUrl}
            category={product.category}
            name={product.name}
            dimmed={!product.isAvailable}
          />
          {!product.isAvailable && (
            <StatusBadge tone="created" className="absolute top-2 left-2">
              Agotado
            </StatusBadge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-1">
          <h3 className="font-sans text-base font-semibold">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          <Price
            priceCents={product.priceCents}
            priceBsCents={product.priceBsCents}
            className="mt-auto pt-1"
          />
        </div>
      </Link>
      <Button
        disabled={!product.isAvailable || !storeOpen || isPending}
        onClick={() => add(product)}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Plus strokeWidth={1.5} aria-hidden="true" />
        )}
        {isPending ? 'Agregando…' : 'Agregar'}
      </Button>
    </div>
  )
}
