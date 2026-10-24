import { Prisma } from '@prisma/client'
import { checkoutExpiry, exceedsProductLimit } from '../domain/checkout.js'
import { usdToBsCents } from '../domain/money.js'
import { priceLine } from '../domain/pricing.js'
import { describeSchedule, isStoreOpen } from '../domain/schedule.js'
import { prisma } from '../lib/prisma.js'
import { TX_OPTIONS } from '../lib/tx.js'
import { AppError } from '../middleware/error.js'
import { expireStaleCheckouts } from './checkoutExpiration.js'
import { getProduct } from './products.js'
import { getLatestRate } from './rates.js'
import { getSettings } from './settings.js'

// Cada viaje a la base de datos cuesta tiempo, así que las relaciones se cargan con un JOIN (una sola
// consulta) y las operaciones arman el resultado en memoria en vez de volver a leer.
export const JOIN = { relationLoadStrategy: 'join' } as const

export const ORDER_INCLUDE = {
  items: { include: { product: true, coupon: true }, orderBy: { createdAt: 'asc' } },
  // Último rechazo, para que el cliente corrija y reenvíe (8.6).
  submissions: { where: { status: 'REJECTED' }, orderBy: { submittedAt: 'desc' }, take: 1 },
} satisfies Prisma.OrderInclude

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>

const EXPIRED_VISIBLE_MS = 24 * 60 * 60 * 1000

interface Rate {
  rateHundredths: number
}

// En CREATED se muestra el precio vigente del catálogo; en verificación, el congelado (8.5).
export function toCheckoutDto(order: OrderWithItems, rate: Rate | null) {
  const frozenRate = order.bcvRateHundredths ?? rate?.rateHundredths ?? null
  const toBs = (cents: number) => (frozenRate === null ? null : usdToBsCents(cents, frozenRate))

  const items = order.items.map((item) => {
    // Mientras no se envía la referencia, el precio y el descuento del cupón se calculan con el catálogo vigente.
    const live = priceLine(item.product.priceCents, item.quantity, item.coupon)
    const unitPriceCents = item.unitPriceCents ?? live.unitPriceCents
    const discountCents = item.discountCents ?? live.discountCents
    const lineTotalCents = item.lineTotalCents ?? live.lineTotalCents
    return {
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      category: item.product.category,
      imageUrl: item.product.imageUrl,
      isAvailable: item.product.isAvailable,
      isActive: item.product.isActive,
      quantity: item.quantity,
      unitPriceCents,
      discountCents,
      couponTitle: item.coupon?.title ?? null,
      lineTotalCents,
      lineTotalBsCents: toBs(lineTotalCents),
    }
  })

  const totalCents = order.totalCents ?? items.reduce((sum, i) => sum + i.lineTotalCents, 0)
  const rejection = order.submissions[0]

  return {
    id: order.id,
    status: order.status,
    isOpen: order.status === 'CREATED' && !order.everSubmitted,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    expiredAt: order.expiredAt,
    blockedUntil: order.blockedUntil,
    lastRejection: rejection
      ? { reason: rejection.rejectReason, note: rejection.rejectNote, at: rejection.reviewedAt }
      : null,
    items,
    totalCents,
    totalBsCents: order.amountBsCents ?? toBs(totalCents),
  }
}

// Checkouts del cliente: CREATED, IN_VERIFICATION y los EXPIRED de las últimas 24 h (9.3).
export async function listCheckouts(userId: string) {
  await expireStaleCheckouts(prisma, userId)
  const [orders, rate, settings] = await Promise.all([
    prisma.order.findMany({
      where: {
        customerId: userId,
        OR: [
          { status: { in: ['CREATED', 'IN_VERIFICATION'] } },
          { status: 'EXPIRED', expiredAt: { gte: new Date(Date.now() - EXPIRED_VISIBLE_MS) } },
        ],
      },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      ...JOIN,
    }),
    getLatestRate(),
    getSettings(),
  ])
  return {
    checkouts: orders.map((order) => toCheckoutDto(order, rate)),
    maxQuantityPerProduct: settings.maxQuantityPerProduct,
  }
}

// Todas las operaciones sobre los checkouts de un cliente se serializan con un bloqueo de
// transacción: así no se crean dos checkouts abiertos ni se pasa del tope con dos peticiones a la vez.
export async function withCustomerLock<T>(
  userId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`
    return work(tx)
  }, TX_OPTIONS)
}

// CREATED con el plazo vencido que la tarea o una lectura aún no han pasado a EXPIRED.
export const isStale = (order: { status: string; expiresAt: Date | null }, now: Date) =>
  order.status === 'CREATED' && order.expiresAt !== null && order.expiresAt < now

const unitsOf = (order: OrderWithItems, productId: string, excludeItemId?: string) =>
  order.items
    .filter((i) => i.productId === productId && i.id !== excludeItemId)
    .reduce((sum, i) => sum + i.quantity, 0)

const limitError = (max: number) =>
  new AppError(
    'MAX_QUANTITY_EXCEEDED',
    `Solo puedes pedir hasta ${max} unidades de cada producto.`,
    409,
  )

export async function addItem(userId: string, productId: string, quantity: number) {
  const settings = await getSettings()
  const now = new Date()
  if (!isStoreOpen(now, settings)) {
    throw new AppError(
      'STORE_CLOSED',
      `El local está cerrado. Horario: ${describeSchedule(settings)}.`,
      409,
    )
  }
  const product = await getProduct(productId)
  if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  if (!product.isActive) {
    throw new AppError('PRODUCT_UNAVAILABLE', 'Este producto ya no está disponible.', 409)
  }
  if (!product.isAvailable) {
    throw new AppError('PRODUCT_UNAVAILABLE', 'Este producto está agotado.', 409)
  }

  const expiresAt = checkoutExpiry(now, settings.checkoutExpirationHours)
  const order = await withCustomerLock(userId, async (tx) => {
    // Checkout abierto: CREATED sin envío previo. Uno rechazado no recibe ítems nuevos.
    let open = await tx.order.findFirst({
      where: { customerId: userId, status: 'CREATED', everSubmitted: false },
      include: ORDER_INCLUDE,
      ...JOIN,
    })
    if (open && isStale(open, now)) {
      await tx.order.updateMany({
        where: { id: open.id, status: 'CREATED', expiresAt: { lt: now } },
        data: { status: 'EXPIRED', expiredAt: now },
      })
      open = null
    }
    open ??= await tx.order.create({
      data: { customerId: userId, expiresAt },
      include: ORDER_INCLUDE,
      ...JOIN,
    })

    if (exceedsProductLimit(unitsOf(open, productId), quantity, settings.maxQuantityPerProduct)) {
      throw limitError(settings.maxQuantityPerProduct)
    }

    // Sin cupón: se suma a la línea existente del producto (8.5).
    const line = open.items.find((i) => i.productId === productId && i.couponId === null)
    const items = line
      ? open.items.map((i) => (i.id === line.id ? { ...i, quantity: i.quantity + quantity } : i))
      : [
          ...open.items,
          await tx.orderItem.create({
            data: { orderId: open.id, productId, quantity },
            include: { product: true, coupon: true },
          }),
        ]
    if (line) {
      await tx.orderItem.update({
        where: { id: line.id },
        data: { quantity: { increment: quantity } },
        select: { id: true },
      })
    }
    // Al agregar un ítem se reinicia el plazo.
    await tx.order.update({ where: { id: open.id }, data: { expiresAt }, select: { id: true } })
    return { ...open, expiresAt, items }
  })

  return toCheckoutDto(order, await getLatestRate())
}

// Línea de un checkout propio y todavía editable: CREATED y con el plazo vigente.
async function findEditableItem(tx: Prisma.TransactionClient, userId: string, itemId: string) {
  const item = await tx.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { include: ORDER_INCLUDE } },
    ...JOIN,
  })
  if (!item || item.order.customerId !== userId) {
    throw new AppError('ITEM_NOT_FOUND', 'No encontramos ese producto en tu checkout.', 404)
  }
  if (item.order.status !== 'CREATED' || isStale(item.order, new Date())) {
    throw new AppError('CHECKOUT_NOT_EDITABLE', 'Este checkout ya no se puede modificar.', 409)
  }
  return item
}

export async function updateItemQuantity(userId: string, itemId: string, quantity: number) {
  const settings = await getSettings()
  const order = await withCustomerLock(userId, async (tx) => {
    const item = await findEditableItem(tx, userId, itemId)
    if (item.couponId) {
      throw new AppError(
        'COUPON_LINE_QUANTITY',
        'Una línea con cupón siempre es de una unidad.',
        409,
      )
    }
    const others = unitsOf(item.order, item.productId, item.id)
    if (exceedsProductLimit(others, quantity, settings.maxQuantityPerProduct)) {
      throw limitError(settings.maxQuantityPerProduct)
    }
    await tx.orderItem.update({ where: { id: item.id }, data: { quantity }, select: { id: true } })
    return {
      ...item.order,
      items: item.order.items.map((i) => (i.id === item.id ? { ...i, quantity } : i)),
    }
  })
  return toCheckoutDto(order, await getLatestRate())
}

// Quita una línea. Si era la última, el checkout pasa a CANCELLED y se devuelve null.
export async function removeItem(userId: string, itemId: string) {
  const order = await withCustomerLock(userId, async (tx) => {
    const item = await findEditableItem(tx, userId, itemId)
    await tx.orderItem.delete({ where: { id: item.id }, select: { id: true } })
    const items = item.order.items.filter((i) => i.id !== item.id)
    if (items.length === 0) {
      await tx.order.updateMany({
        where: { id: item.orderId, status: 'CREATED' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })
      return null
    }
    return { ...item.order, items }
  })
  return order ? toCheckoutDto(order, await getLatestRate()) : null
}

// Solo en CREATED; IN_VERIFICATION y posteriores no se cancelan (8.5).
export async function cancelCheckout(userId: string, orderId: string) {
  await withCustomerLock(userId, async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, customerId: userId, status: 'CREATED' },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })
    if (result.count > 0) return
    // No cambió nada: se distingue «no es tuyo o no existe» de «ya no se puede cancelar».
    const exists = await tx.order.findFirst({
      where: { id: orderId, customerId: userId },
      select: { id: true },
    })
    if (!exists) throw new AppError('CHECKOUT_NOT_FOUND', 'Checkout no encontrado.', 404)
    throw new AppError('CHECKOUT_NOT_CANCELLABLE', 'Este checkout ya no se puede cancelar.', 409)
  })
}
