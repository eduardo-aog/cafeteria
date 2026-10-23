import { env } from '../config/env.js'
import { isRateStale, parseBcvResponse } from '../domain/bcv.js'
import { prisma } from '../lib/prisma.js'

const TIMEOUT_MS = 60_000 // la API gratuita de Render puede tardar en despertar
const RETRIES = 3
const RETRY_DELAY_MS = 60_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let inFlight: Promise<boolean> | null = null

// Consulta la tasa y la guarda. Si falla tras los reintentos, se sigue usando la última guardada.
export function fetchBcvRate(retryDelayMs = RETRY_DELAY_MS): Promise<boolean> {
  inFlight ??= run(retryDelayMs).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function run(retryDelayMs: number): Promise<boolean> {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(env.BCV_API_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const { rateHundredths, bcvDate } = parseBcvResponse(await response.json())
      await prisma.exchangeRate.create({
        data: { rateHundredths, bcvDate: new Date(`${bcvDate}T00:00:00Z`) },
      })
      console.log(`BCV: tasa guardada (${bcvDate}).`)
      return true
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'error desconocido'
      console.warn(`BCV: intento ${attempt + 1} de ${RETRIES + 1} falló: ${reason}`)
      if (attempt < RETRIES) await sleep(retryDelayMs)
    }
  }
  console.error('BCV: no se pudo actualizar la tasa; se sigue usando la última guardada.')
  return false
}

// Al arrancar: consulta solo si la última tasa es anterior a las 8:00 a. m. de hoy (Caracas).
export async function fetchBcvRateIfStale(): Promise<void> {
  const last = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: 'desc' },
    select: { fetchedAt: true },
  })
  if (isRateStale(last?.fetchedAt ?? null, new Date())) await fetchBcvRate()
}
