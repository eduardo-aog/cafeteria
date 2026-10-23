import type { RequestHandler } from 'express'
import { prisma } from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from './error.js'

// Valida el token de Supabase y carga la fila User en req.user.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    throw new AppError('UNAUTHENTICATED', 'Debes iniciar sesión para continuar.', 401)
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    throw new AppError('UNAUTHENTICATED', 'Tu sesión no es válida. Inicia sesión de nuevo.', 401)
  }

  const user = await prisma.user.findUnique({ where: { id: data.user.id } })
  if (!user) {
    throw new AppError('PROFILE_NOT_FOUND', 'Tu cuenta no tiene un perfil asociado.', 403)
  }

  req.user = user
  next()
}
