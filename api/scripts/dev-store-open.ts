import './dev-guard.js'
import { prisma } from '../src/lib/prisma.js'

// Abre el local todos los días, de 00:00 a 23:59, para probar a cualquier hora.
await prisma.settings.update({
  where: { id: 1 },
  data: { openDays: [1, 2, 3, 4, 5, 6, 7], openTime: '00:00', closeTime: '23:59' },
})
console.log(
  'Local abierto todos los días de 00:00 a 23:59. Para restaurar: npm run dev:store-default',
)
await prisma.$disconnect()
