import { bucketDemand, resolvePeriod, summarizeSales, type Period } from '../domain/reports.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { JOIN } from './checkout.js'
import { getProducts } from './products.js'

// Una venta es un pedido con paidAt dentro del período y en estado PAID, IN_QUEUE o DELIVERED (8.10).
const SALE_STATUSES = ['PAID', 'IN_QUEUE', 'DELIVERED'] as const

export async function salesReport(period: Period, range?: { from: string; to: string }) {
  let start: Date
  let end: Date
  try {
    ;({ start, end } = resolvePeriod(period, new Date(), range))
  } catch (error) {
    if (error instanceof RangeError) throw new AppError('INVALID_RANGE', error.message, 400)
    throw error
  }

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: { paidAt: { gte: start, lt: end }, status: { in: [...SALE_STATUSES] } },
      select: {
        paidAt: true,
        totalCents: true,
        amountBsCents: true,
        items: { select: { productId: true, quantity: true, lineTotalCents: true } },
      },
      ...JOIN,
    }),
    getProducts(),
  ])

  const sales = orders.flatMap((o) => (o.paidAt ? [{ ...o, paidAt: o.paidAt }] : []))
  const summary = summarizeSales(sales, new Map(products.map((p) => [p.id, p])))
  const demand = bucketDemand(sales.map((o) => o.paidAt))
  return {
    period: { key: period, start: start.toISOString(), end: end.toISOString() },
    ...summary,
    demandByHour: demand.byHour,
    demandByWeekday: demand.byWeekday,
  }
}

// Resumen del día para el gerente (solo lectura): total en $ y Bs, pedidos y unidades por producto.
export async function salesToday() {
  const report = await salesReport('today')
  return {
    totals: report.totals,
    units: report.byProduct.map(({ productId, name, units }) => ({ productId, name, units })),
  }
}
