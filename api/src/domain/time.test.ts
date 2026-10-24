import { describe, expect, it } from 'vitest'
import { isTodayCaracas, startOfTodayCaracas } from './time.js'

describe('startOfTodayCaracas', () => {
  it('el día empieza a las 04:00 UTC (Caracas es UTC-4)', () => {
    expect(startOfTodayCaracas(new Date('2026-10-23T15:00:00Z')).toISOString()).toBe(
      '2026-10-23T04:00:00.000Z',
    )
  })

  it('a las 02:00 UTC todavía es el día anterior en Caracas', () => {
    expect(startOfTodayCaracas(new Date('2026-10-24T02:00:00Z')).toISOString()).toBe(
      '2026-10-23T04:00:00.000Z',
    )
  })
})

describe('isTodayCaracas', () => {
  const now = new Date('2026-10-23T15:00:00Z')

  it('hoy sí, ayer no', () => {
    expect(isTodayCaracas(new Date('2026-10-23T04:00:00Z'), now)).toBe(true)
    expect(isTodayCaracas(new Date('2026-10-23T03:59:59Z'), now)).toBe(false)
  })

  it('una entrega a las 23:30 de Caracas (03:30 UTC del día siguiente) cuenta para ese mismo día', () => {
    expect(isTodayCaracas(new Date('2026-10-24T03:30:00Z'), new Date('2026-10-24T03:45:00Z'))).toBe(
      true,
    )
  })
})
