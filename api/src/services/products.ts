import { Prisma, type Category, type Product } from '@prisma/client'
import { usdToBsCents } from '../domain/money.js'
import { prisma } from '../lib/prisma.js'
import { TtlCache } from '../lib/ttlCache.js'
import { AppError } from '../middleware/error.js'

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

// Todos los productos (activos y dados de baja) en una sola consulta, guardados 10 s. Toda escritura
// pasa por este servidor y llama a invalidateProducts(), así que el menú y el checkout ven el cambio al instante.
const cache = new TtlCache<'all', Product[]>(10_000)

export async function getProducts(): Promise<Product[]> {
  return (await cache.getOrLoad('all', () => prisma.product.findMany())) ?? []
}

export async function getProduct(id: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.id === id) ?? null
}

export const invalidateProducts = () => cache.clear()

const productNotFound = () => new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)

export async function createProduct(data: Prisma.ProductCreateInput): Promise<Product> {
  const product = await prisma.product.create({ data })
  invalidateProducts()
  return product
}

// Un solo viaje a la base: si el producto no existe, Prisma lanza P2025 y se responde 404.
export async function updateProduct(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
  try {
    const product = await prisma.product.update({ where: { id }, data })
    invalidateProducts()
    return product
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw productNotFound()
    }
    throw error
  }
}
