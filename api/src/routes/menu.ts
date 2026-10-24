import { Router } from 'express'
import { z } from 'zod'
import { isStoreOpen, nextOpening } from '../domain/schedule.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error.js'
import { requireCustomer } from '../middleware/permissions.js'
import { getProduct, getProducts, sortProducts, toProductDto } from '../services/products.js'
import { getLatestRate } from '../services/rates.js'
import { getSettings } from '../services/settings.js'

export const menuRouter = Router()

const rateDto = (rate: { rateHundredths: number; bcvDate: Date } | null) =>
  rate && {
    rateHundredths: rate.rateHundredths,
    bcvDate: rate.bcvDate.toISOString().slice(0, 10),
  }

// Público: el menú se puede ver siempre, incluso con el local cerrado (8.2).
menuRouter.get('/menu', async (_req, res) => {
  const [products, rate, settings] = await Promise.all([
    getProducts(),
    getLatestRate(),
    getSettings(),
  ])
  const now = new Date()
  const isOpen = isStoreOpen(now, settings)
  res.json({
    products: sortProducts(products.filter((p) => p.isActive)).map((p) => toProductDto(p, rate)),
    rate: rateDto(rate),
    limits: { maxQuantityPerProduct: settings.maxQuantityPerProduct },
    store: {
      isOpen,
      openDays: settings.openDays,
      openTime: settings.openTime,
      closeTime: settings.closeTime,
      nextOpening: isOpen ? null : (nextOpening(now, settings)?.toISOString() ?? null),
    },
  })
})

menuRouter.get('/products/:id', requireAuth, requireCustomer, async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params)
  const product = await getProduct(id)
  if (!product?.isActive) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  const rate = await getLatestRate()
  res.json({
    product: toProductDto(product, rate),
    rate: rateDto(rate),
  })
})
