import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

// Imagen genérica por categoría cuando el producto no tiene la suya (8.3).
const GENERIC: Record<Category, string> = {
  CAFE: '/images/categoria-cafe.svg',
  BEBIDAS: '/images/categoria-bebidas.svg',
  POSTRES: '/images/categoria-postres.svg',
}

interface ProductImageProps {
  imageUrl: string | null
  category: Category
  name: string
  dimmed?: boolean
  className?: string
}

export function ProductImage({ imageUrl, category, name, dimmed, className }: ProductImageProps) {
  return (
    <img
      src={imageUrl ?? GENERIC[category]}
      alt={name}
      loading="lazy"
      className={cn(
        'aspect-4/3 w-full rounded-lg bg-secondary object-cover transition-opacity duration-150',
        dimmed && 'opacity-50',
        className,
      )}
    />
  )
}
