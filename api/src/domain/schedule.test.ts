import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import { describeSchedule, formatTimeCaracas, isStoreOpen, nextOpening } from './schedule.js'

const settings = { openDays: [1, 2, 3, 4, 5, 6], openTime: '08:00', closeTime: '20:00' }
// Hora de Caracas (UTC-4) → Date.
const caracas = (iso: string) => DateTime.fromISO(iso, { zone: 'America/Caracas' }).toJSDate()

describe('isStoreOpen', () => {
  it('el domingo está cerrado', () => {
    expect(isStoreOpen(caracas('2026-10-25T12:00'), settings)).toBe(false)
  })

  it('el sábado a las 19:59 está abierto', () => {
    expect(isStoreOpen(caracas('2026-10-24T19:59'), settings)).toBe(true)
  })

  it('el sábado a las 20:00 está cerrado', () => {
    expect(isStoreOpen(caracas('2026-10-24T20:00'), settings)).toBe(false)
  })

  it('abre a las 8:00 y no antes', () => {
    expect(isStoreOpen(caracas('2026-10-26T07:59'), settings)).toBe(false)
    expect(isStoreOpen(caracas('2026-10-26T08:00'), settings)).toBe(true)
  })

  it('usa la hora de Caracas y no la del sistema', () => {
    // 23:30 UTC del sábado = 19:30 en Caracas: abierto.
    expect(isStoreOpen(new Date('2026-10-24T23:30:00Z'), settings)).toBe(true)
    // 00:30 UTC del domingo = 20:30 del sábado en Caracas: cerrado.
    expect(isStoreOpen(new Date('2026-10-25T00:30:00Z'), settings)).toBe(false)
  })
})

describe('nextOpening', () => {
  it('el sábado por la noche, abre el lunes a las 8:00', () => {
    const next = nextOpening(caracas('2026-10-24T21:00'), settings)
    expect(next).toEqual(caracas('2026-10-26T08:00'))
  })

  it('el domingo abre el lunes', () => {
    expect(nextOpening(caracas('2026-10-25T10:00'), settings)).toEqual(caracas('2026-10-26T08:00'))
  })

  it('antes de abrir, abre ese mismo día', () => {
    expect(nextOpening(caracas('2026-10-26T06:00'), settings)).toEqual(caracas('2026-10-26T08:00'))
  })

  it('sin días abiertos devuelve null', () => {
    expect(nextOpening(caracas('2026-10-26T06:00'), { ...settings, openDays: [] })).toBeNull()
  })
})

describe('describeSchedule', () => {
  it('lunes a sábado de 8:00 a. m. a 8:00 p. m.', () => {
    expect(describeSchedule(settings)).toBe('lunes a sábado de 8:00 a. m. a 8:00 p. m.')
  })

  it('todos los días', () => {
    const all = {
      ...settings,
      openDays: [1, 2, 3, 4, 5, 6, 7],
      openTime: '00:00',
      closeTime: '23:59',
    }
    expect(describeSchedule(all)).toBe('todos los días de 12:00 a. m. a 11:59 p. m.')
  })

  it('días sueltos y tramos cortos', () => {
    expect(describeSchedule({ ...settings, openDays: [1, 3, 5] })).toBe(
      'lunes, miércoles y viernes de 8:00 a. m. a 8:00 p. m.',
    )
    expect(describeSchedule({ ...settings, openDays: [6, 7] })).toBe(
      'sábado y domingo de 8:00 a. m. a 8:00 p. m.',
    )
    expect(describeSchedule({ ...settings, openDays: [1, 2, 3, 5, 6] })).toBe(
      'lunes a miércoles, viernes y sábado de 8:00 a. m. a 8:00 p. m.',
    )
  })

  it('sin días abiertos', () => {
    expect(describeSchedule({ ...settings, openDays: [] })).toBe('sin días de atención')
  })
})

describe('formatTimeCaracas', () => {
  it('muestra la hora de Caracas', () => {
    expect(formatTimeCaracas(new Date('2026-10-23T20:32:00Z'))).toBe('4:32 p. m.')
  })
})
