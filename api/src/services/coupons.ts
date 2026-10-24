import { Prisma, type Coupon, type PrismaClient, type Product } from '@prisma/client'
import { daysUntil, isCouponApplicable, isExpiringSoon } from '../domain/coupons.js'
import { prisma } from '../lib/prisma.js'

type Db = Prisma.TransactionClient | PrismaClient

// AVAILABLE con la fecha vencida → EXPIRED (8.9). Solo vence los AVAILABLE: un cupón RESERVED en un checkout
// sigue siendo válido aunque pase fin de mes. Idempotente. La usan la tarea de cada 5 minutos y las
// lecturas del cliente (de forma perezosa); sin `userId` aplica a todos.
export async function expireStaleCoupons(db: Db, userId?: string): Promise<number> {
  const result = await db.coupon.updateMany({
    where: { status: 'AVAILABLE', expiresAt: { lt: new Date() }, ...(userId && { userId }) },
    data: { status: 'EXPIRED' },
  })
  return result.count
}

// Libera cupones RESERVED al quitar la línea, cancelar o expirar un checkout (8.9): vuelven a AVAILABLE o,
// si ya pasó su fecha, a EXPIRED. Una sola sentencia; los cupones en otro estado no se tocan.
export async function releaseCoupons(db: Db, couponIds: string[]): Promise<void> {
  if (couponIds.length === 0) return
  await db.$executeRaw`
    UPDATE "Coupon"
    SET "status" = (CASE WHEN "expiresAt" < (now() AT TIME ZONE 'UTC') THEN 'EXPIRED' ELSE 'AVAILABLE' END)::"CouponStatus"
    WHERE "status" = 'RESERVED' AND "id" = ANY(${couponIds}::uuid[])`
}

// Lo mismo para todos los cupones de las líneas de esos pedidos (cancelados o expirados).
export async function releaseCouponsOfOrders(db: Db, orderIds: string[]): Promise<void> {
  if (orderIds.length === 0) return
  await db.$executeRaw`
    UPDATE "Coupon" AS c
    SET "status" = (CASE WHEN c."expiresAt" < (now() AT TIME ZONE 'UTC') THEN 'EXPIRED' ELSE 'AVAILABLE' END)::"CouponStatus"
    FROM "OrderItem" AS i
    WHERE i."couponId" = c."id" AND i."orderId" = ANY(${orderIds}::uuid[]) AND c."status" = 'RESERVED'`
}

type CouponWithProduct = Coupon & { product: Product | null }

// Un cupón de producto gratis cuyo producto se dio de baja queda no utilizable hasta su vencimiento (8.9).
export function toCouponDto(coupon: CouponWithProduct, now: Date) {
  const isUsable =
    coupon.status === 'AVAILABLE' &&
    (coupon.type === 'PERCENT_DISCOUNT' || (coupon.product?.isActive ?? false))
  return {
    id: coupon.id,
    title: coupon.title,
    type: coupon.type,
    percent: coupon.percent,
    productId: coupon.productId,
    productName: coupon.product?.name ?? null,
    status: coupon.status,
    expiresAt: coupon.expiresAt,
    usedAt: coupon.usedAt,
    daysLeft: daysUntil(coupon.expiresAt, now),
    isUsable,
  }
}

export type CouponTab = 'available' | 'used' | 'expired'

// «Mis cupones» (8.9): disponibles (con los reservados), usados y vencidos.
export async function listCoupons(userId: string, tab: CouponTab) {
  await expireStaleCoupons(prisma, userId)
  const where: Prisma.CouponWhereInput =
    tab === 'available'
      ? { userId, status: { in: ['AVAILABLE', 'RESERVED'] } }
      : { userId, status: tab === 'used' ? 'USED' : 'EXPIRED' }
  const coupons = await prisma.coupon.findMany({
    where,
    include: { product: true },
    orderBy:
      tab === 'available'
        ? { expiresAt: 'asc' }
        : tab === 'used'
          ? { usedAt: 'desc' }
          : { expiresAt: 'desc' },
    relationLoadStrategy: 'join',
  })
  const now = new Date()
  return coupons.map((c) => toCouponDto(c, now))
}

// Cupones aplicables a un producto (8.9): los suyos AVAILABLE y sin vencer, de porcentaje o de ese producto.
export async function couponsForProduct(userId: string, product: Product) {
  await expireStaleCoupons(prisma, userId)
  const coupons = await prisma.coupon.findMany({
    where: { userId, status: 'AVAILABLE' },
    include: { product: true },
    orderBy: { expiresAt: 'asc' },
    relationLoadStrategy: 'join',
  })
  const now = new Date()
  return coupons
    .filter((c) => isCouponApplicable(c, product, now) && toCouponDto(c, now).isUsable)
    .map((c) => toCouponDto(c, now))
}

// Vista previa del vencimiento de un cupón canjeado ahora, para el aviso antes de confirmar (8.9).
export function expiryPreview(expiresAt: Date, now: Date) {
  const daysLeft = daysUntil(expiresAt, now)
  return { expiresAt, daysLeft, isExpiringSoon: isExpiringSoon(daysLeft) }
}
