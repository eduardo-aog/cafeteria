import { prisma } from '../lib/prisma.js'

// Tasa vigente: la última guardada. Null si nunca se ha guardado ninguna.
export async function getLatestRate() {
  return prisma.exchangeRate.findFirst({ orderBy: { fetchedAt: 'desc' } })
}
