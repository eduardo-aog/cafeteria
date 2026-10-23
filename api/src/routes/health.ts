import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const healthRouter = Router()

// Sin tocar la base de datos: lo usa el health check de Render.
healthRouter.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Consulta la base de datos: lo usa UptimeRobot para mantener activo Supabase.
healthRouter.get('/health/db', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
