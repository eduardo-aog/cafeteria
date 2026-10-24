import { describe, expect, it } from 'vitest'
import { bucketDemand, resolvePeriod, summarizeSales } from './reports.js'

// Viernes 23 de octubre de 2026, 15:00 en Caracas (19:00 UTC).
const now = new Date('2026-10-23T19:00:00Z')

describe('resolvePeriod', () => {
  it('hoy: de las 00:00 de Caracas (04:00 UTC) a las 00:00 del día siguiente', () => {
    const { start, end } = resolvePeriod('today', now)
    expect(start.toISOString()).toBe('2026-10-23T04:00:00.000Z')
    expect(end.toISOString()).toBe('2026-10-24T04:00:00.000Z')
  })

  it('a las 21:00 de Caracas (01:00 UTC del 24) sigue siendo el día 23', () => {
    const { start } = resolvePeriod('today', new Date('2026-10-24T01:00:00Z'))
    expect(start.toISOString()).toBe('2026-10-23T04:00:00.000Z')
  })

  it('la semana va de lunes a domingo', () => {
    const { start, end } = resolvePeriod('week', now)
    expect(start.toISOString()).toBe('2026-10-19T04:00:00.000Z') // lunes 19
    expect(end.toISOString()).toBe('2026-10-26T04:00:00.000Z') // lunes 26
  })

  it('el domingo todavía es de la misma semana', () => {
    const { start } = resolvePeriod('week', new Date('2026-10-25T20:00:00Z'))
    expect(start.toISOString()).toBe('2026-10-19T04:00:00.000Z')
  })

  it('el mes', () => {
    const { start, end } = resolvePeriod('month', now)
    expect(start.toISOString()).toBe('2026-10-01T04:00:00.000Z')
    expect(end.toISOString()).toBe('2026-11-01T04:00:00.000Z')
  })

  it('rango personalizado: incluye el día «hasta» completo', () => {
    const { start, end } = resolvePeriod('custom', now, { from: '2026-10-01', to: '2026-10-03' })
    expect(start.toISOString()).toBe('2026-10-01T04:00:00.000Z')
    expect(end.toISOString()).toBe('2026-10-04T04:00:00.000Z')
  })

  it('rechaza rangos inválidos', () => {
    expect(() => resolvePeriod('custom', now)).toThrow(RangeError)
    expect(() => resolvePeriod('custom', now, { from: '2026-10-05', to: '2026-10-01' })).toThrow(
      RangeError,
    )
    expect(() => resolvePeriod('custom', now, { from: 'hola', to: '2026-10-01' })).toThrow(
      RangeError,
    )
    expect(() => resolvePeriod('custom', now, { from: '2024-01-01', to: '2026-01-01' })).toThrow(
      RangeError,
    )
  })
})

describe('bucketDemand', () => {
  it('agrupa por hora y día de la semana de Caracas', () => {
    const { byHour, byWeekday } = bucketDemand([
      new Date('2026-10-23T16:30:00Z'), // viernes 12:30
      new Date('2026-10-23T16:59:00Z'), // viernes 12:59
      new Date('2026-10-24T01:30:00Z'), // viernes 21:30 (aún viernes en Caracas)
      new Date('2026-10-24T13:00:00Z'), // sábado 09:00
    ])
    expect(byHour[12]).toBe(2)
    expect(byHour[21]).toBe(1)
    expect(byHour[9]).toBe(1)
    expect(byWeekday).toEqual([0, 0, 0, 0, 3, 1, 0]) // lunes … domingo
    expect(byHour).toHaveLength(24)
  })

  it('la medianoche UTC cae en la tarde-noche del día anterior', () => {
    const { byHour, byWeekday } = bucketDemand([new Date('2026-10-26T00:30:00Z')]) // domingo 20:30
    expect(byHour[20]).toBe(1)
    expect(byWeekday[6]).toBe(1)
  })
})

describe('summarizeSales', () => {
  const products = new Map([
    ['latte', { name: 'Latte', category: 'CAFE' }],
    ['moca', { name: 'Moca', category: 'CAFE' }],
    ['brownie', { name: 'Brownie', category: 'POSTRES' }],
  ])
  const at = new Date('2026-10-23T16:00:00Z')

  it('suma montos congelados, unidades por producto y por categoría', () => {
    const summary = summarizeSales(
      [
        {
          paidAt: at,
          totalCents: 1100,
          amountBsCents: 976030,
          items: [
            { productId: 'latte', quantity: 2, lineTotalCents: 800 },
            { productId: 'brownie', quantity: 1, lineTotalCents: 300 },
          ],
        },
        {
          paidAt: at,
          totalCents: 400,
          amountBsCents: 354920,
          items: [{ productId: 'latte', quantity: 1, lineTotalCents: 400 }],
        },
      ],
      products,
    )
    expect(summary.totals).toEqual({ orders: 2, totalCents: 1500, totalBsCents: 1330950 })
    expect(summary.byProduct.map((p) => [p.name, p.units, p.amountCents])).toEqual([
      ['Latte', 3, 1200],
      ['Brownie', 1, 300],
    ])
    expect(summary.byCategory).toEqual([
      { category: 'CAFE', units: 3, amountCents: 1200 },
      { category: 'POSTRES', units: 1, amountCents: 300 },
    ])
  })

  it('el top 10 se corta en 10 y ordena por unidades', () => {
    const many = new Map(
      Array.from({ length: 12 }, (_, i) => [`p${i}`, { name: `P${i}`, category: 'CAFE' }]),
    )
    const items = Array.from({ length: 12 }, (_, i) => ({
      productId: `p${i}`,
      quantity: i + 1,
      lineTotalCents: 100,
    }))
    const summary = summarizeSales(
      [{ paidAt: at, totalCents: 1200, amountBsCents: 1, items }],
      many,
    )
    expect(summary.topProducts).toHaveLength(10)
    expect(summary.topProducts[0]!.name).toBe('P11')
  })

  it('sin ventas todo es cero', () => {
    const summary = summarizeSales([], products)
    expect(summary.totals).toEqual({ orders: 0, totalCents: 0, totalBsCents: 0 })
    expect(summary.byProduct).toEqual([])
  })
})
