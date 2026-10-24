import { Prisma, type PrismaClient } from '@prisma/client'
import { releaseCouponsOfOrders } from './coupons.js'

type Db = Prisma.TransactionClient | PrismaClient

// CREATED con plazo vencido → EXPIRED (8.5). Idempotente y condicional (6.4), en una sola consulta que
// devuelve los ids afectados (útil para liberar cupones en la Fase 8). Lo usan la tarea de cada
// 5 minutos y las lecturas del cliente (de forma perezosa). Sin `customerId` aplica a todos.
// Prisma guarda las fechas en UTC sin zona horaria, de ahí `AT TIME ZONE 'UTC'`.
export async function expireStaleCheckouts(db: Db, customerId?: string): Promise<number> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    UPDATE "Order"
    SET "status" = 'EXPIRED',
        "expiredAt" = (now() AT TIME ZONE 'UTC'),
        "updatedAt" = (now() AT TIME ZONE 'UTC')
    WHERE "status" = 'CREATED'
      AND "expiresAt" < (now() AT TIME ZONE 'UTC')
      ${customerId ? Prisma.sql`AND "customerId" = ${customerId}::uuid` : Prisma.empty}
    RETURNING "id"`
  // Los cupones reservados no se pierden si el pedido no se pagó (8.5).
  await releaseCouponsOfOrders(
    db,
    rows.map((r) => r.id),
  )
  return rows.length
}
