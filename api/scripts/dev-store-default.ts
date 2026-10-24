import './dev-guard.js'
import { prisma } from '../src/lib/prisma.js'

// Restaura el horario por defecto: lunes a sábado, de 8:00 a 20:00.
await prisma.settings.update({
  where: { id: 1 },
  data: { openDays: [1, 2, 3, 4, 5, 6], openTime: '08:00', closeTime: '20:00' },
})
console.log('Horario restaurado: lunes a sábado de 8:00 a 20:00.')
await prisma.$disconnect()
