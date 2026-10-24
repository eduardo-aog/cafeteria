import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireAnyPerm, requirePerm } from '../middleware/permissions.js'
import { deliverOrder, listBaristaQueue } from '../services/pickupOrders.js'

export const baristaRouter = Router()

// El barista, el gerente y el administrador ven la cola; solo el barista entrega (9.5).
baristaRouter.get(
  '/barista/queue',
  requireAuth,
  requireAnyPerm('barista', 'manager', 'admin'),
  async (_req, res) => {
    res.json({ orders: await listBaristaQueue() })
  },
)

baristaRouter.post(
  '/barista/orders/:id/deliver',
  requireAuth,
  requirePerm('barista'),
  async (req, res) => {
    const { id } = z.object({ id: z.uuid() }).parse(req.params)
    await deliverOrder(req.user!.id, id)
    res.json({ ok: true })
  },
)
