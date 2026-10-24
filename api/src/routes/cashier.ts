import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permissions.js'
import { scanOrder } from '../services/pickupOrders.js'
import {
  approveSubmission,
  listVerificationQueue,
  rejectSubmission,
} from '../services/verification.js'

export const cashierRouter = Router()

// La cola de verificación solo la ven quienes tienen permiso de cajero (8.1).
cashierRouter.use('/cashier', requireAuth, requirePerm('cashier'))

const idParams = z.object({ id: z.uuid() })

cashierRouter.get('/cashier/verification-queue', async (_req, res) => {
  res.json({ submissions: await listVerificationQueue() })
})

cashierRouter.post('/cashier/submissions/:id/approve', async (req, res) => {
  const { id } = idParams.parse(req.params)
  await approveSubmission(req.user!.id, id)
  res.json({ ok: true })
})

// Si el motivo es «Otro», la nota es obligatoria (máximo 200 caracteres).
const rejectSchema = z
  .object({
    reason: z.enum(['REFERENCE_NOT_FOUND', 'WRONG_AMOUNT', 'OTHER']),
    note: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.reason !== 'OTHER' || !!v.note, {
    path: ['note'],
    message: 'Escribe una nota cuando el motivo es «Otro».',
  })

cashierRouter.post('/cashier/submissions/:id/reject', async (req, res) => {
  const { id } = idParams.parse(req.params)
  const { reason, note } = rejectSchema.parse(req.body)
  await rejectSubmission(req.user!.id, id, { reason, note: note || undefined })
  res.json({ ok: true })
})

// Escanea el QR o escribe el código corto: el pedido pasa directo a la cola del barista (8.7).
cashierRouter.post('/cashier/scan', async (req, res) => {
  const { code } = z.object({ code: z.string().trim().min(1).max(64) }).parse(req.body)
  res.json(await scanOrder(req.user!.id, code))
})
