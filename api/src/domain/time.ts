import { DateTime } from 'luxon'
import { STORE_ZONE } from './schedule.js'

// Inicio del día de hoy en Caracas, como instante UTC. «Hoy» siempre se calcula con la zona del local (6.2).
export function startOfTodayCaracas(now: Date): Date {
  return DateTime.fromJSDate(now, { zone: STORE_ZONE }).startOf('day').toJSDate()
}

// ¿Ese instante cae en el mismo día de Caracas que `now`?
export function isTodayCaracas(date: Date, now: Date): boolean {
  return date.getTime() >= startOfTodayCaracas(now).getTime() && date.getTime() <= now.getTime()
}
