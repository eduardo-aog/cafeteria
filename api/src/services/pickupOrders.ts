import type { Prisma } from '@prisma/client'
import { classifyScanCode, scanRejectionMessage } from '../domain/scan.js'
import { startOfTodayCaracas } from '../domain/time.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { JOIN } from './checkout.js'

const HISTORY_PAGE = 20

const QUEUE_INCLUDE = {
  customer: { select: { name: true } },
  items: { include: { product: true }, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude

type QueueOrder = Prisma.OrderGetPayload<{ include: typeof QUEUE_INCLUDE }>

const toQueueDto = (order: QueueOrder) => ({
  id: order.id,
  pickupCode: order.pickupCode,
  customerName: order.customer.name,
  scannedAt: order.scannedAt,
  deliveredAt: order.deliveredAt,
  items: order.items.map((i) => ({ id: i.id, name: i.product.name, quantity: i.quantity })),
})

// Escaneo (8.7): PAID → IN_QUEUE sin paso de confirmación. El QR es de un solo uso.
export async function scanOrder(cashierId: string, rawCode: string) {
  const target = classifyScanCode(rawCode)
  const notFound = () =>
    new AppError('ORDER_NOT_FOUND', 'No encontramos un pedido con ese código.', 404)
  if (!target) throw notFound()

  const order = await prisma.order.findFirst({
    where: target.kind === 'qr' ? { qrToken: target.value } : { pickupCode: target.value },
    include: QUEUE_INCLUDE,
    ...JOIN,
  })
  if (!order) throw notFound()
  if (order.status !== 'PAID') {
    throw new AppError('ORDER_NOT_SCANNABLE', scanRejectionMessage(order.status), 409)
  }

  // Actualización condicional: si dos cajeros escanean a la vez, solo uno la consigue (6.4).
  const moved = await prisma.order.updateMany({
    where: { id: order.id, status: 'PAID' },
    data: { status: 'IN_QUEUE', scannedAt: new Date(), scannedById: cashierId },
  })
  if (moved.count === 0) {
    throw new AppError('ORDER_NOT_SCANNABLE', scanRejectionMessage('IN_QUEUE'), 409)
  }
  const dto = toQueueDto(order)
  return { pickupCode: dto.pickupCode, customerName: dto.customerName, items: dto.items }
}

// Cola del barista: IN_QUEUE por orden de llegada (8.7).
export async function listBaristaQueue() {
  const orders = await prisma.order.findMany({
    where: { status: 'IN_QUEUE' },
    orderBy: [{ scannedAt: 'asc' }, { id: 'asc' }],
    include: QUEUE_INCLUDE,
    ...JOIN,
  })
  return orders.map(toQueueDto)
}

// El pedido se «elimina» de la cola al entregarlo; el registro se conserva.
export async function deliverOrder(baristaId: string, orderId: string) {
  const moved = await prisma.order.updateMany({
    where: { id: orderId, status: 'IN_QUEUE' },
    data: { status: 'DELIVERED', deliveredAt: new Date(), deliveredById: baristaId },
  })
  if (moved.count > 0) return
  const exists = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!exists) throw new AppError('ORDER_NOT_FOUND', 'Pedido no encontrado.', 404)
  throw new AppError('ORDER_NOT_IN_QUEUE', 'Este pedido ya no está en la cola.', 409)
}

// Pedidos entregados hoy (Caracas), para la pantalla «Restaurar pedidos» (8.7).
export async function listDeliveredToday() {
  const orders = await prisma.order.findMany({
    where: { status: 'DELIVERED', deliveredAt: { gte: startOfTodayCaracas(new Date()) } },
    orderBy: [{ deliveredAt: 'desc' }, { id: 'asc' }],
    include: QUEUE_INCLUDE,
    ...JOIN,
  })
  return orders.map(toQueueDto)
}

// Restaurar a la cola un pedido entregado el mismo día. Conserva su scannedAt, así que vuelve a su lugar.
export async function restoreOrder(managerId: string, orderId: string) {
  const now = new Date()
  const moved = await prisma.order.updateMany({
    where: { id: orderId, status: 'DELIVERED', deliveredAt: { gte: startOfTodayCaracas(now) } },
    data: { status: 'IN_QUEUE', restoredAt: now, restoredById: managerId },
  })
  if (moved.count > 0) return
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  })
  if (!order) throw new AppError('ORDER_NOT_FOUND', 'Pedido no encontrado.', 404)
  if (order.status !== 'DELIVERED') {
    throw new AppError('ORDER_NOT_DELIVERED', 'Este pedido no está entregado.', 409)
  }
  throw new AppError(
    'RESTORE_WINDOW_PASSED',
    'Solo se pueden restaurar pedidos entregados hoy.',
    409,
  )
}

// Historial del cliente (8.7): IN_QUEUE y DELIVERED, del más reciente al más antiguo, de 20 en 20.
// No lleva QR ni código ni estado: el cliente no ve nada de la preparación.
export async function listHistory(userId: string, cursor?: string) {
  const orders = await prisma.order.findMany({
    where: { customerId: userId, status: { in: ['IN_QUEUE', 'DELIVERED'] } },
    orderBy: [{ scannedAt: 'desc' }, { id: 'desc' }],
    take: HISTORY_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: { items: { include: { product: true, coupon: true }, orderBy: { createdAt: 'asc' } } },
    ...JOIN,
  })
  const page = orders.slice(0, HISTORY_PAGE)
  return {
    orders: page.map((o) => ({
      id: o.id,
      paidAt: o.paidAt,
      scannedAt: o.scannedAt,
      totalCents: o.totalCents,
      amountBsCents: o.amountBsCents,
      items: o.items.map((i) => ({
        id: i.id,
        name: i.product.name,
        quantity: i.quantity,
        lineTotalCents: i.lineTotalCents,
        couponTitle: i.coupon?.title ?? null,
      })),
    })),
    nextCursor: orders.length > HISTORY_PAGE ? page[HISTORY_PAGE - 1]!.id : null,
  }
}
