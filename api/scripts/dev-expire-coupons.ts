import './dev-guard.js'
import { prisma } from '../src/lib/prisma.js'

// Pone en el pasado la fecha de los cupones AVAILABLE del cliente de demostración. Pasan a EXPIRED en la
// próxima lectura del cliente o en la próxima ejecución de la tarea (cada 5 minutos). Los RESERVED no se tocan.
const result = await prisma.coupon.updateMany({
  where: { status: 'AVAILABLE', user: { email: 'cliente@demo.com' } },
  data: { expiresAt: new Date(Date.now() - 60_000) },
})
console.log(`Cupones disponibles con la fecha vencida: ${result.count}.`)
await prisma.$disconnect()
