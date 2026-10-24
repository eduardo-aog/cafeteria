import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error.js'
import { requireCustomer } from '../middleware/permissions.js'
import { couponsForProduct, listCoupons } from '../services/coupons.js'
import { getProduct } from '../services/products.js'
import { listPoints, listRewardsForCustomer, redeemReward } from '../services/rewards.js'

export const rewardsRouter = Router()

// Rutas de cliente: cada una lleva su propio control (un `use` sin prefijo atraparía las de los routers siguientes).
const customerOnly = [requireAuth, requireCustomer]

rewardsRouter.get('/rewards', ...customerOnly, async (req, res) => {
  res.json(await listRewardsForCustomer(req.user!.id))
})

rewardsRouter.post('/rewards/:id/redeem', ...customerOnly, async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params)
  res.status(201).json({ coupon: await redeemReward(req.user!.id, id) })
})

rewardsRouter.get('/points', ...customerOnly, async (req, res) => {
  const { cursor } = z.object({ cursor: z.uuid().optional() }).parse(req.query)
  res.json(await listPoints(req.user!.id, cursor))
})

rewardsRouter.get('/coupons', ...customerOnly, async (req, res) => {
  const { status } = z
    .object({ status: z.enum(['available', 'used', 'expired']).default('available') })
    .parse(req.query)
  res.json({ coupons: await listCoupons(req.user!.id, status) })
})

rewardsRouter.get('/products/:id/coupons', ...customerOnly, async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params)
  const product = await getProduct(id)
  if (!product?.isActive) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  res.json({ coupons: await couponsForProduct(req.user!.id, product) })
})
