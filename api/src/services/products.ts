import type { Category, Product } from '@prisma/client'
import { usdToBsCents } from '../domain/money.js'

// Orden fijo de las categorías en el menú (8.3).
const CATEGORY_ORDER: Category[] = ['CAFE', 'BEBIDAS', 'POSTRES']

export interface RateInfo {
  rateHundredths: number
  bcvDate: Date
}

export function toProductDto(product: Product, rate: RateInfo | null) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    // Sin tasa disponible solo se muestran dólares.
    priceBsCents: rate ? usdToBsCents(product.priceCents, rate.rateHundredths) : null,
    imageUrl: product.imageUrl,
    category: product.category,
    isAvailable: product.isAvailable,
    isActive: product.isActive,
  }
}

// Por categoría (Café, Bebidas, Postres) y, dentro de cada una, alfabético por nombre.
export function sortProducts<T extends { category: Category; name: string }>(products: T[]): T[] {
  return [...products].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
  )
}
