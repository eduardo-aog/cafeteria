import type { Prisma, PrismaClient } from '@prisma/client'

type Db = Prisma.TransactionClient | PrismaClient

// CREATED con plazo vencido → EXPIRED (8.5). Idempotente y con actualización condicional (6.4):
// lo usan la tarea de cada 5 minutos y las lecturas del cliente (de forma perezosa).
// Sin `customerId` aplica a todos los clientes.
export async function expireStaleCheckouts(db: Db, customerId?: string): Promise<number> {
  const now = new Date()
  const stale = await db.order.findMany({
    where: { status: 'CREATED', expiresAt: { lt: now }, ...(customerId && { customerId }) },
    select: { id: true },
  })
  if (stale.length === 0) return 0

  const result = await db.order.updateMany({
    where: { id: { in: stale.map((o) => o.id) }, status: 'CREATED', expiresAt: { lt: now } },
    data: { status: 'EXPIRED', expiredAt: now },
  })
  return result.count
}
