import { prisma } from '../lib/prisma.js'
import { JOIN } from './checkout.js'

// Inventario del cliente (8.7): pedidos PAID con su QR y su código, con los valores congelados al pagar.
export async function listInventory(userId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId: userId, status: 'PAID' },
    orderBy: { paidAt: 'desc' },
    include: {
      items: { include: { product: true, coupon: true }, orderBy: { createdAt: 'asc' } },
    },
    ...JOIN,
  })
  return orders.map((o) => ({
    id: o.id,
    paidAt: o.paidAt,
    pickupCode: o.pickupCode,
    qrToken: o.qrToken,
    totalCents: o.totalCents,
    amountBsCents: o.amountBsCents,
    pointsEarned: o.pointsEarned,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.product.name,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      discountCents: i.discountCents,
      lineTotalCents: i.lineTotalCents,
      couponTitle: i.coupon?.title ?? null,
    })),
  }))
}
