import { DateTime } from 'luxon'

const ZONE = 'America/Caracas'

// Formato venezolano (6.1): punto para miles y coma para decimales. No se usa Intl (varía entre navegadores).
function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(Math.round(cents))
  const units = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}${units},${String(abs % 100).padStart(2, '0')}`
}

export function formatUsd(cents: number): string {
  const text = formatCents(cents)
  return text.startsWith('-') ? `-$${text.slice(1)}` : `$${text}`
}

export function formatBs(cents: number): string {
  return `Bs ${formatCents(cents)}`
}

// Para rellenar un campo editable: sin separador de miles ("4,50").
export function formatDecimal(cents: number): string {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`
}

// Lo que escribe una persona ("4", "4,5", "4.50", "1.250,50") → centavos enteros; null si no es válido.
export function parseUsdToCents(input: string): number | null {
  const text = input.trim().replace(/^\$\s*/, '')
  let parts: string[]
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) parts = text.replace(/\./g, '').split(',')
  else if (/^\d+([.,]\d{1,2})?$/.test(text)) parts = text.split(/[.,]/)
  else return null
  return Number(parts[0]) * 100 + Number((parts[1] ?? '').padEnd(2, '0'))
}

const toCaracas = (value: Date | string) =>
  (typeof value === 'string' ? DateTime.fromISO(value) : DateTime.fromJSDate(value)).setZone(ZONE)

// 23/10/2026
export function formatDate(value: Date | string): string {
  return toCaracas(value).toFormat('dd/MM/yyyy')
}

// 23/10
export function formatShortDate(isoDate: string): string {
  return DateTime.fromISO(isoDate, { zone: 'utc' }).toFormat('dd/MM')
}

// "08:00" → "8:00 a. m."; "20:00" → "8:00 p. m."
export function formatClock(time: string): string {
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  const suffix = hour < 12 ? 'a. m.' : 'p. m.'
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`
}

// 3:45 p. m. (hora de Caracas)
export function formatTime(value: Date | string): string {
  const local = toCaracas(value)
  return formatClock(local.toFormat('HH:mm'))
}

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

// "hoy a las 8:00 a. m.", "mañana a las 8:00 a. m.", "el lunes a las 8:00 a. m."
export function describeOpening(nextOpening: string, now: Date = new Date()): string {
  const opening = toCaracas(nextOpening)
  const days = Math.round(opening.startOf('day').diff(toCaracas(now).startOf('day'), 'days').days)
  const when = days <= 0 ? 'hoy' : days === 1 ? 'mañana' : `el ${WEEKDAYS[opening.weekday - 1]}`
  return `${when} a las ${formatTime(nextOpening)}`
}
