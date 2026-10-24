import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  getAdminSettings,
  settingsPatchInput,
  updateAdminSettings,
} from '../services/adminSettings.js'
import { salesReport } from '../services/reports.js'
import { findUserByEmail, setPermissions } from '../services/users.js'
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

// Parámetros del sistema, datos de cobro y horario (8.11).
adminRouter.get('/admin/settings', async (_req, res) => {
  res.json({ settings: await getAdminSettings() })
})

adminRouter.patch('/admin/settings', async (req, res) => {
  res.json({ settings: await updateAdminSettings(settingsPatchInput.parse(req.body)) })
})

// Permisos: se busca una cuenta ya registrada por su correo y se activan o desactivan cajero, barista y gerente.
adminRouter.get('/admin/users', async (req, res) => {
  const { email } = z.object({ email: z.string().trim().min(3).max(254) }).parse(req.query)
  res.json({ user: await findUserByEmail(email) })
})

adminRouter.patch('/admin/users/:id/permissions', async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params)
  // .strict(): cualquier intento de tocar isAdmin (u otro campo) se rechaza.
  const permissions = z
    .object({ canCashier: z.boolean(), canBarista: z.boolean(), canManager: z.boolean() })
    .strict()
    .parse(req.body)
  res.json({ user: await setPermissions(id, permissions) })
})

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD.')

// Reportes en pantalla (8.10): hoy, semana, mes o un rango (todo en hora de Caracas).
adminRouter.get('/admin/reports', async (req, res) => {
  const query = z
    .object({
      period: z.enum(['today', 'week', 'month', 'custom']),
      from: dateOnly.optional(),
      to: dateOnly.optional(),
    })
    .refine((v) => v.period !== 'custom' || (v.from && v.to), {
      path: ['from'],
      message: 'Indica las fechas «desde» y «hasta».',
    })
    .parse(req.query)
  res.json(
    await salesReport(
      query.period,
      query.from && query.to ? { from: query.from, to: query.to } : undefined,
    ),
  )
})
