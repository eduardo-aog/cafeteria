import { DateTime } from 'luxon'

export const STORE_ZONE = 'America/Caracas'

export interface ScheduleSettings {
  openDays: number[] // 1 = lunes … 7 = domingo (ISO, como Luxon)
  openTime: string // "HH:mm"
  closeTime: string // "HH:mm"
}

// Abierto si el día ISO está en openDays y openTime <= hora actual < closeTime (hora de Caracas).
export function isStoreOpen(now: Date, settings: ScheduleSettings): boolean {
  const local = DateTime.fromJSDate(now, { zone: STORE_ZONE })
  if (!settings.openDays.includes(local.weekday)) return false
  const time = local.toFormat('HH:mm')
  return settings.openTime <= time && time < settings.closeTime
}

// Próxima apertura estrictamente posterior a `now`; null si no hay días abiertos.
export function nextOpening(now: Date, settings: ScheduleSettings): Date | null {
  const [hour, minute] = settings.openTime.split(':').map(Number)
  const local = DateTime.fromJSDate(now, { zone: STORE_ZONE })
  for (let offset = 0; offset <= 7; offset++) {
    const day = local.plus({ days: offset })
    if (!settings.openDays.includes(day.weekday)) continue
    const opening = day.set({ hour, minute, second: 0, millisecond: 0 })
    if (opening > local) return opening.toJSDate()
  }
  return null
}

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

// "08:00" → "8:00 a. m."; "20:00" → "8:00 p. m."
export function formatClock(time: string): string {
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'a. m.' : 'p. m.'}`
}

// "lunes a sábado de 8:00 a. m. a 8:00 p. m." (para el mensaje STORE_CLOSED, 6.3).
export function describeSchedule(settings: ScheduleSettings): string {
  const days = [...new Set(settings.openDays)].sort((a, b) => a - b)
  if (days.length === 0) return 'sin días de atención'

  // Tramos de días consecutivos: de 3 en adelante se escriben "x a y".
  const runs: number[][] = []
  for (const day of days) {
    const last = runs.at(-1)
    if (last && last.at(-1) === day - 1) last.push(day)
    else runs.push([day])
  }
  const parts = runs.flatMap((run) =>
    run.length >= 3
      ? [`${WEEKDAY_NAMES[run[0]! - 1]} a ${WEEKDAY_NAMES[run.at(-1)! - 1]}`]
      : run.map((day) => WEEKDAY_NAMES[day - 1]!),
  )
  const dayText =
    days.length === 7
      ? 'todos los días'
      : parts.length === 1
        ? parts[0]!
        : `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`
  return `${dayText} de ${formatClock(settings.openTime)} a ${formatClock(settings.closeTime)}`
}
