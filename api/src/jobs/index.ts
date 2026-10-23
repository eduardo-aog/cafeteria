import cron from 'node-cron'
import { fetchBcvRate, fetchBcvRateIfStale } from '../services/bcv.js'

const TIMEZONE = 'America/Caracas'

export function startJobs() {
  // Todos los días a las 8:00 a. m. de Caracas (8.4).
  cron.schedule('0 8 * * *', () => void fetchBcvRate(), { timezone: TIMEZONE, name: 'bcv-rate' })

  // Sin bloquear el arranque: el servidor responde mientras la API del BCV despierta.
  fetchBcvRateIfStale().catch((err: unknown) => {
    console.error(
      'BCV: no se pudo comprobar la tasa al arrancar:',
      err instanceof Error ? err.message : err,
    )
  })
}
