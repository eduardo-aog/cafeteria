import type { Bank } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { TtlCache } from '../lib/ttlCache.js'

// La lista de bancos es fija (8.6.1): se guarda 1 hora en memoria.
const cache = new TtlCache<'banks', Bank[]>(3_600_000)

export async function getBanks(): Promise<Bank[]> {
  return (
    (await cache.getOrLoad('banks', () => prisma.bank.findMany({ orderBy: { code: 'asc' } }))) ?? []
  )
}
