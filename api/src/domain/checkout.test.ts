import { describe, expect, it } from 'vitest'
import { checkoutExpiry, exceedsProductLimit } from './checkout.js'

describe('checkoutExpiry', () => {
  it('suma las horas del plazo', () => {
    const now = new Date('2026-10-23T15:00:00Z')
    expect(checkoutExpiry(now, 24).toISOString()).toBe('2026-10-24T15:00:00.000Z')
  })
})

describe('exceedsProductLimit', () => {
  it('permite llegar exactamente al tope', () => {
    expect(exceedsProductLimit(7, 3, 10)).toBe(false)
  })

  it('rechaza pasar del tope sumando lo que ya hay', () => {
    expect(exceedsProductLimit(10, 1, 10)).toBe(true)
    expect(exceedsProductLimit(8, 3, 10)).toBe(true)
  })
})
