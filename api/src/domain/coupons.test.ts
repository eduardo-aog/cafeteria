import { describe, expect, it } from 'vitest'
import { daysUntil, endOfMonthCaracas, isCouponApplicable, isExpiringSoon } from './coupons.js'

const now = new Date('2026-10-23T15:00:00Z')

describe('endOfMonthCaracas', () => {
  it('el fin de octubre en Caracas es el 1 de noviembre 03:59:59.999 UTC', () => {
    expect(endOfMonthCaracas(now).toISOString()).toBe('2026-11-01T03:59:59.999Z')
  })

  it('a las 21:00 del 31 en Caracas (01:00 UTC del 1) sigue siendo octubre', () => {
    expect(endOfMonthCaracas(new Date('2026-11-01T01:00:00Z')).toISOString()).toBe(
      '2026-11-01T03:59:59.999Z',
    )
  })
})

describe('daysUntil', () => {
  const expiresAt = endOfMonthCaracas(now)

  it('cuenta los días naturales hasta el vencimiento', () => {
    expect(daysUntil(expiresAt, now)).toBe(8)
    expect(daysUntil(expiresAt, new Date('2026-10-27T15:00:00Z'))).toBe(4)
  })

  it('el último día quedan 0 y después nunca es negativo', () => {
    expect(daysUntil(expiresAt, new Date('2026-10-31T15:00:00Z'))).toBe(0)
    expect(daysUntil(expiresAt, new Date('2026-11-05T15:00:00Z'))).toBe(0)
  })
})

describe('isCouponApplicable', () => {
  const future = new Date('2026-10-31T00:00:00Z')
  const base = { status: 'AVAILABLE', expiresAt: future } as const
  const latte = { id: 'latte' }

  it('el descuento porcentual aplica a cualquier producto', () => {
    const coupon = { ...base, type: 'PERCENT_DISCOUNT', productId: null } as const
    expect(isCouponApplicable(coupon, latte, now)).toBe(true)
  })

  it('el producto gratis solo aplica a su producto', () => {
    const coupon = { ...base, type: 'FREE_PRODUCT', productId: 'latte' } as const
    expect(isCouponApplicable(coupon, latte, now)).toBe(true)
    expect(isCouponApplicable(coupon, { id: 'moca' }, now)).toBe(false)
  })

  it('no aplica si no está disponible o ya venció', () => {
    const pct = { ...base, type: 'PERCENT_DISCOUNT', productId: null } as const
    expect(isCouponApplicable({ ...pct, status: 'RESERVED' }, latte, now)).toBe(false)
    expect(
      isCouponApplicable({ ...pct, expiresAt: new Date('2026-10-01T00:00:00Z') }, latte, now),
    ).toBe(false)
  })
})

describe('isExpiringSoon', () => {
  it('menos de 5 días es un aviso fuerte; 5 o más, no', () => {
    expect(isExpiringSoon(0)).toBe(true)
    expect(isExpiringSoon(4)).toBe(true)
    expect(isExpiringSoon(5)).toBe(false)
    expect(isExpiringSoon(20)).toBe(false)
  })

  it('cerca del fin de mes (28 de octubre) quedan 3 días y el aviso es fuerte', () => {
    const expiresAt = endOfMonthCaracas(new Date('2026-10-28T15:00:00Z'))
    expect(isExpiringSoon(daysUntil(expiresAt, new Date('2026-10-28T15:00:00Z')))).toBe(true)
    expect(isExpiringSoon(daysUntil(expiresAt, new Date('2026-10-10T15:00:00Z')))).toBe(false)
  })
})
