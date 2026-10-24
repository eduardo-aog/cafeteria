import type { Coupon, Reward } from '@/lib/types'

// «50 % de descuento en un producto» o «Latte gratis».
export function describeReward(reward: Pick<Reward, 'type' | 'percent' | 'productName'>): string {
  return reward.type === 'PERCENT_DISCOUNT'
    ? `${reward.percent} % de descuento en un producto`
    : `${reward.productName ?? 'Producto'} gratis`
}

// Qué descuenta un cupón al aplicarlo.
export function describeCoupon(coupon: Pick<Coupon, 'type' | 'percent' | 'productName'>): string {
  return coupon.type === 'PERCENT_DISCOUNT'
    ? `${coupon.percent} % de descuento en un producto`
    : `${coupon.productName ?? 'Producto'} gratis`
}

// «hoy», «mañana» o «en 8 días» (el servidor ya cuenta los días en hora de Caracas).
export function describeDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return 'vence hoy'
  if (daysLeft === 1) return 'vence mañana'
  return `vence en ${daysLeft} días`
}
