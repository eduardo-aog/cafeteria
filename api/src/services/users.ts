import type { User } from '@prisma/client'
import { isStaff } from '../domain/permissions.js'
import { invalidateUser } from '../middleware/auth.js'
import { AppError } from '../middleware/error.js'
import { prisma } from '../lib/prisma.js'

const toDto = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  isAdmin: u.isAdmin,
  canCashier: u.canCashier,
  canBarista: u.canBarista,
  canManager: u.canManager,
  isStaff: isStaff(u),
})

// Coincidencia exacta del correo, sin distinguir mayúsculas (9.7).
export async function findUserByEmail(email: string) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
  })
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'No hay ninguna cuenta registrada con ese correo.', 404)
  }
  return toDto(user)
}

// Solo cajero, barista y gerente: el permiso de administrador no se asigna desde el panel (8.1).
export async function setPermissions(
  userId: string,
  permissions: { canCashier: boolean; canBarista: boolean; canManager: boolean },
) {
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) throw new AppError('USER_NOT_FOUND', 'Cuenta no encontrada.', 404)
  const user = await prisma.user.update({ where: { id: userId }, data: permissions })
  // El perfil está guardado 30 s en memoria: se descarta para que el cambio valga de inmediato.
  invalidateUser(userId)
  return toDto(user)
}
