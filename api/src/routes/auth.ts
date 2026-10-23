import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/error.js'

export const authRouter = Router()

// La confirmación de contraseña se valida solo en el formulario (8.1).
const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254).trim().toLowerCase(),
  password: z.string().min(8).max(72),
})

const emailTaken = () => new AppError('EMAIL_TAKEN', 'Ese correo ya está registrado.', 409)

authRouter.post('/auth/register', async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body)

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (created.error || !created.data.user) {
    if (created.error?.code === 'email_exists') throw emailTaken()
    throw new Error(`No se pudo crear el usuario de Auth: ${created.error?.message}`)
  }
  const authId = created.data.user.id

  try {
    await prisma.user.create({ data: { id: authId, name, email } })
  } catch (err) {
    // Sin fila User no hay cuenta: se borra el usuario de Auth para no dejar huérfanos.
    await supabaseAdmin.auth.admin.deleteUser(authId)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw emailTaken()
    }
    throw err
  }

  res.status(201).json({ id: authId })
})
