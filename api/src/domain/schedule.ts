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
