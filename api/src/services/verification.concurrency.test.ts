import { existsSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Prueba de integración contra la base de datos real (Supabase): hace falta api/.env.
// Dos cajeros revisan a la vez el mismo envío: solo uno debe tener efecto (6.4).
const hasEnv = existsSync('.env')

// Fixtures fijos: se reutilizan en cada ejecución. El registro de verificación es inmutable
// (no se puede borrar), así que cada corrida deja una entrada en él.
const ID = (n: number) => `00000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`
const CUSTOMER = ID(1)
const CASHIER_A = ID(2)
const CASHIER_B = ID(3)
const TOTAL_CENTS = 1000

type Modules = {
  prisma: typeof import('../lib/prisma.js').prisma
  approveSubmission: typeof import('./verification.js').approveSubmission
  rejectSubmission: typeof import('./verification.js').rejectSubmission
}
let m: Modules

describe.skipIf(!hasEnv)('revisión simultánea del mismo envío', () => {
  beforeAll(async () => {
    // Con connection_limit=1 las dos transacciones se harían una tras otra y no habría carrera real:
    // este cliente usa varias conexiones.
    await import('dotenv/config')
    process.env.DATABASE_URL = process.env
      .DATABASE_URL!.replace(/connection_limit=\d+/, 'connection_limit=5')
      .concat('&pool_timeout=120')
    const [{ prisma }, verification] = await Promise.all([
      import('../lib/prisma.js'),
      import('./verification.js'),
    ])
    m = { prisma, ...verification }

    for (const [id, name, email] of [
      [CUSTOMER, 'Cliente de la prueba de concurrencia', 'concurrency-customer@example.com'],
      [CASHIER_A, 'Cajero A', 'concurrency-cashier-a@example.com'],
      [CASHIER_B, 'Cajero B', 'concurrency-cashier-b@example.com'],
    ] as const) {
      await prisma.user.upsert({
        where: { id },
        update: { name, canCashier: id !== CUSTOMER },
        create: { id, name, email, canCashier: id !== CUSTOMER },
      })
    }
  }, 120_000)

  afterAll(async () => {
    await m?.prisma.$disconnect()
  })

  // Deja un pedido IN_VERIFICATION con su envío PENDING, como antes de que un cajero lo revise.
  async function setup(orderId: string, submissionId: string, reference: string) {
    const { prisma } = m
    const bank = await prisma.bank.findFirstOrThrow()
    await prisma.pointsMovement.deleteMany({ where: { orderId } })
    await prisma.user.update({ where: { id: CUSTOMER }, data: { pointsBalance: 0 } })
    await prisma.order.upsert({
      where: { id: orderId },
      update: {},
      create: { id: orderId, customerId: CUSTOMER },
    })
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'IN_VERIFICATION',
        everSubmitted: true,
        totalCents: TOTAL_CENTS,
        amountBsCents: 1,
        bcvRateHundredths: 100,
        paidAt: null,
        pickupCode: null,
        qrToken: null,
        pointsEarned: null,
        rejectionStreak: 0,
        blockedUntil: null,
      },
    })
    await prisma.paymentSubmission.upsert({
      where: { id: submissionId },
      update: {},
      create: {
        id: submissionId,
        orderId,
        customerId: CUSTOMER,
        reference,
        bankCode: bank.code,
        amountBsCents: 1,
        totalCents: TOTAL_CENTS,
      },
    })
    await prisma.paymentSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'PENDING',
        reviewedById: null,
        reviewedAt: null,
        rejectReason: null,
        rejectNote: null,
      },
    })
    return prisma.verificationLog.count({ where: { submissionId } })
  }

  it('dos aprobaciones simultáneas: solo una tiene efecto', async () => {
    const orderId = ID(10)
    const submissionId = ID(11)
    const logsBefore = await setup(orderId, submissionId, '9000000011')
    const { prisma, approveSubmission } = m

    const results = await Promise.allSettled([
      approveSubmission(CASHIER_A, submissionId),
      approveSubmission(CASHIER_B, submissionId),
    ])

    const won = results.filter((r) => r.status === 'fulfilled')
    const lost = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(won).toHaveLength(1)
    expect(lost).toHaveLength(1)
    expect(lost[0]!.reason).toMatchObject({ code: 'ALREADY_REVIEWED', status: 409 })

    const submission = await prisma.paymentSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { reviewedBy: true },
    })
    expect(submission.status).toBe('APPROVED')
    expect(lost[0]!.reason.message).toBe(`Ya verificado por ${submission.reviewedBy!.name}`)

    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })
    const expectedPoints = Math.floor((TOTAL_CENTS * settings.pointsPerDollar) / 100)
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.status).toBe('PAID')
    expect(order.pointsEarned).toBe(expectedPoints)
    expect(order.pickupCode).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)

    // Los puntos se acreditan una sola vez y el registro tiene una sola entrada nueva.
    expect((await prisma.user.findUniqueOrThrow({ where: { id: CUSTOMER } })).pointsBalance).toBe(
      expectedPoints,
    )
    expect(await prisma.pointsMovement.count({ where: { orderId, type: 'EARN' } })).toBe(1)
    expect(await prisma.verificationLog.count({ where: { submissionId } })).toBe(logsBefore + 1)
  }, 180_000)

  it('aprobar y rechazar a la vez: solo uno gana y el pedido queda coherente', async () => {
    const orderId = ID(20)
    const submissionId = ID(21)
    const logsBefore = await setup(orderId, submissionId, '9000000021')
    const { prisma, approveSubmission, rejectSubmission } = m

    const results = await Promise.allSettled([
      approveSubmission(CASHIER_A, submissionId),
      rejectSubmission(CASHIER_B, submissionId, { reason: 'WRONG_AMOUNT' }),
    ])

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const lost = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')!
    expect(lost.reason).toMatchObject({ code: 'ALREADY_REVIEWED' })

    const submission = await prisma.paymentSubmission.findUniqueOrThrow({
      where: { id: submissionId },
    })
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    if (submission.status === 'APPROVED') {
      expect(order.status).toBe('PAID')
      expect(await prisma.pointsMovement.count({ where: { orderId } })).toBe(1)
    } else {
      expect(submission.status).toBe('REJECTED')
      expect(order.status).toBe('CREATED')
      expect(await prisma.pointsMovement.count({ where: { orderId } })).toBe(0)
    }
    expect(await prisma.verificationLog.count({ where: { submissionId } })).toBe(logsBefore + 1)
  }, 180_000)
})
