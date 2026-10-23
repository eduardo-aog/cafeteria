import { prisma } from '../lib/prisma.js'

// Settings es una fila única (id = 1) creada por el seed.
export async function getSettings() {
  return prisma.settings.findUniqueOrThrow({ where: { id: 1 } })
}
