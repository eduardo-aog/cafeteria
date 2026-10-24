import type { User } from '@prisma/client'
import type { RequestHandler } from 'express'
import { prisma } from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { TtlCache } from '../lib/ttlCache.js'
import { AppError } from './error.js'

// Perfil y permisos guardados 30 s: evita una consulta a la base en cada petición. Quien cambie
// permisos (Fase 9) debe llamar a invalidateUser para que se apliquen al instante.
const profiles = new TtlCache<string, User>(30_000)

export const invalidateUser = (id: string) => profiles.delete(id)

// Id del usuario si el token es válido y no ha vencido. Un token mal formado hace que getClaims
// lance una excepción en lugar de devolver un error: también cuenta como inválido.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getClaims(token)
    return error ? null : (data?.claims.sub ?? null)
  } catch {
    return null
  }
}

// Valida el token de Supabase y carga la fila User en req.user.
// getClaims verifica la firma (ES256) y el vencimiento con la clave pública del proyecto, sin red
// por petición (decisión del usuario, ver PROGRESO.md: sustituye a getUser de 8.1).
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    throw new AppError('UNAUTHENTICATED', 'Debes iniciar sesión para continuar.', 401)
  }

  const userId = await verifyToken(token)
  if (!userId) {
    throw new AppError('UNAUTHENTICATED', 'Tu sesión no es válida. Inicia sesión de nuevo.', 401)
  }

  const user = await profiles.getOrLoad(userId, () =>
    prisma.user.findUnique({ where: { id: userId } }),
  )
  if (!user) {
    throw new AppError('PROFILE_NOT_FOUND', 'Tu cuenta no tiene un perfil asociado.', 403)
  }

  req.user = user
  next()
}
