import { Prisma } from '@prisma/client'
import { buildPaymentText, formatPaymentDoc, formatPhone } from '../domain/payment.js'
import { priceLine } from '../domain/pricing.js'
import { usdToBsCents } from '../domain/money.js'
import { formatTimeCaracas } from '../domain/schedule.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { getBanks } from './banks.js'
import {
  isStale,
  JOIN,
  ORDER_INCLUDE,
  toCheckoutDto,
  withCustomerLock,
  type OrderWithItems,
} from './checkout.js'
import { newQrToken, uniquePickupCode } from './pickup.js'
import { getLatestRate } from './rates.js'
import { getSettings } from './settings.js'

type Db = Prisma.TransactionClient | typeof prisma

async function loadPayableOrder(db: Db, userId: string, orderId: string): Promise<OrderWithItems> {
  const order = await db.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: ORDER_INCLUDE,
    ...JOIN,
  })
  if (!order) throw new AppError('CHECKOUT_NOT_FOUND', 'Checkout no encontrado.', 404)
  if (order.status !== 'CREATED' || isStale(order, new Date())) {
    throw new AppError(
      'CHECKOUT_NOT_PAYABLE',
      'Este checkout ya no está disponible para pagar.',
      409,
    )
  }
  return order
}

// Validaciones 2 a 4 de 8.6 (la 1 la hace loadPayableOrder), en ese orden.
function assertCanPay(order: OrderWithItems, userId: string, now: Date) {
  if (order.blockedUntil && order.blockedUntil > now) {
    throw new AppError(
      'CHECKOUT_BLOCKED',
      `Podrás reenviar la referencia a las ${formatTimeCaracas(order.blockedUntil)}.`,
      409,
    )
  }

  const unavailable = order.items.filter((i) => !i.product.isActive || !i.product.isAvailable)
  if (unavailable.length > 0) {
    throw new AppError(
      'ITEMS_UNAVAILABLE',
      `Quita estos productos antes de pagar: ${unavailable.map((i) => i.product.name).join(', ')}.`,
      409,
      unavailable.map((i) => ({
        itemId: i.id,
        name: i.product.name,
        reason: i.product.isActive ? 'SOLD_OUT' : 'DISCONTINUED',
      })),
    )
  }

  // Un cupón reservado sigue siendo válido aunque pase fin de mes (8.9).
  const badCoupons = order.items.filter(
    (i) => i.couponId && (i.coupon?.status !== 'RESERVED' || i.coupon.userId !== userId),
  )
  if (badCoupons.length > 0) {
    throw new AppError(
      'COUPON_NOT_VALID',
      'Un cupón de tu checkout ya no es válido. Quita esa línea para continuar.',
      409,
      badCoupons.map((i) => ({ itemId: i.id, name: i.product.name })),
    )
  }
}

// Precios congelados de cada línea con los valores vigentes del catálogo y los cupones.
function priceOrder(order: OrderWithItems) {
  const lines = order.items.map((item) => ({
    id: item.id,
    ...priceLine(item.product.priceCents, item.quantity, item.coupon),
  }))
  return { lines, totalCents: lines.reduce((sum, l) => sum + l.lineTotalCents, 0) }
}

// Una sola sentencia para congelar todas las líneas (cada viaje a la base cuesta tiempo).
async function freezeItems(
  tx: Prisma.TransactionClient,
  lines: ReturnType<typeof priceOrder>['lines'],
) {
  const rows = Prisma.join(
    lines.map(
      (l) =>
        Prisma.sql`(${l.id}::uuid, ${l.unitPriceCents}::int, ${l.discountCents}::int, ${l.lineTotalCents}::int)`,
    ),
  )
  await tx.$executeRaw`
    UPDATE "OrderItem" AS i
    SET "unitPriceCents" = v.unit, "discountCents" = v.discount, "lineTotalCents" = v.total
    FROM (VALUES ${rows}) AS v(id, unit, discount, total)
    WHERE i."id" = v.id`
}

// Paso 1 de 8.6: «Pagar». Valida y devuelve los datos de cobro, el total y el texto de COPIAR TODO.
export async function preparePayment(userId: string, orderId: string) {
  const [settings, rate] = await Promise.all([getSettings(), getLatestRate()])
  const now = new Date()
  const order = await loadPayableOrder(prisma, userId, orderId)
  assertCanPay(order, userId, now)

  // Tope de pedidos pagados sin retirar: solo se comprueba aquí (8.5).
  const paidCount = await prisma.order.count({ where: { customerId: userId, status: 'PAID' } })
  if (paidCount >= settings.maxPaidUnscannedOrders) {
    throw new AppError(
      'PAID_LIMIT_REACHED',
      `Ya tienes ${paidCount} pedidos pagados sin retirar. Retira alguno para poder pagar otro.`,
      409,
    )
  }

  const { totalCents } = priceOrder(order)
  if (totalCents === 0) {
    return {
      isFree: true as const,
      totalCents,
      totalBsCents: 0,
      rateHundredths: rate?.rateHundredths ?? null,
      payment: null,
    }
  }

  if (!rate) {
    throw new AppError(
      'RATE_UNAVAILABLE',
      'Aún no hay una tasa del BCV disponible. Intenta de nuevo en unos minutos.',
      503,
    )
  }
  if (!settings.paymentDocNumber || !settings.paymentPhone) {
    throw new AppError(
      'PAYMENT_NOT_CONFIGURED',
      'El local aún no configuró sus datos de cobro. Avisa en el mostrador.',
      409,
    )
  }

  const totalBsCents = usdToBsCents(totalCents, rate.rateHundredths)
  const bankName =
    (await getBanks()).find((b) => b.code === settings.paymentBankCode)?.name ??
    settings.paymentBankCode
  return {
    isFree: false as const,
    totalCents,
    totalBsCents,
    rateHundredths: rate.rateHundredths,
    payment: {
      bank: `${settings.paymentBankCode} - ${bankName}`,
      document: formatPaymentDoc(settings.paymentDocType, settings.paymentDocNumber),
      phone: formatPhone(settings.paymentPhone),
      amountBsCents: totalBsCents,
      clipboardText: buildPaymentText({
        bankCode: settings.paymentBankCode,
        bankName,
        docType: settings.paymentDocType,
        docNumber: settings.paymentDocNumber,
        phone: settings.paymentPhone,
        amountBsCents: totalBsCents,
      }),
    },
  }
}

// Paso 3 de 8.6: envía la referencia. Congela precios, monto y tasa, y pasa a IN_VERIFICATION.
export async function submitPayment(
  userId: string,
  orderId: string,
  input: { reference: string; bankCode: string },
) {
  const [settings, rate, banks] = await Promise.all([getSettings(), getLatestRate(), getBanks()])
  if (!banks.some((b) => b.code === input.bankCode)) {
    throw new AppError('INVALID_BANK', 'Elige un banco de la lista.', 400)
  }

  try {
    const now = new Date()
    const result = await withCustomerLock(userId, async (tx) => {
      const order = await loadPayableOrder(tx, userId, orderId)
      assertCanPay(order, userId, now)

      const { lines, totalCents } = priceOrder(order)
      if (totalCents === 0) {
        throw new AppError(
          'NOTHING_TO_PAY',
          'Este pedido no tiene nada que pagar: confírmalo.',
          409,
        )
      }
      if (!rate) {
        throw new AppError(
          'RATE_UNAVAILABLE',
          'Aún no hay una tasa del BCV disponible. Intenta de nuevo en unos minutos.',
          503,
        )
      }

      // Límite de envíos por minuto, contados en PaymentSubmission.
      const recent = await tx.paymentSubmission.count({
        where: { customerId: userId, submittedAt: { gte: new Date(now.getTime() - 60_000) } },
      })
      if (recent >= settings.referenceSubmissionsPerMinute) {
        throw new AppError(
          'TOO_MANY_SUBMISSIONS',
          'Hiciste demasiados envíos en poco tiempo. Espera un minuto e intenta de nuevo.',
          429,
        )
      }

      // Unicidad banco + referencia, ignorando los rechazados (el índice parcial lo garantiza también).
      const duplicate = await tx.paymentSubmission.findFirst({
        where: {
          bankCode: input.bankCode,
          reference: input.reference,
          status: { not: 'REJECTED' },
        },
        select: { id: true },
      })
      if (duplicate) throw duplicateReference()

      const amountBsCents = usdToBsCents(totalCents, rate.rateHundredths)
      await freezeItems(tx, lines)
      const moved = await tx.order.updateMany({
        where: { id: orderId, status: 'CREATED' },
        data: {
          status: 'IN_VERIFICATION',
          everSubmitted: true,
          expiresAt: null,
          totalCents,
          amountBsCents,
          bcvRateHundredths: rate.rateHundredths,
        },
      })
      if (moved.count === 0) {
        throw new AppError(
          'CHECKOUT_NOT_PAYABLE',
          'Este checkout ya no está disponible para pagar.',
          409,
        )
      }
      await tx.paymentSubmission.create({
        data: {
          orderId,
          customerId: userId,
          reference: input.reference,
          bankCode: input.bankCode,
          amountBsCents,
          totalCents,
        },
      })
      return { order, lines, totalCents, amountBsCents }
    })

    const byId = new Map(result.lines.map((l) => [l.id, l]))
    return toCheckoutDto(
      {
        ...result.order,
        status: 'IN_VERIFICATION',
        everSubmitted: true,
        expiresAt: null,
        totalCents: result.totalCents,
        amountBsCents: result.amountBsCents,
        bcvRateHundredths: rate?.rateHundredths ?? null,
        items: result.order.items.map((item) => ({ ...item, ...byId.get(item.id) })),
      },
      rate,
    )
  } catch (error) {
    // Dos envíos simultáneos con la misma referencia: gana uno y el otro choca con el índice único.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw duplicateReference()
    }
    throw error
  }
}

const duplicateReference = () =>
  new AppError('DUPLICATE_REFERENCE', 'Esa referencia ya fue registrada', 409)

// Total $0,00 (todas las líneas cubiertas por cupones de producto gratis): pasa directo a PAID (8.6).
export async function confirmFree(userId: string, orderId: string) {
  const rate = await getLatestRate()
  const now = new Date()
  await withCustomerLock(userId, async (tx) => {
    const order = await loadPayableOrder(tx, userId, orderId)
    assertCanPay(order, userId, now)

    const { lines, totalCents } = priceOrder(order)
    if (totalCents !== 0) {
      throw new AppError('NOT_FREE', 'Este pedido tiene un monto por pagar.', 409)
    }

    await freezeItems(tx, lines)
    const pickupCode = await uniquePickupCode(tx)
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: 'CREATED' },
      data: {
        status: 'PAID',
        paidAt: now,
        expiresAt: null,
        totalCents: 0,
        amountBsCents: 0,
        bcvRateHundredths: rate?.rateHundredths ?? null,
        pointsEarned: 0,
        rejectionStreak: 0,
        pickupCode,
        qrToken: newQrToken(),
      },
    })
    if (moved.count === 0) {
      throw new AppError(
        'CHECKOUT_NOT_PAYABLE',
        'Este checkout ya no está disponible para pagar.',
        409,
      )
    }
    const couponIds = order.items.flatMap((i) => (i.couponId ? [i.couponId] : []))
    if (couponIds.length > 0) {
      await tx.coupon.updateMany({
        where: { id: { in: couponIds }, status: 'RESERVED' },
        data: { status: 'USED', usedAt: now },
      })
    }
  })
}
