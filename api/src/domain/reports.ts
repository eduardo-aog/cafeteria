import { DateTime } from 'luxon'
import { STORE_ZONE } from './schedule.js'

export type Period = 'today' | 'week' | 'month' | 'custom'

const MAX_RANGE_DAYS = 366

// Rango [start, end) de un período, siempre en hora de Caracas (6.2). La semana va de lunes a domingo.
// Lanza RangeError si el rango personalizado no es válido.
export function resolvePeriod(
  period: Period,
  now: Date,
  range?: { from: string; to: string },
): { start: Date; end: Date } {
  const local = DateTime.fromJSDate(now, { zone: STORE_ZONE })
  let start: DateTime
  let end: DateTime
  switch (period) {
    case 'today':
      start = local.startOf('day')
      end = start.plus({ days: 1 })
      break
    case 'week':
      start = local.startOf('week')
      end = start.plus({ weeks: 1 })
      break
    case 'month':
      start = local.startOf('month')
      end = start.plus({ months: 1 })
      break
    case 'custom': {
      if (!range) throw new RangeError('Indica las fechas «desde» y «hasta».')
      start = DateTime.fromISO(range.from, { zone: STORE_ZONE }).startOf('day')
      end = DateTime.fromISO(range.to, { zone: STORE_ZONE }).startOf('day').plus({ days: 1 })
      if (!start.isValid || !end.isValid) throw new RangeError('Las fechas no son válidas.')
      if (end <= start) throw new RangeError('La fecha «hasta» no puede ser anterior a «desde».')
      if (end.diff(start, 'days').days > MAX_RANGE_DAYS) {
        throw new RangeError('El rango no puede pasar de un año.')
      }
    }
  }
  return { start: start.toJSDate(), end: end.toJSDate() }
}

// Pedidos por hora (0 a 23) y por día de la semana (lunes a domingo) según paidAt en Caracas (8.10).
export function bucketDemand(paidAts: Date[]): { byHour: number[]; byWeekday: number[] } {
  const byHour = Array<number>(24).fill(0)
  const byWeekday = Array<number>(7).fill(0)
  for (const date of paidAts) {
    const local = DateTime.fromJSDate(date, { zone: STORE_ZONE })
    byHour[local.hour]! += 1
    byWeekday[local.weekday - 1]! += 1
  }
  return { byHour, byWeekday }
}

export interface SaleOrder {
  paidAt: Date
  totalCents: number | null
  amountBsCents: number | null
  items: { productId: string; quantity: number; lineTotalCents: number | null }[]
}

export interface ProductInfo {
  name: string
  category: string
}

// Resumen de ventas con los montos congelados de cada pedido y de sus líneas (8.10).
export function summarizeSales(orders: SaleOrder[], products: Map<string, ProductInfo>) {
  let totalCents = 0
  let totalBsCents = 0
  const byProduct = new Map<string, { units: number; amountCents: number }>()
  for (const order of orders) {
    totalCents += order.totalCents ?? 0
    totalBsCents += order.amountBsCents ?? 0
    for (const item of order.items) {
      const row = byProduct.get(item.productId) ?? { units: 0, amountCents: 0 }
      row.units += item.quantity
      row.amountCents += item.lineTotalCents ?? 0
      byProduct.set(item.productId, row)
    }
  }

  const productRows = [...byProduct.entries()]
    .map(([productId, row]) => ({
      productId,
      name: products.get(productId)?.name ?? 'Producto eliminado',
      category: products.get(productId)?.category ?? 'CAFE',
      ...row,
    }))
    .sort(
      (a, b) =>
        b.units - a.units || b.amountCents - a.amountCents || a.name.localeCompare(b.name, 'es'),
    )

  const categories = new Map<string, { units: number; amountCents: number }>()
  for (const row of productRows) {
    const c = categories.get(row.category) ?? { units: 0, amountCents: 0 }
    c.units += row.units
    c.amountCents += row.amountCents
    categories.set(row.category, c)
  }

  return {
    totals: { orders: orders.length, totalCents, totalBsCents },
    byProduct: productRows,
    byCategory: [...categories.entries()].map(([category, row]) => ({ category, ...row })),
    topProducts: productRows.slice(0, 10),
  }
}
