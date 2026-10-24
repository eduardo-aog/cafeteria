import { describe, expect, it } from 'vitest'
import { describeCoupon, describeDaysLeft, describeReward } from './rewards'

describe('describeReward y describeCoupon', () => {
  it('descuento porcentual', () => {
    expect(describeReward({ type: 'PERCENT_DISCOUNT', percent: 50, productName: null })).toBe(
      '50 % de descuento en un producto',
    )
    expect(describeCoupon({ type: 'PERCENT_DISCOUNT', percent: 20, productName: null })).toBe(
      '20 % de descuento en un producto',
    )
  })

  it('producto gratis', () => {
    expect(describeReward({ type: 'FREE_PRODUCT', percent: null, productName: 'Latte' })).toBe(
      'Latte gratis',
    )
  })
})

describe('describeDaysLeft', () => {
  it('hoy, mañana y varios días', () => {
    expect(describeDaysLeft(0)).toBe('vence hoy')
    expect(describeDaysLeft(1)).toBe('vence mañana')
    expect(describeDaysLeft(8)).toBe('vence en 8 días')
  })
})
