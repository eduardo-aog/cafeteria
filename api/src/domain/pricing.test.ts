import { describe, expect, it } from 'vitest'
import { priceLine } from './pricing.js'

describe('priceLine', () => {
  it('sin cupón: precio por cantidad y sin descuento', () => {
    expect(priceLine(400, 3, null)).toEqual({
      unitPriceCents: 400,
      discountCents: 0,
      lineTotalCents: 1200,
    })
  })

  it('50 % de 375 → descuento 188 y total 187', () => {
    const line = priceLine(375, 1, { type: 'PERCENT_DISCOUNT', percent: 50 })
    expect(line.discountCents).toBe(188)
    expect(line.lineTotalCents).toBe(187)
  })

  it('producto gratis → total 0', () => {
    expect(priceLine(400, 1, { type: 'FREE_PRODUCT', percent: null })).toEqual({
      unitPriceCents: 400,
      discountCents: 400,
      lineTotalCents: 0,
    })
  })

  it('100 % deja la línea en 0', () => {
    expect(priceLine(250, 1, { type: 'PERCENT_DISCOUNT', percent: 100 }).lineTotalCents).toBe(0)
  })
})
