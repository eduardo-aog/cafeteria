import './dev-guard.js'
import { prisma } from '../src/lib/prisma.js'

// Pone en el pasado el plazo de todos los checkouts CREATED. Pasan a EXPIRED en la próxima
// lectura del cliente o en la próxima ejecución de la tarea (cada 5 minutos).
const result = await prisma.order.updateMany({
  where: { status: 'CREATED' },
  data: { expiresAt: new Date(Date.now() - 60_000) },
})
console.log(`Checkouts con el plazo vencido: ${result.count}.`)
await prisma.$disconnect()
