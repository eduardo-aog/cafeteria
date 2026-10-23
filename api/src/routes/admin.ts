import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error.js'
import { requirePerm } from '../middleware/permissions.js'
import { toProductDto } from '../services/products.js'
import { getLatestRate } from '../services/rates.js'

export const adminRouter = Router()

adminRouter.use('/admin', requireAuth, requirePerm('admin'))

// Baja y reactivación: un producto nunca se borra (8.3).
adminRouter.patch('/admin/products/:id/active', async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params)
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body)
  if (!(await prisma.product.findUnique({ where: { id }, select: { id: true } }))) {
    throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  }
  const product = await prisma.product.update({ where: { id }, data: { isActive } })
  res.json({ product: toProductDto(product, await getLatestRate()) })
})
