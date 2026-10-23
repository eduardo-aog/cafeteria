import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Price } from '@/components/Price'
import { ProductImage } from '@/components/ProductImage'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { useMenu } from '@/hooks/useMenu'
import { describeOpening, formatBs, formatShortDate } from '@/lib/format'
import { CATEGORY_LABELS, type Category, type Product } from '@/lib/types'

const CATEGORIES: Category[] = ['CAFE', 'BEBIDAS', 'POSTRES']

export default function MenuPage() {
  const menu = useMenu()

  if (menu.isPending) return <LoadingBlock />
  if (menu.isError)
    return <ErrorBlock message={menu.error.message} onRetry={() => void menu.refetch()} />

  const { products, rate, store } = menu.data

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Menú</h1>

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

      {CATEGORIES.map((category) => {
        const items = products.filter((p) => p.category === category)
        if (items.length === 0) return null
        return (
          <section key={category} className="flex flex-col gap-3">
            <h2 className="text-lg">{CATEGORY_LABELS[category]}</h2>
            <ul className="grid grid-cols-2 gap-3">
              {items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {rate && (
        <p className="text-center text-sm text-muted-foreground">
          Tasa BCV del {formatShortDate(rate.bcvDate)}: {formatBs(rate.rateHundredths)}
        </p>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/producto/${product.id}`}
      className="flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-2 transition-colors duration-150 hover:bg-accent"
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
      <div className="flex flex-1 flex-col gap-1 px-1 pb-1">
        <h3 className="font-sans text-base font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <Price
          priceCents={product.priceCents}
          priceBsCents={product.priceBsCents}
          className="mt-auto pt-1"
        />
      </div>
    </Link>
  )
}
