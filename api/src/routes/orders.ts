import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { z } from 'zod'
import { requireCustomer } from '../middleware/permissions.js'
import { listInventory } from '../services/orders.js'
import { listHistory } from '../services/pickupOrders.js'

export const ordersRouter = Router()

ordersRouter.get('/orders/inventory', requireAuth, requireCustomer, async (req, res) => {
  res.json({ orders: await listInventory(req.user!.id) })
})

ordersRouter.get('/orders/history', requireAuth, requireCustomer, async (req, res) => {
  const { cursor } = z.object({ cursor: z.uuid().optional() }).parse(req.query)
  res.json(await listHistory(req.user!.id, cursor))
})
