import type { Prisma, RejectReason } from '@prisma/client'
import { checkoutExpiry } from '../domain/checkout.js'
import { pointsFor } from '../domain/points.js'
import { nextRejectionState } from '../domain/verification.js'
import { prisma } from '../lib/prisma.js'
import { TX_OPTIONS } from '../lib/tx.js'
import { AppError } from '../middleware/error.js'
import { JOIN } from './checkout.js'
import { newQrToken, uniquePickupCode } from './pickup.js'
import { getSettings } from './settings.js'

const SUBMISSION_INCLUDE = {
  reviewedBy: { select: { name: true } },
  order: { select: { rejectionStreak: true, items: { select: { couponId: true } } } },
} satisfies Prisma.PaymentSubmissionInclude

// Cola de verificación (8.6, paso 4): los envíos PENDING, el más antiguo primero.
export async function listVerificationQueue() {
  const submissions = await prisma.paymentSubmission.findMany({
    where: { status: 'PENDING' },
    orderBy: { submittedAt: 'asc' },
    include: {
      customer: { select: { name: true } },
      bank: true,
      order: {
        include: {
          items: { include: { product: true, coupon: true }, orderBy: { createdAt: 'asc' } },
        },
      },
    },
    ...JOIN,
  })
  return submissions.map((s) => ({
    id: s.id,
    submittedAt: s.submittedAt,
    customerName: s.customer.name,
    reference: s.reference,
    bankCode: s.bankCode,
    bankName: s.bank.name,
    totalCents: s.totalCents,
    amountBsCents: s.amountBsCents,
    items: s.order.items.map((i) => ({
      id: i.id,
      name: i.product.name,
      quantity: i.quantity,
      lineTotalCents: i.lineTotalCents,
      couponTitle: i.coupon?.title ?? null,
    })),
  }))
}

const alreadyReviewed = (name: string | undefined) =>
  new AppError('ALREADY_REVIEWED', `Ya verificado por ${name ?? 'otro cajero'}`, 409)

// Lee el envío y lo «reclama» con una actualización condicional PENDING → nuevo estado (6.4).
// Si otro cajero llegó primero, responde 409 con su nombre.
async function claimSubmission(
  tx: Prisma.TransactionClient,
  submissionId: string,
  cashierId: string,
  now: Date,
  data: Prisma.PaymentSubmissionUpdateManyMutationInput,
) {
  const submission = await tx.paymentSubmission.findUnique({
    where: { id: submissionId },
    include: SUBMISSION_INCLUDE,
    ...JOIN,
  })
  if (!submission) throw new AppError('SUBMISSION_NOT_FOUND', 'Envío no encontrado.', 404)
  if (submission.status !== 'PENDING') throw alreadyReviewed(submission.reviewedBy?.name)

  const claimed = await tx.paymentSubmission.updateMany({
    where: { id: submissionId, status: 'PENDING' },
    data: { ...data, reviewedById: cashierId, reviewedAt: now },
  })
  if (claimed.count === 0) {
    // Otro cajero ganó entre la lectura y la actualización: se lee de nuevo para decir quién.
    const winner = await tx.paymentSubmission.findUnique({
      where: { id: submissionId },
      select: { reviewedBy: { select: { name: true } } },
    })
    throw alreadyReviewed(winner?.reviewedBy?.name)
  }
  return submission
}

// Aprobar (8.6): envío → APPROVED, pedido → PAID con código y QR, cupones → USED, puntos y registro.
export async function approveSubmission(cashierId: string, submissionId: string) {
  const settings = await getSettings()
  const now = new Date()
  await prisma.$transaction(async (tx) => {
    const submission = await claimSubmission(tx, submissionId, cashierId, now, {
      status: 'APPROVED',
    })
    const points = pointsFor(submission.totalCents, settings.pointsPerDollar)

    const pickupCode = await uniquePickupCode(tx)
    const paid = await tx.order.updateMany({
      where: { id: submission.orderId, status: 'IN_VERIFICATION' },
      data: {
        status: 'PAID',
        paidAt: now,
        rejectionStreak: 0,
        pickupCode,
        qrToken: newQrToken(),
        pointsEarned: points,
      },
    })
    // Si el pedido ya no está en verificación, se deshace todo (la transacción se revierte).
    if (paid.count === 0) {
      throw new AppError('INVALID_STATE', 'Este pedido ya no está en verificación.', 409)
    }

    if (submission.order.items.some((i) => i.couponId)) {
      await tx.coupon.updateMany({
        where: { status: 'RESERVED', orderItems: { some: { orderId: submission.orderId } } },
        data: { status: 'USED', usedAt: now },
      })
    }
    if (points > 0) {
      await tx.user.update({
        where: { id: submission.customerId },
        data: {
          pointsBalance: { increment: points },
          pointsMovements: { create: { type: 'EARN', points, orderId: submission.orderId } },
        },
        select: { id: true },
      })
    }
    await tx.verificationLog.create({
      data: {
        submissionId,
        orderId: submission.orderId,
        cashierId,
        action: 'APPROVED',
        reference: submission.reference,
        bankCode: submission.bankCode,
        amountBsCents: submission.amountBsCents,
      },
    })
  }, TX_OPTIONS)
}

// Rechazar (8.6): el pedido vuelve a CREATED con el reloj reiniciado y los precios descongelados.
export async function rejectSubmission(
  cashierId: string,
  submissionId: string,
  input: { reason: RejectReason; note?: string },
) {
  const settings = await getSettings()
  const now = new Date()
  await prisma.$transaction(async (tx) => {
    const submission = await claimSubmission(tx, submissionId, cashierId, now, {
      status: 'REJECTED',
      rejectReason: input.reason,
      rejectNote: input.note ?? null,
    })

    const { rejectionStreak, blockedUntil } = nextRejectionState(
      submission.order.rejectionStreak,
      settings.rejectionsBeforeBlock,
      settings.blockMinutes,
      now,
    )
    const reopened = await tx.order.updateMany({
      where: { id: submission.orderId, status: 'IN_VERIFICATION' },
      data: {
        status: 'CREATED',
        expiresAt: checkoutExpiry(now, settings.checkoutExpirationHours),
        totalCents: null,
        amountBsCents: null,
        bcvRateHundredths: null,
        rejectionStreak,
        blockedUntil,
      },
    })
    if (reopened.count === 0) {
      throw new AppError('INVALID_STATE', 'Este pedido ya no está en verificación.', 409)
    }
    await tx.orderItem.updateMany({
      where: { orderId: submission.orderId },
      data: { unitPriceCents: null, discountCents: null, lineTotalCents: null },
    })
    await tx.verificationLog.create({
      data: {
        submissionId,
        orderId: submission.orderId,
        cashierId,
        action: 'REJECTED',
        reference: submission.reference,
        bankCode: submission.bankCode,
        amountBsCents: submission.amountBsCents,
        rejectReason: input.reason,
        rejectNote: input.note ?? null,
      },
    })
  }, TX_OPTIONS)
}
