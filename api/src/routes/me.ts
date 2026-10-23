import { Router } from 'express'
import { effectivePermissions, isStaff } from '../domain/permissions.js'
import { requireAuth } from '../middleware/auth.js'

export const meRouter = Router()

meRouter.get('/me', requireAuth, (req, res) => {
  const user = req.user!
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    permissions: effectivePermissions(user),
    isStaff: isStaff(user),
    pointsBalance: user.pointsBalance,
  })
})
