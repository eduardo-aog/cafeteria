import type { ExchangeRate } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { TtlCache } from '../lib/ttlCache.js'

// La tasa solo cambia una vez al día: se guarda 1 minuto en memoria y se invalida al guardar una nueva.
const cache = new TtlCache<'rate', ExchangeRate>(60_000)

// Tasa vigente: la última guardada. Null si nunca se ha guardado ninguna (y entonces no se cachea).
export function getLatestRate(): Promise<ExchangeRate | null> {
  return cache.getOrLoad('rate', () =>
    prisma.exchangeRate.findFirst({ orderBy: { fetchedAt: 'desc' } }),
  )
}

export const invalidateRate = () => cache.clear()
