import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permissions.js'
import { toProductDto, updateProduct } from '../services/products.js'
import {
  createReward,
  listAllRewards,
  rewardInput,
  rewardUpdateInput,
  updateReward,
} from '../services/rewards.js'
import { getLatestRate } from '../services/rates.js'

export const adminRouter = Router()

adminRouter.use('/admin', requireAuth, requirePerm('admin'))

// Baja y reactivación: un producto nunca se borra (8.3).
adminRouter.patch('/admin/products/:id/active', async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params)
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body)
  const product = await updateProduct(id, { isActive })
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

// Recompensas: se crean, editan y activan o desactivan; no se borran (9.7).
adminRouter.get('/admin/rewards', async (_req, res) => {
  res.json({ rewards: await listAllRewards() })
})

adminRouter.post('/admin/rewards', async (req, res) => {
  res.status(201).json({ reward: await createReward(rewardInput.parse(req.body)) })
})

adminRouter.patch('/admin/rewards/:id', async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params)
  res.json({ reward: await updateReward(id, rewardUpdateInput.parse(req.body)) })
})
