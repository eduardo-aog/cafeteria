import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import express from 'express'
import type { User } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { errorHandler } from './error.js'
import { requireAnyPerm, requireCustomer, requirePerm } from './permissions.js'

const base: User = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Prueba',
  email: 'prueba@example.com',
  isAdmin: false,
  canCashier: false,
  canBarista: false,
  canManager: false,
  pointsBalance: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// En lugar de requireAuth (que usa Supabase), la cuenta llega en una cabecera de la prueba.
const app = express()
app.use((req, _res, next) => {
  const raw = req.headers['x-test-user']
  if (typeof raw === 'string') req.user = { ...base, ...JSON.parse(raw) }
  next()
})
app.get('/customer', requireCustomer, (_req, res) => void res.json({ ok: true }))
app.get('/cashier', requirePerm('cashier'), (_req, res) => void res.json({ ok: true }))
app.get('/admin', requirePerm('admin'), (_req, res) => void res.json({ ok: true }))
app.get(
  '/queue',
  requireAnyPerm('barista', 'manager', 'admin'),
  (_req, res) => void res.json({ ok: true }),
)
app.use(errorHandler)

let server: Server
let url: string
beforeAll(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => void server.close())

async function call(path: string, user?: Partial<User>) {
  const res = await fetch(url + path, {
    headers: user ? { 'x-test-user': JSON.stringify(user) } : {},
  })
  return { status: res.status, body: (await res.json()) as { error?: { code: string } } }
}

describe('middlewares de permisos', () => {
  it('un cliente recibe 403 FORBIDDEN en una ruta de cajero', async () => {
    const r = await call('/cashier', {})
    expect(r.status).toBe(403)
    expect(r.body.error?.code).toBe('FORBIDDEN')
  })

  it('un cliente recibe 403 en una ruta de administrador', async () => {
    expect((await call('/admin', {})).status).toBe(403)
  })

  it('un cajero entra a su ruta pero no a la de administrador', async () => {
    expect((await call('/cashier', { canCashier: true })).status).toBe(200)
    expect((await call('/admin', { canCashier: true })).status).toBe(403)
  })

  it('el administrador entra a la cola de barra pero no a la de cajero', async () => {
    expect((await call('/queue', { isAdmin: true })).status).toBe(200)
    expect((await call('/cashier', { isAdmin: true })).status).toBe(403)
  })

  it('sin usuario responde 401', async () => {
    const r = await call('/cashier')
    expect(r.status).toBe(401)
    expect(r.body.error?.code).toBe('UNAUTHENTICATED')
  })

  it('una cuenta de trabajo recibe 403 STAFF_CANNOT_BUY en rutas de cliente', async () => {
    const r = await call('/customer', { canBarista: true })
    expect(r.status).toBe(403)
    expect(r.body.error?.code).toBe('STAFF_CANNOT_BUY')
    expect((await call('/customer', {})).status).toBe(200)
  })
})
