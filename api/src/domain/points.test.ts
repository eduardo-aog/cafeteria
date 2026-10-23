import { describe, expect, it } from 'vitest'
import { pointsFor } from './points.js'

describe('pointsFor', () => {
  it('con 100 puntos por dólar, los puntos son los centavos pagados', () => {
    expect(pointsFor(399, 100)).toBe(399)
  })

  it('redondea hacia abajo', () => {
    expect(pointsFor(399, 1)).toBe(3)
  })

  it('un total de $0 no da puntos', () => {
    expect(pointsFor(0, 100)).toBe(0)
  })
})
