import { DateTime } from 'luxon'
import { z } from 'zod'
import { STORE_ZONE } from './schedule.js'

const ratesSchema = z.array(
  z.looseObject({
    iso4217: z.string(),
    price: z.number().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
)

export interface BcvRate {
  rateHundredths: number
  bcvDate: string // YYYY-MM-DD, la fecha que informa la API
}

// Toma el elemento USD, redondea el precio a 2 decimales y lo guarda en centésimas (8.4).
// Si la respuesta no cumple el formato se lanza un error y se trata como fallo.
export function parseBcvResponse(body: unknown): BcvRate {
  const rates = ratesSchema.parse(body)
  const usd = rates.find((r) => r.iso4217 === 'USD')
  if (!usd) throw new Error('La respuesta del BCV no incluye el dólar (USD).')
  return { rateHundredths: Math.round(usd.price * 100), bcvDate: usd.date }
}

// Al arrancar se consulta si no hay tasa o la última es anterior a las 8:00 a. m. de hoy en Caracas.
export function isRateStale(lastFetchedAt: Date | null, now: Date): boolean {
  if (!lastFetchedAt) return true
  const today8am = DateTime.fromJSDate(now, { zone: STORE_ZONE }).set({
    hour: 8,
    minute: 0,
    second: 0,
    millisecond: 0,
  })
  return lastFetchedAt.getTime() < today8am.toMillis()
}
