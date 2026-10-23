import cron from 'node-cron'
import { fetchBcvRate, fetchBcvRateIfStale } from '../services/bcv.js'
import { expireStaleCheckouts } from '../services/checkoutExpiration.js'
import { prisma } from '../lib/prisma.js'

const TIMEZONE = 'America/Caracas'

export function startJobs() {
  // Todos los días a las 8:00 a. m. de Caracas (8.4).
  cron.schedule('0 8 * * *', () => void fetchBcvRate(), { timezone: TIMEZONE, name: 'bcv-rate' })

  // Cada 5 minutos: checkouts sin referencia cuyo plazo venció (8.5, 11).
  cron.schedule(
    '*/5 * * * *',
    () => {
      expireStaleCheckouts(prisma)
        .then((count) => count > 0 && console.log(`Checkouts expirados: ${count}.`))
        .catch((err: unknown) =>
          console.error(
            'No se pudieron expirar checkouts:',
            err instanceof Error ? err.message : err,
          ),
        )
    },
    { timezone: TIMEZONE, name: 'expire-checkouts' },
  )

  // Sin bloquear el arranque: el servidor responde mientras la API del BCV despierta.
  fetchBcvRateIfStale().catch((err: unknown) => {
    console.error(
      'BCV: no se pudo comprobar la tasa al arrancar:',
      err instanceof Error ? err.message : err,
    )
  })
}
