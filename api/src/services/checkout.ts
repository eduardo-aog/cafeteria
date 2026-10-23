import { Prisma, type Product } from '@prisma/client'
import { checkoutExpiry, exceedsProductLimit } from '../domain/checkout.js'
import { lineTotal, usdToBsCents } from '../domain/money.js'
import { describeSchedule, isStoreOpen } from '../domain/schedule.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { expireStaleCheckouts } from './checkoutExpiration.js'
import { getLatestRate } from './rates.js'
import { getSettings } from './settings.js'

const ORDER_INCLUDE = {
  items: { include: { product: true }, orderBy: { createdAt: 'asc' } },
  // Último rechazo, para que el cliente corrija y reenvíe (8.6).
  submissions: { where: { status: 'REJECTED' }, orderBy: { submittedAt: 'desc' }, take: 1 },
} satisfies Prisma.OrderInclude

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>

const EXPIRED_VISIBLE_MS = 24 * 60 * 60 * 1000

interface Rate {
  rateHundredths: number
}

// En CREATED se muestra el precio vigente del catálogo; en verificación, el congelado (8.5).
export function toCheckoutDto(order: OrderWithItems, rate: Rate | null) {
  const frozenRate = order.bcvRateHundredths ?? rate?.rateHundredths ?? null
  const toBs = (cents: number) => (frozenRate === null ? null : usdToBsCents(cents, frozenRate))

  const items = order.items.map((item) => {
    const unitPriceCents = item.unitPriceCents ?? item.product.priceCents
    const discountCents = item.discountCents ?? 0
    const lineTotalCents =
      item.lineTotalCents ?? lineTotal(unitPriceCents * item.quantity, discountCents)
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

async function loadCheckout(orderId: string) {
  const [order, rate] = await Promise.all([
    prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE }),
    getLatestRate(),
  ])
  return toCheckoutDto(order, rate)
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
async function withCustomerLock<T>(
  userId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`
      await expireStaleCheckouts(tx, userId)
      return work(tx)
    },
    // Con connection_limit=1 las peticiones simultáneas esperan su turno: se amplían las esperas por defecto (2 s y 5 s).
    { maxWait: 15_000, timeout: 20_000 },
  )
}

async function unitsOfProduct(
  tx: Prisma.TransactionClient,
  orderId: string,
  productId: string,
  excludeItemId?: string,
) {
  const sum = await tx.orderItem.aggregate({
    where: { orderId, productId, ...(excludeItemId && { id: { not: excludeItemId } }) },
    _sum: { quantity: true },
  })
  return sum._sum.quantity ?? 0
}

const limitError = (max: number) =>
  new AppError(
    'MAX_QUANTITY_EXCEEDED',
    `Solo puedes pedir hasta ${max} unidades de cada producto.`,
    409,
  )

function assertProductAvailable(product: Product | null): asserts product is Product {
  if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  if (!product.isActive) {
    throw new AppError('PRODUCT_UNAVAILABLE', 'Este producto ya no está disponible.', 409)
  }
  if (!product.isAvailable) {
    throw new AppError('PRODUCT_UNAVAILABLE', 'Este producto está agotado.', 409)
  }
}

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
  assertProductAvailable(await prisma.product.findUnique({ where: { id: productId } }))

  const orderId = await withCustomerLock(userId, async (tx) => {
    // Checkout abierto: CREATED sin envío previo. Uno rechazado no recibe ítems nuevos.
    const order =
      (await tx.order.findFirst({
        where: { customerId: userId, status: 'CREATED', everSubmitted: false },
      })) ??
      (await tx.order.create({
        data: {
          customerId: userId,
          expiresAt: checkoutExpiry(now, settings.checkoutExpirationHours),
        },
      }))

    const units = await unitsOfProduct(tx, order.id, productId)
    if (exceedsProductLimit(units, quantity, settings.maxQuantityPerProduct)) {
      throw limitError(settings.maxQuantityPerProduct)
    }

    // Sin cupón: se suma a la línea existente del producto (8.5).
    const line = await tx.orderItem.findFirst({
      where: { orderId: order.id, productId, couponId: null },
    })
    if (line) {
      await tx.orderItem.update({
        where: { id: line.id },
        data: { quantity: { increment: quantity } },
      })
    } else {
      await tx.orderItem.create({ data: { orderId: order.id, productId, quantity } })
    }

    // Al agregar un ítem se reinicia el plazo.
    await tx.order.update({
      where: { id: order.id },
      data: { expiresAt: checkoutExpiry(now, settings.checkoutExpirationHours) },
    })
    return order.id
  })

  return loadCheckout(orderId)
}

// Línea de un checkout propio y todavía editable (CREATED).
async function findEditableItem(tx: Prisma.TransactionClient, userId: string, itemId: string) {
  const item = await tx.orderItem.findUnique({ where: { id: itemId }, include: { order: true } })
  if (!item || item.order.customerId !== userId) {
    throw new AppError('ITEM_NOT_FOUND', 'No encontramos ese producto en tu checkout.', 404)
  }
  if (item.order.status !== 'CREATED') {
    throw new AppError('CHECKOUT_NOT_EDITABLE', 'Este checkout ya no se puede modificar.', 409)
  }
  return item
}

export async function updateItemQuantity(userId: string, itemId: string, quantity: number) {
  const settings = await getSettings()
  const orderId = await withCustomerLock(userId, async (tx) => {
    const item = await findEditableItem(tx, userId, itemId)
    if (item.couponId) {
      throw new AppError(
        'COUPON_LINE_QUANTITY',
        'Una línea con cupón siempre es de una unidad.',
        409,
      )
    }
    const others = await unitsOfProduct(tx, item.orderId, item.productId, item.id)
    if (exceedsProductLimit(others, quantity, settings.maxQuantityPerProduct)) {
      throw limitError(settings.maxQuantityPerProduct)
    }
    await tx.orderItem.update({ where: { id: item.id }, data: { quantity } })
    return item.orderId
  })
  return loadCheckout(orderId)
}

// Quita una línea. Si era la última, el checkout pasa a CANCELLED y se devuelve null.
export async function removeItem(userId: string, itemId: string) {
  const { orderId, cancelled } = await withCustomerLock(userId, async (tx) => {
    const item = await findEditableItem(tx, userId, itemId)
    await tx.orderItem.delete({ where: { id: item.id } })
    const remaining = await tx.orderItem.count({ where: { orderId: item.orderId } })
    if (remaining > 0) return { orderId: item.orderId, cancelled: false }
    await tx.order.updateMany({
      where: { id: item.orderId, status: 'CREATED' },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })
    return { orderId: item.orderId, cancelled: true }
  })
  return cancelled ? null : loadCheckout(orderId)
}

// Solo en CREATED; IN_VERIFICATION y posteriores no se cancelan (8.5).
export async function cancelCheckout(userId: string, orderId: string) {
  await withCustomerLock(userId, async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order || order.customerId !== userId) {
      throw new AppError('CHECKOUT_NOT_FOUND', 'Checkout no encontrado.', 404)
    }
    const result = await tx.order.updateMany({
      where: { id: orderId, status: 'CREATED' },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })
    if (result.count === 0) {
      throw new AppError('CHECKOUT_NOT_CANCELLABLE', 'Este checkout ya no se puede cancelar.', 409)
    }
  })
}
