import { DateTime } from 'luxon'
import { STORE_ZONE } from './schedule.js'

// Último instante del mes actual en Caracas (el Date se guarda en UTC).
export function endOfMonthCaracas(now: Date): Date {
  return DateTime.fromJSDate(now, { zone: STORE_ZONE }).endOf('month').toJSDate()
}

// Días naturales (en Caracas) que faltan hasta el vencimiento; 0 el último día, nunca negativo.
export function daysUntil(expiresAt: Date, now: Date): number {
  const end = DateTime.fromJSDate(expiresAt, { zone: STORE_ZONE }).startOf('day')
  const start = DateTime.fromJSDate(now, { zone: STORE_ZONE }).startOf('day')
  return Math.max(0, Math.round(end.diff(start, 'days').days))
}

interface CouponLike {
  type: 'PERCENT_DISCOUNT' | 'FREE_PRODUCT'
  productId: string | null
  status: 'AVAILABLE' | 'RESERVED' | 'USED' | 'EXPIRED'
  expiresAt: Date
}

// Aplicable en la pantalla de un producto (8.9): disponible, no vencido y, si es de producto gratis, del mismo producto.
export function isCouponApplicable(
  coupon: CouponLike,
  product: { id: string },
  now: Date = new Date(),
): boolean {
  if (coupon.status !== 'AVAILABLE' || coupon.expiresAt.getTime() <= now.getTime()) return false
  if (coupon.type === 'PERCENT_DISCOUNT') return true
  return coupon.productId === product.id
}
