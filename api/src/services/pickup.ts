import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { generatePickupCode } from '../domain/codes.js'

// Código corto único en toda la tabla (8.7). Un choque dentro de una transacción de Postgres la
// aborta, así que se comprueba antes de usarlo y se reintenta si ya existe.
export async function uniquePickupCode(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generatePickupCode()
    const taken = await tx.order.findUnique({ where: { pickupCode: code }, select: { id: true } })
    if (!taken) return code
  }
  throw new Error('No se pudo generar un código de retiro único.')
}

// Contenido del QR: un identificador aleatorio de todo el pedido.
export const newQrToken = () => randomUUID()
