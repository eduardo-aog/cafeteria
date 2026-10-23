import type { RequestHandler } from 'express'
import type { User } from '@prisma/client'
import { hasAnyPerm, isStaff, type Perm } from '../domain/permissions.js'
import { AppError } from './error.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: User
  }
}

const unauthenticated = () =>
  new AppError('UNAUTHENTICATED', 'Debes iniciar sesión para continuar.', 401)

// Todos van después de requireAuth, que es quien carga req.user.
export const requireCustomer: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthenticated())
  if (isStaff(req.user)) {
    return next(
      new AppError('STAFF_CANNOT_BUY', 'Las cuentas de trabajo no pueden comprar ni canjear.', 403),
    )
  }
  next()
}

export function requireAnyPerm(...perms: Perm[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(unauthenticated())
    if (!hasAnyPerm(req.user, perms)) {
      return next(new AppError('FORBIDDEN', 'No tienes permiso para esta acción.', 403))
    }
    next()
  }
}

export function requirePerm(perm: Perm): RequestHandler {
  return requireAnyPerm(perm)
}
