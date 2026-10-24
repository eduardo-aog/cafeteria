import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error.js'
import { requirePerm } from '../middleware/permissions.js'
import { uploadImage } from '../middleware/upload.js'
import { deleteProductImage, uploadProductImage } from '../services/productImages.js'
import {
  createProduct,
  getProducts,
  sortProducts,
  toProductDto,
  updateProduct,
} from '../services/products.js'
import { listDeliveredToday, restoreOrder } from '../services/pickupOrders.js'
import { getLatestRate } from '../services/rates.js'
import { salesToday } from '../services/reports.js'

export const managerRouter = Router()

// Gerente y administrador (el permiso manager incluye al administrador).
managerRouter.use('/manager', requireAuth, requirePerm('manager'))

const idParams = z.object({ id: z.uuid() })
const categorySchema = z.enum(['CAFE', 'BEBIDAS', 'POSTRES'])
const productFields = {
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  // Centavos enteros; hasta $10.000,00.
  priceCents: z.number().int().min(1).max(1_000_000),
  category: categorySchema,
}

// Incluye los productos dados de baja (marcados con isActive = false).
managerRouter.get('/manager/products', async (_req, res) => {
  const [products, rate] = await Promise.all([getProducts(), getLatestRate()])
  res.json({ products: sortProducts(products).map((p) => toProductDto(p, rate)) })
})

managerRouter.post('/manager/products', async (req, res) => {
  const data = z.object(productFields).parse(req.body)
  const product = await createProduct(data)
  res.status(201).json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.patch('/manager/products/:id', async (req, res) => {
  const { id } = idParams.parse(req.params)
  const data = z
    .object(productFields)
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'Indica al menos un campo.')
    .parse(req.body)
  const product = await updateProduct(id, data)
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.post('/manager/products/:id/image', uploadImage, async (req, res) => {
  const { id } = idParams.parse(req.params)
  if (!req.file) throw new AppError('INVALID_IMAGE', 'Selecciona una imagen.', 400)
  // Se lee de la base (no del caché): hace falta la URL exacta de la imagen que se va a reemplazar.
  const previous = await prisma.product.findUnique({ where: { id } })
  if (!previous) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  const imageUrl = await uploadProductImage(id, req.file.buffer)
  const product = await updateProduct(id, { imageUrl })
  if (previous.imageUrl) await deleteProductImage(previous.imageUrl)
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.delete('/manager/products/:id/image', async (req, res) => {
  const { id } = idParams.parse(req.params)
  const previous = await prisma.product.findUnique({ where: { id } })
  if (!previous) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  const product = await updateProduct(id, { imageUrl: null })
  if (previous.imageUrl) await deleteProductImage(previous.imageUrl)
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.patch('/manager/products/:id/availability', async (req, res) => {
  const { id } = idParams.parse(req.params)
  const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body)
  const product = await updateProduct(id, { isAvailable })
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.get('/manager/delivered-today', async (_req, res) => {
  res.json({ orders: await listDeliveredToday() })
})

managerRouter.post('/manager/orders/:id/restore', async (req, res) => {
  const { id } = idParams.parse(req.params)
  await restoreOrder(req.user!.id, id)
  res.json({ ok: true })
})

// Resumen de ventas del día, solo lectura (9.6).
managerRouter.get('/manager/sales-today', async (_req, res) => {
  res.json(await salesToday())
})
