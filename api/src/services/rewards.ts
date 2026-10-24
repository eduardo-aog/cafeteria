import type { Product, Reward } from '@prisma/client'
import { z } from 'zod'
import { endOfMonthCaracas } from '../domain/coupons.js'
import { prisma } from '../lib/prisma.js'
import { TX_OPTIONS } from '../lib/tx.js'
import { AppError } from '../middleware/error.js'
import { expiryPreview, toCouponDto } from './coupons.js'
import { getProduct } from './products.js'

type RewardWithProduct = Reward & { product: Product | null }

const toRewardDto = (r: RewardWithProduct) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  percent: r.percent,
  productId: r.productId,
  productName: r.product?.name ?? null,
  costPoints: r.costPoints,
  isActive: r.isActive,
})

// Catálogo de recompensas activas (8.9), con el saldo y cuándo vencería un cupón canjeado hoy.
export async function listRewardsForCustomer(userId: string) {
  const [rewards, user] = await Promise.all([
    prisma.reward.findMany({
      where: { isActive: true },
      include: { product: true },
      orderBy: [{ costPoints: 'asc' }, { name: 'asc' }],
      relationLoadStrategy: 'join',
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { pointsBalance: true } }),
  ])
  return {
    balance: user.pointsBalance,
    expiry: expiryPreview(endOfMonthCaracas(new Date()), new Date()),
    rewards: rewards.map(toRewardDto),
  }
}

// Canje definitivo (8.9): descuenta los puntos con una actualización condicional, registra el movimiento
// y crea el cupón con una copia de la recompensa. Vence el último instante del mes en Caracas.
export async function redeemReward(userId: string, rewardId: string) {
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    include: { product: true },
  })
  if (!reward) throw new AppError('REWARD_NOT_FOUND', 'Recompensa no encontrada.', 404)
  if (!reward.isActive || (reward.type === 'FREE_PRODUCT' && !reward.product?.isActive)) {
    throw new AppError('REWARD_NOT_AVAILABLE', 'Esta recompensa ya no está disponible.', 409)
  }

  const now = new Date()
  const coupon = await prisma.$transaction(async (tx) => {
    const paid = await tx.user.updateMany({
      where: { id: userId, pointsBalance: { gte: reward.costPoints } },
      data: { pointsBalance: { decrement: reward.costPoints } },
    })
    if (paid.count === 0) {
      throw new AppError(
        'INSUFFICIENT_POINTS',
        'No tienes puntos suficientes para esta recompensa.',
        409,
      )
    }
    return tx.coupon.create({
      data: {
        userId,
        rewardId,
        title: reward.name,
        type: reward.type,
        percent: reward.percent,
        productId: reward.productId,
        pointsCost: reward.costPoints,
        expiresAt: endOfMonthCaracas(now),
        pointsMovements: { create: { userId, type: 'REDEEM', points: -reward.costPoints } },
      },
      include: { product: true },
    })
  }, TX_OPTIONS)
  return toCouponDto(coupon, now)
}

const POINTS_PAGE = 20

// Saldo y movimientos (8.9), de 20 en 20 del más reciente al más antiguo.
export async function listPoints(userId: string, cursor?: string) {
  const [user, movements] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { pointsBalance: true } }),
    prisma.pointsMovement.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: POINTS_PAGE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: { coupon: { select: { title: true } } },
      relationLoadStrategy: 'join',
    }),
  ])
  const page = movements.slice(0, POINTS_PAGE)
  return {
    balance: user.pointsBalance,
    movements: page.map((m) => ({
      id: m.id,
      type: m.type,
      points: m.points,
      createdAt: m.createdAt,
      couponTitle: m.coupon?.title ?? null,
    })),
    nextCursor: movements.length > POINTS_PAGE ? page[POINTS_PAGE - 1]!.id : null,
  }
}

// ---------- Administrador ----------

const rewardFields = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(['PERCENT_DISCOUNT', 'FREE_PRODUCT']),
  percent: z.number().int().min(1).max(100).nullish(),
  productId: z.uuid().nullish(),
  costPoints: z.number().int().min(1).max(1_000_000),
  isActive: z.boolean().optional(),
})

// Descuento: porcentaje de 1 a 100 y sin producto. Producto gratis: producto y sin porcentaje (7.1).
export const rewardInput = rewardFields.superRefine((v, ctx) => {
  if (v.type === 'PERCENT_DISCOUNT') {
    if (v.percent == null)
      ctx.addIssue({
        code: 'custom',
        path: ['percent'],
        message: 'Indica el porcentaje (de 1 a 100).',
      })
    if (v.productId != null)
      ctx.addIssue({
        code: 'custom',
        path: ['productId'],
        message: 'Un descuento porcentual sirve para cualquier producto.',
      })
  } else {
    if (v.productId == null)
      ctx.addIssue({
        code: 'custom',
        path: ['productId'],
        message: 'Elige el producto que se regala.',
      })
    if (v.percent != null)
      ctx.addIssue({
        code: 'custom',
        path: ['percent'],
        message: 'Un producto gratis no lleva porcentaje.',
      })
  }
})

export const rewardUpdateInput = rewardFields.partial()

export async function listAllRewards() {
  const rewards = await prisma.reward.findMany({
    include: { product: true },
    orderBy: [{ isActive: 'desc' }, { costPoints: 'asc' }, { name: 'asc' }],
    relationLoadStrategy: 'join',
  })
  return rewards.map(toRewardDto)
}

async function assertProductExists(productId: string | null | undefined) {
  if (productId && !(await getProduct(productId))) {
    throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  }
}

export async function createReward(input: z.infer<typeof rewardInput>) {
  await assertProductExists(input.productId)
  const reward = await prisma.reward.create({
    data: {
      name: input.name,
      type: input.type,
      percent: input.type === 'PERCENT_DISCOUNT' ? input.percent : null,
      productId: input.type === 'FREE_PRODUCT' ? input.productId : null,
      costPoints: input.costPoints,
      isActive: input.isActive ?? true,
    },
    include: { product: true },
  })
  return toRewardDto(reward)
}

// Las recompensas no se borran: se desactivan. Los cupones ya canjeados son una copia y siguen válidos (8.9).
export async function updateReward(id: string, patch: z.infer<typeof rewardUpdateInput>) {
  const current = await prisma.reward.findUnique({ where: { id } })
  if (!current) throw new AppError('REWARD_NOT_FOUND', 'Recompensa no encontrada.', 404)

  // Se valida el resultado completo, no solo los campos enviados.
  const merged = rewardInput.safeParse({
    name: patch.name ?? current.name,
    type: patch.type ?? current.type,
    percent: patch.percent !== undefined ? patch.percent : current.percent,
    productId: patch.productId !== undefined ? patch.productId : current.productId,
    costPoints: patch.costPoints ?? current.costPoints,
    isActive: patch.isActive ?? current.isActive,
  })
  if (!merged.success) throw merged.error
  const next = merged.data
  await assertProductExists(next.productId)

  const reward = await prisma.reward.update({
    where: { id },
    data: {
      name: next.name,
      type: next.type,
      percent: next.type === 'PERCENT_DISCOUNT' ? next.percent : null,
      productId: next.type === 'FREE_PRODUCT' ? next.productId : null,
      costPoints: next.costPoints,
      isActive: next.isActive,
    },
    include: { product: true },
  })
  return toRewardDto(reward)
}
