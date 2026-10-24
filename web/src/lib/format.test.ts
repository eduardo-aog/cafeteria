import { describe, expect, it } from 'vitest'
import {
  describeOpening,
  formatBs,
  formatClock,
  formatDate,
  formatDecimal,
  formatRemaining,
  formatShortDate,
  formatTime,
  formatUsd,
  parseUsdToCents,
} from './format'

describe('formatUsd / formatBs', () => {
  it('formatea dólares con formato venezolano', () => {
    expect(formatUsd(125050)).toBe('$1.250,50')
    expect(formatUsd(400)).toBe('$4,00')
  })

  it('formatea bolívares', () => {
    expect(formatBs(354492)).toBe('Bs 3.544,92')
    expect(formatBs(5)).toBe('Bs 0,05')
  })

  it('formatDecimal no usa separador de miles', () => {
    expect(formatDecimal(125050)).toBe('1250,50')
    expect(formatDecimal(400)).toBe('4,00')
  })
})

describe('parseUsdToCents', () => {
  it('acepta coma o punto decimal', () => {
    expect(parseUsdToCents('4')).toBe(400)
    expect(parseUsdToCents('4,5')).toBe(450)
    expect(parseUsdToCents('4.50')).toBe(450)
    expect(parseUsdToCents('$ 3,75')).toBe(375)
  })

  it('acepta el formato con punto de miles', () => {
    expect(parseUsdToCents('1.250,50')).toBe(125050)
    expect(parseUsdToCents('1.250')).toBe(125000)
  })

  it('rechaza lo que no es un monto', () => {
    expect(parseUsdToCents('')).toBeNull()
    expect(parseUsdToCents('abc')).toBeNull()
    expect(parseUsdToCents('4,555')).toBeNull()
    expect(parseUsdToCents('-4')).toBeNull()
    expect(parseUsdToCents('4,5,6')).toBeNull()
  })
})

describe('fechas y horas', () => {
  it('formatea la fecha en hora de Caracas', () => {
    expect(formatDate(new Date('2026-10-23T15:45:00Z'))).toBe('23/10/2026')
    // 01:00 UTC del 24 sigue siendo 23 en Caracas (UTC-4)
    expect(formatDate('2026-10-24T01:00:00Z')).toBe('23/10/2026')
  })

  it('formatea la hora como 3:45 p. m.', () => {
    expect(formatTime(new Date('2026-10-23T19:45:00Z'))).toBe('3:45 p. m.')
    expect(formatTime('2026-10-23T12:00:00Z')).toBe('8:00 a. m.')
  })

  it('formatClock cubre medianoche y mediodía', () => {
    expect(formatClock('00:05')).toBe('12:05 a. m.')
    expect(formatClock('12:00')).toBe('12:00 p. m.')
    expect(formatClock('20:00')).toBe('8:00 p. m.')
  })

  it('formatShortDate muestra día y mes', () => {
    expect(formatShortDate('2026-10-27')).toBe('27/10')
  })
})

describe('describeOpening', () => {
  const opening = '2026-10-26T12:00:00Z' // lunes 8:00 a. m. en Caracas

  it('hoy, mañana o el día de la semana', () => {
    expect(describeOpening(opening, new Date('2026-10-26T09:00:00Z'))).toBe('hoy a las 8:00 a. m.')
    expect(describeOpening(opening, new Date('2026-10-25T15:00:00Z'))).toBe(
      'mañana a las 8:00 a. m.',
    )
    expect(describeOpening(opening, new Date('2026-10-24T22:00:00Z'))).toBe(
      'el lunes a las 8:00 a. m.',
    )
  })
})

describe('formatRemaining', () => {
  const now = new Date('2026-10-23T15:00:00Z')

  it('horas y minutos', () => {
    expect(formatRemaining('2026-10-24T14:59:00Z', now)).toBe('23 h 59 min')
    expect(formatRemaining('2026-10-23T17:00:00Z', now)).toBe('2 h')
  })

  it('menos de una hora', () => {
    expect(formatRemaining('2026-10-23T15:45:00Z', now)).toBe('45 min')
  })

  it('redondea hacia arriba y no muestra negativos', () => {
    expect(formatRemaining('2026-10-23T15:00:10Z', now)).toBe('1 min')
    expect(formatRemaining('2026-10-23T14:59:00Z', now)).toBe('unos segundos')
  })
})
