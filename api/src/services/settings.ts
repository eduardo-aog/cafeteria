import type { Settings } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { TtlCache } from '../lib/ttlCache.js'

// Settings es una fila única (id = 1) creada por el seed. Se guarda 10 s en memoria: los scripts
// dev:store-* la cambian desde otro proceso, así que el vencimiento corto la mantiene al día.
const cache = new TtlCache<'settings', Settings>(10_000)

export async function getSettings(): Promise<Settings> {
  const settings = await cache.getOrLoad('settings', () =>
    prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
  )
  if (!settings) throw new Error('No existe la fila de Settings.')
  return settings
}

// Se llama al guardar cambios desde el panel del administrador (Fase 9).
export const invalidateSettings = () => cache.clear()
