import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { DateTime } from 'luxon'
import { generatePickupCode } from '../src/domain/codes.js'
import { pointsFor } from '../src/domain/points.js'
import { usdToBsCents } from '../src/domain/money.js'
import { STORE_ZONE } from '../src/domain/schedule.js'
import { prisma } from '../src/lib/prisma.js'

// Pedidos históricos de las últimas semanas, ya entregados, para que los reportes muestren datos (15).
// Se crean para una cuenta propia («Ventas históricas»), que no existe en Supabase Auth y no puede iniciar
// sesión. Es idempotente: cada ejecución borra los pedidos anteriores de esa cuenta y los vuelve a generar.
const DAYS = 28
const HISTORIC_USER = {
  id: '00000000-0000-4000-8000-0000000000a1',
  name: 'Ventas históricas',
  email: 'ventas-historicas@demo.com',
}

// Generador pseudoaleatorio con semilla: mismos datos en cada ejecución.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const random = mulberry32(20261023)
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))

// Horas de más a menos movimiento: pico al mediodía y a media tarde.
const HOUR_WEIGHTS: Record<number, number> = {
  8: 3,
  9: 4,
  10: 5,
  11: 7,
  12: 10,
  13: 9,
  14: 6,
  15: 5,
  16: 6,
  17: 8,
  18: 7,
  19: 4,
}
const weightedHours = Object.entries(HOUR_WEIGHTS).flatMap(([hour, weight]) =>
  Array<number>(weight).fill(Number(hour)),
)

async function main() {
  const [products, rate, settings, cashier, barista] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true } }),
    prisma.exchangeRate.findFirst({ orderBy: { fetchedAt: 'desc' } }),
    prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'cajero@demo.com' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'barista@demo.com' } }),
  ])
  if (products.length === 0) throw new Error('No hay productos: ejecuta primero `npm run db:seed`.')
  const rateHundredths = rate?.rateHundredths ?? 88623

  await prisma.user.upsert({
    where: { id: HISTORIC_USER.id },
    update: { name: HISTORIC_USER.name, email: HISTORIC_USER.email },
    create: HISTORIC_USER,
  })
  const removed = await prisma.order.deleteMany({ where: { customerId: HISTORIC_USER.id } })

  const takenCodes = new Set(
    (
      await prisma.order.findMany({
        where: { pickupCode: { not: null } },
        select: { pickupCode: true },
      })
    ).map((o) => o.pickupCode),
  )
  const now = DateTime.now().setZone(STORE_ZONE)
  const orders: Prisma.OrderCreateManyInput[] = []
  const items: {
    id: string
    orderId: string
    productId: string
    quantity: number
    unitPriceCents: number
    discountCents: number
    lineTotalCents: number
  }[] = []

  for (let back = DAYS; back >= 0; back--) {
    const day = now.minus({ days: back }).startOf('day')
    if (day.weekday === 7) continue // domingo: cerrado
    // Más movimiento los viernes y sábados.
    const count = between(day.weekday >= 5 ? 10 : 6, day.weekday >= 5 ? 16 : 11)
    for (let i = 0; i < count; i++) {
      const paidAt = day.set({
        hour: pick(weightedHours),
        minute: between(0, 59),
        second: between(0, 59),
      })
      if (paidAt > now) continue // hoy solo hasta la hora actual

      const orderId = randomUUID()
      const lines = new Set<string>()
      let totalCents = 0
      for (let l = between(1, 3); l > 0; l--) {
        const product = pick(products)
        if (lines.has(product.id)) continue
        lines.add(product.id)
        const quantity = pick([1, 1, 1, 2, 2, 3])
        const lineTotalCents = product.priceCents * quantity
        totalCents += lineTotalCents
        items.push({
          id: randomUUID(),
          orderId,
          productId: product.id,
          quantity,
          unitPriceCents: product.priceCents,
          discountCents: 0,
          lineTotalCents,
        })
      }

      let pickupCode = generatePickupCode()
      while (takenCodes.has(pickupCode)) pickupCode = generatePickupCode()
      takenCodes.add(pickupCode)

      const scannedAt = paidAt.plus({ minutes: between(1, 6) })
      orders.push({
        id: orderId,
        customerId: HISTORIC_USER.id,
        status: 'DELIVERED',
        everSubmitted: true,
        totalCents,
        amountBsCents: usdToBsCents(totalCents, rateHundredths),
        bcvRateHundredths: rateHundredths,
        paidAt: paidAt.toJSDate(),
        pointsEarned: pointsFor(totalCents, settings.pointsPerDollar),
        pickupCode,
        qrToken: randomUUID(),
        scannedAt: scannedAt.toJSDate(),
        scannedById: cashier.id,
        deliveredAt: scannedAt.plus({ minutes: between(5, 15) }).toJSDate(),
        deliveredById: barista.id,
        createdAt: paidAt.minus({ minutes: between(5, 20) }).toJSDate(),
      })
    }
  }

  await prisma.order.createMany({ data: orders })
  await prisma.orderItem.createMany({ data: items })
  const total = orders.reduce((sum, o) => sum + (o.totalCents ?? 0), 0)
  console.log(
    `Ventas históricas: ${orders.length} pedidos entregados de los últimos ${DAYS} días ` +
      `(${items.length} líneas, $${(total / 100).toFixed(2)} en total).` +
      (removed.count > 0
        ? ` Se reemplazaron ${removed.count} pedidos de una ejecución anterior.`
        : ''),
  )
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
