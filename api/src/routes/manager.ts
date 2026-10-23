import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error.js'
import { requirePerm } from '../middleware/permissions.js'
import { uploadImage } from '../middleware/upload.js'
import { deleteProductImage, uploadProductImage } from '../services/productImages.js'
import { sortProducts, toProductDto } from '../services/products.js'
import { getLatestRate } from '../services/rates.js'

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

async function findProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
  return product
}

// Incluye los productos dados de baja (marcados con isActive = false).
managerRouter.get('/manager/products', async (_req, res) => {
  const [products, rate] = await Promise.all([prisma.product.findMany(), getLatestRate()])
  res.json({ products: sortProducts(products).map((p) => toProductDto(p, rate)) })
})

managerRouter.post('/manager/products', async (req, res) => {
  const data = z.object(productFields).parse(req.body)
  const product = await prisma.product.create({ data })
  res.status(201).json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.patch('/manager/products/:id', async (req, res) => {
  const { id } = idParams.parse(req.params)
  const data = z
    .object(productFields)
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'Indica al menos un campo.')
    .parse(req.body)
  await findProduct(id)
  const product = await prisma.product.update({ where: { id }, data })
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.post('/manager/products/:id/image', uploadImage, async (req, res) => {
  const { id } = idParams.parse(req.params)
  if (!req.file) throw new AppError('INVALID_IMAGE', 'Selecciona una imagen.', 400)
  const previous = await findProduct(id)
  const imageUrl = await uploadProductImage(id, req.file.buffer)
  const product = await prisma.product.update({ where: { id }, data: { imageUrl } })
  if (previous.imageUrl) await deleteProductImage(previous.imageUrl)
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.delete('/manager/products/:id/image', async (req, res) => {
  const { id } = idParams.parse(req.params)
  const previous = await findProduct(id)
  const product = await prisma.product.update({ where: { id }, data: { imageUrl: null } })
  if (previous.imageUrl) await deleteProductImage(previous.imageUrl)
  res.json({ product: toProductDto(product, await getLatestRate()) })
})

managerRouter.patch('/manager/products/:id/availability', async (req, res) => {
  const { id } = idParams.parse(req.params)
  const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body)
  await findProduct(id)
  const product = await prisma.product.update({ where: { id }, data: { isAvailable } })
  res.json({ product: toProductDto(product, await getLatestRate()) })
})
