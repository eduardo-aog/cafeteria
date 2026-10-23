import { describe, expect, it } from 'vitest'
import { isRateStale, parseBcvResponse } from './bcv.js'

const sample = [
  { symbol: '€', iso4217: 'EUR', name: 'Euro', price: 994.03555758, date: '2026-10-27', day: 'x' },
  { symbol: '$', iso4217: 'USD', name: 'Dolar', price: 887.302, date: '2026-10-27', day: 'x' },
]

describe('parseBcvResponse', () => {
  it('toma el USD y lo guarda en centésimas', () => {
    expect(parseBcvResponse(sample)).toEqual({ rateHundredths: 88730, bcvDate: '2026-10-27' })
  })

  it('redondea a 2 decimales', () => {
    const body = [{ iso4217: 'USD', price: 886.235, date: '2026-10-23' }]
    expect(parseBcvResponse(body).rateHundredths).toBe(88624)
  })

  it('falla si no hay USD', () => {
    expect(() => parseBcvResponse([sample[0]])).toThrow()
  })

  it('falla si el formato no es el esperado', () => {
    expect(() => parseBcvResponse({ rates: [] })).toThrow()
    expect(() => parseBcvResponse([{ iso4217: 'USD', price: 'abc', date: '2026-10-27' }])).toThrow()
    expect(() => parseBcvResponse([{ iso4217: 'USD', price: 887, date: '27/10/2026' }])).toThrow()
  })
})

describe('isRateStale', () => {
  const now = new Date('2026-10-23T15:00:00Z') // 11:00 en Caracas

  it('sin tasa guardada hay que consultar', () => {
    expect(isRateStale(null, now)).toBe(true)
  })

  it('una tasa de ayer es vieja', () => {
    expect(isRateStale(new Date('2026-10-22T14:00:00Z'), now)).toBe(true)
  })

  it('una tasa de hoy a las 8:00 de Caracas (12:00 UTC) o después no lo es', () => {
    expect(isRateStale(new Date('2026-10-23T12:00:00Z'), now)).toBe(false)
    expect(isRateStale(new Date('2026-10-23T11:59:00Z'), now)).toBe(true)
  })
})
