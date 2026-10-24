import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error.js'
import { requireCustomer } from '../middleware/permissions.js'
import {
  addItem,
  cancelCheckout,
  listCheckouts,
  removeItem,
  updateItemQuantity,
} from '../services/checkout.js'

export const checkoutRouter = Router()

checkoutRouter.use(requireAuth, requireCustomer)

const uuid = z.uuid()
const quantity = z.number().int().min(1).max(100)

checkoutRouter.get('/checkouts', async (req, res) => {
  res.json(await listCheckouts(req.user!.id))
})

checkoutRouter.post('/checkout/items', async (req, res) => {
  const {
    productId,
    quantity: units,
    couponId,
  } = z
    .object({
      productId: uuid,
      quantity,
      couponId: z.string().nullish(),
    })
    .parse(req.body)
  // Los cupones se habilitan en la Fase 8.
  if (couponId) {
    throw new AppError('COUPONS_NOT_AVAILABLE', 'Los cupones aún no están disponibles.', 400)
  }
  res.status(201).json({ checkout: await addItem(req.user!.id, productId, units) })
})

checkoutRouter.patch('/checkout/items/:itemId', async (req, res) => {
  const { itemId } = z.object({ itemId: uuid }).parse(req.params)
  const { quantity: units } = z.object({ quantity }).parse(req.body)
  res.json({ checkout: await updateItemQuantity(req.user!.id, itemId, units) })
})

checkoutRouter.delete('/checkout/items/:itemId', async (req, res) => {
  const { itemId } = z.object({ itemId: uuid }).parse(req.params)
  res.json({ checkout: await removeItem(req.user!.id, itemId) })
})

checkoutRouter.post('/checkouts/:id/cancel', async (req, res) => {
  const { id } = z.object({ id: uuid }).parse(req.params)
  await cancelCheckout(req.user!.id, id)
  res.json({ ok: true })
})
