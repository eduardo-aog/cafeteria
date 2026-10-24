import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireCustomer } from '../middleware/permissions.js'
import { listInventory } from '../services/orders.js'

export const ordersRouter = Router()

ordersRouter.get('/orders/inventory', requireAuth, requireCustomer, async (req, res) => {
  res.json({ orders: await listInventory(req.user!.id) })
})
