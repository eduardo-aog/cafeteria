import { lineTotal, percentDiscount } from './money.js'

export interface LineCoupon {
  type: 'PERCENT_DISCOUNT' | 'FREE_PRODUCT'
  percent: number | null
}

// Precio de una línea (8.9). Un cupón va siempre en una línea de 1 unidad. Sin cupón no hay descuento.
// El descuento porcentual se redondea al centavo más cercano y el total de la línea nunca baja de 0.
export function priceLine(unitPriceCents: number, quantity: number, coupon: LineCoupon | null) {
  const discountCents = !coupon
    ? 0
    : coupon.type === 'FREE_PRODUCT'
      ? unitPriceCents
      : percentDiscount(unitPriceCents, coupon.percent ?? 0)
  return {
    unitPriceCents,
    discountCents,
    lineTotalCents: lineTotal(unitPriceCents * quantity, discountCents),
  }
}
