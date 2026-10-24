import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parse } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { getSeedEnv, env } from '../src/config/env.js'
import { endOfMonthCaracas } from '../src/domain/coupons.js'
import { prisma } from '../src/lib/prisma.js'
import { supabaseAdmin } from '../src/lib/supabase.js'
import { expireStaleCoupons } from '../src/services/coupons.js'
import { expireStaleCheckouts } from '../src/services/checkoutExpiration.js'

const seed = getSeedEnv()
const anon = createClient(env.SUPABASE_URL, parse(readFileSync('../web/.env')).VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
const base = 'http://localhost:3000/api'
let failed = 0
const check = (name: string, ok: boolean, extra = '') => { if (!ok) failed++; console.log(`${ok ? 'OK   ' : 'FALLA'} ${name} ${extra}`) }
const login = async (email: string, pw: string) => { const { data, error } = await anon.auth.signInWithPassword({ email, password: pw }); if (error) throw new Error(error.message); return data.session.access_token }
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const times: Record<string, number[]> = {}
async function call(method: string, path: string, token?: string, body?: unknown) {
  const t0 = Date.now()
  const r = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined })
  const out = { status: r.status, body: (await r.json().catch(() => null)) as any }
  ;(times[`${method} ${path.split('?')[0].replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, ':id')}`] ??= []).push(Date.now() - t0)
  return out
}
const saved = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })
let tempId = ''
const createdRewards: string[] = []

try {
  await prisma.settings.update({ where: { id: 1 }, data: { openDays: [1, 2, 3, 4, 5, 6, 7], openTime: '00:00', closeTime: '23:59' } })
  await wait(11_000)
  const demo = seed.SEED_DEMO_PASSWORD
  const [cajero, gerente, admin, otro] = await Promise.all([login('cajero@demo.com', demo), login('gerente@demo.com', demo), login(seed.SEED_ADMIN_EMAIL, seed.SEED_ADMIN_PASSWORD), login('cliente@demo.com', demo)])
  const email = `e2e8-${randomUUID().slice(0, 8)}@example.com`
  tempId = (await call('POST', '/auth/register', undefined, { name: 'Pto E2E', email, password: 'clave-e2e-1234' })).body.id
  const T = await login(email, 'clave-e2e-1234')
  await prisma.user.update({ where: { id: tempId }, data: { pointsBalance: 1500 } })
  const [latte, espresso, moca] = await Promise.all(['Latte', 'Espresso', 'Moca'].map((n) => prisma.product.findFirstOrThrow({ where: { name: n } })))
  const otherUser = await prisma.user.findUniqueOrThrow({ where: { email: 'cliente@demo.com' } })
  const bal = async () => (await prisma.user.findUniqueOrThrow({ where: { id: tempId } })).pointsBalance
  const coupon = (id: string) => prisma.coupon.findUniqueOrThrow({ where: { id } })

  // ---------- Recompensas: catálogo del cliente ----------
  const cat = await call('GET', '/rewards', T)
  const names = cat.body.rewards.map((r: any) => r.name)
  check('catálogo: las 4 recompensas del seed, de menor a mayor costo', cat.status === 200 && ['50 % en un producto', 'Chocolate gratis', 'Latte gratis', 'Moca gratis'].every((n) => names.includes(n)) && cat.body.rewards.every((r: any, i: number, a: any[]) => i === 0 || a[i - 1].costPoints <= r.costPoints), names.join(', '))
  const exp = endOfMonthCaracas(new Date())
  check('catálogo: saldo y vencimiento del cupón (fin de mes en Caracas, días y aviso)', cat.body.balance === 1500 && new Date(cat.body.expiry.expiresAt).getTime() === exp.getTime() && typeof cat.body.expiry.daysLeft === 'number' && typeof cat.body.expiry.isExpiringSoon === 'boolean', JSON.stringify(cat.body.expiry))
  check('catálogo: el producto gratis lleva el nombre del producto', cat.body.rewards.find((r: any) => r.name === 'Latte gratis').productName === 'Latte')
  check('catálogo: cuenta de trabajo → 403, sin sesión → 401', (await call('GET', '/rewards', cajero)).status === 403 && (await call('GET', '/rewards')).status === 401)

  // ---------- Administrador: crear, validar, editar, desactivar ----------
  check('admin: el gerente no puede (403)', (await call('GET', '/admin/rewards', gerente)).status === 403 && (await call('POST', '/admin/rewards', gerente, { name: 'x', type: 'PERCENT_DISCOUNT', percent: 10, costPoints: 10 })).status === 403)
  const list0 = await call('GET', '/admin/rewards', admin)
  check('admin: lista todas', list0.status === 200 && list0.body.rewards.length >= 4)
  for (const [name, body] of [
    ['porcentaje sin percent', { name: 'T', type: 'PERCENT_DISCOUNT', costPoints: 10 }],
    ['percent 0', { name: 'T', type: 'PERCENT_DISCOUNT', percent: 0, costPoints: 10 }],
    ['percent 101', { name: 'T', type: 'PERCENT_DISCOUNT', percent: 101, costPoints: 10 }],
    ['porcentaje con producto', { name: 'T', type: 'PERCENT_DISCOUNT', percent: 10, productId: latte.id, costPoints: 10 }],
    ['producto gratis sin producto', { name: 'T', type: 'FREE_PRODUCT', costPoints: 10 }],
    ['producto gratis con porcentaje', { name: 'T', type: 'FREE_PRODUCT', productId: latte.id, percent: 10, costPoints: 10 }],
    ['costo 0', { name: 'T', type: 'PERCENT_DISCOUNT', percent: 10, costPoints: 0 }],
    ['nombre vacío', { name: ' ', type: 'PERCENT_DISCOUNT', percent: 10, costPoints: 10 }],
  ] as const) check(`admin: ${name} → 400`, (await call('POST', '/admin/rewards', admin, body)).status === 400)
  check('admin: producto inexistente → 404', (await call('POST', '/admin/rewards', admin, { name: 'T', type: 'FREE_PRODUCT', productId: randomUUID(), costPoints: 10 })).status === 404)
  const rPct = (await call('POST', '/admin/rewards', admin, { name: 'E2E 20 %', type: 'PERCENT_DISCOUNT', percent: 20, costPoints: 100 })).body.reward
  const rFree = (await call('POST', '/admin/rewards', admin, { name: 'E2E Espresso gratis', type: 'FREE_PRODUCT', productId: espresso.id, costPoints: 300 })).body.reward
  createdRewards.push(rPct.id, rFree.id)
  check('admin: crea un descuento y un producto gratis (activos)', rPct.isActive && rFree.isActive && rFree.productName === 'Espresso')
  check('admin: editar costo y nombre', (await call('PATCH', `/admin/rewards/${rPct.id}`, admin, { costPoints: 150, name: 'E2E 20 % editado' })).body.reward.costPoints === 150)
  check('admin: editar a un estado inválido (porcentaje a producto gratis sin producto) → 400', (await call('PATCH', `/admin/rewards/${rPct.id}`, admin, { type: 'FREE_PRODUCT' })).status === 400)
  check('admin: recompensa inexistente → 404', (await call('PATCH', `/admin/rewards/${randomUUID()}`, admin, { costPoints: 5 })).status === 404)

  // ---------- Canje ----------
  const r1 = await call('POST', `/rewards/${rPct.id}/redeem`, T)
  const c1 = r1.body.coupon
  check('canjear → 201 con cupón AVAILABLE', r1.status === 201 && c1.status === 'AVAILABLE' && c1.title === 'E2E 20 % editado' && c1.type === 'PERCENT_DISCOUNT' && c1.percent === 20)
  const c1Db = await coupon(c1.id)
  check('el cupón vence el último instante del mes en Caracas (UTC)', c1Db.expiresAt.getTime() === exp.getTime(), c1Db.expiresAt.toISOString())
  check('puntos descontados y movimiento REDEEM negativo con el cupón', (await bal()) === 1350 && !!(await prisma.pointsMovement.findFirst({ where: { userId: tempId, type: 'REDEEM', points: -150, couponId: c1.id } })))
  check('cuenta de trabajo no puede canjear (403)', (await call('POST', `/rewards/${rPct.id}/redeem`, cajero)).status === 403)
  check('canjear una recompensa inexistente → 404', (await call('POST', `/rewards/${randomUUID()}/redeem`, T)).status === 404)
  await prisma.user.update({ where: { id: tempId }, data: { pointsBalance: 100 } })
  const poor = await call('POST', `/rewards/${rPct.id}/redeem`, T)
  check('sin puntos suficientes → 409 INSUFFICIENT_POINTS y no cambia nada', poor.status === 409 && poor.body.error.code === 'INSUFFICIENT_POINTS' && (await bal()) === 100 && (await prisma.coupon.count({ where: { userId: tempId } })) === 1)
  // dos canjes simultáneos con puntos para uno solo
  await prisma.user.update({ where: { id: tempId }, data: { pointsBalance: 150 } })
  const race = await Promise.all([call('POST', `/rewards/${rPct.id}/redeem`, T), call('POST', `/rewards/${rPct.id}/redeem`, T)])
  check('dos canjes simultáneos con puntos para uno: solo uno funciona', race.filter((r) => r.status === 201).length === 1 && race.filter((r) => r.status === 409).length === 1 && (await bal()) === 0 && (await prisma.coupon.count({ where: { userId: tempId } })) === 2, race.map((r) => r.status).join(','))
  await prisma.user.update({ where: { id: tempId }, data: { pointsBalance: 2000 } })
  const cFree = (await call('POST', `/rewards/${rFree.id}/redeem`, T)).body.coupon
  check('canje de producto gratis', cFree.type === 'FREE_PRODUCT' && cFree.productId === espresso.id && cFree.productName === 'Espresso')
  // desactivar
  check('admin: desactivar', (await call('PATCH', `/admin/rewards/${rPct.id}`, admin, { isActive: false })).body.reward.isActive === false)
  check('desactivada: no aparece en el catálogo del cliente', !(await call('GET', '/rewards', T)).body.rewards.some((r: any) => r.id === rPct.id))
  const off = await call('POST', `/rewards/${rPct.id}/redeem`, T)
  check('desactivada: no se puede canjear (409)', off.status === 409 && off.body.error.code === 'REWARD_NOT_AVAILABLE')
  check('desactivada: los cupones ya canjeados siguen válidos', (await call('GET', '/coupons', T)).body.coupons.some((c: any) => c.id === c1.id && c.status === 'AVAILABLE'))
  await call('PATCH', `/admin/rewards/${rPct.id}`, admin, { isActive: true })

  // ---------- Puntos y movimientos ----------
  const pts = await call('GET', '/points', T)
  check('puntos: saldo y movimientos con el título del cupón', pts.status === 200 && pts.body.balance === (await bal()) && pts.body.movements.every((m: any) => m.type === 'REDEEM' && m.points < 0 && m.couponTitle) && pts.body.movements.length === 3, `saldo ${pts.body.balance}`)
  check('puntos: cuenta de trabajo → 403', (await call('GET', '/points', cajero)).status === 403)
  await prisma.pointsMovement.createMany({ data: Array.from({ length: 22 }, (_, i) => ({ userId: tempId, type: 'EARN' as const, points: 10 + i, createdAt: new Date(Date.now() - (i + 1) * 3600_000) })) })
  const p1 = await call('GET', '/points', T)
  const p2 = await call('GET', `/points?cursor=${p1.body.nextCursor}`, T)
  const ids = [...p1.body.movements, ...p2.body.movements].map((m: any) => m.id)
  check('puntos: 25 movimientos en dos páginas (20 + 5), sin repetidos y del más reciente al más antiguo', p1.body.movements.length === 20 && p2.body.movements.length === 5 && p2.body.nextCursor === null && new Set(ids).size === 25 && p1.body.movements.every((m: any, i: number, a: any[]) => i === 0 || new Date(a[i - 1].createdAt) >= new Date(m.createdAt)))

  // ---------- Mis cupones ----------
  const mine = (await call('GET', '/coupons?status=available', T)).body.coupons
  const cDto = mine.find((c: any) => c.id === c1.id)
  check('mis cupones: disponibles con vencimiento y días', mine.length === 3 && !!cDto.expiresAt && typeof cDto.daysLeft === 'number' && cDto.isUsable === true)
  check('mis cupones: usados y vencidos vacíos; parámetro inválido → 400', (await call('GET', '/coupons?status=used', T)).body.coupons.length === 0 && (await call('GET', '/coupons?status=expired', T)).body.coupons.length === 0 && (await call('GET', '/coupons?status=otro', T)).status === 400)
  check('mis cupones: otro cliente no ve estos cupones', !(await call('GET', '/coupons', otro)).body.coupons.some((c: any) => c.id === c1.id))

  // ---------- Cupones aplicables en el producto ----------
  const forLatte = (await call('GET', `/products/${latte.id}/coupons`, T)).body.coupons.map((c: any) => c.id)
  const forEsp = (await call('GET', `/products/${espresso.id}/coupons`, T)).body.coupons.map((c: any) => c.id)
  check('en el Latte aparecen solo los cupones de porcentaje', forLatte.includes(c1.id) && !forLatte.includes(cFree.id) && forLatte.length === 2)
  check('en el Espresso aparecen el de porcentaje y el de Espresso gratis', forEsp.includes(c1.id) && forEsp.includes(cFree.id) && forEsp.length === 3)
  check('cupones del producto: cuenta de trabajo → 403, producto inexistente → 404', (await call('GET', `/products/${latte.id}/coupons`, cajero)).status === 403 && (await call('GET', `/products/${randomUUID()}/coupons`, T)).status === 404)

  // ---------- Agregar con cupón ----------
  const withCoupon = (productId: string, couponId: string, quantity = 1) => call('POST', '/checkout/items', T, { productId, quantity, couponId })
  const a1 = await withCoupon(latte.id, c1.id)
  const ck = a1.body.checkout
  check('agregar con cupón → línea de 1 unidad con el cupón', a1.status === 201 && ck.items.length === 1 && ck.items[0].quantity === 1 && ck.items[0].couponTitle === 'E2E 20 % editado' && ck.items[0].discountCents === Math.round(latte.priceCents * 20 / 100), JSON.stringify(ck.items[0]).slice(0, 140))
  check('el cupón queda RESERVED', (await coupon(c1.id)).status === 'RESERVED')
  const a2 = await call('POST', '/checkout/items', T, { productId: latte.id, quantity: 1 })
  check('el mismo producto sin cupón crea otra línea (no se mezcla)', a2.body.checkout.items.length === 2 && a2.body.checkout.items.filter((i: any) => i.couponTitle).length === 1)
  check('la línea con cupón tiene total menor y el total del checkout los suma', a2.body.checkout.totalCents === (latte.priceCents - Math.round(latte.priceCents * 20 / 100)) + latte.priceCents)
  check('el mismo cupón otra vez → 409 COUPON_NOT_APPLICABLE', (await withCoupon(moca.id, c1.id)).body.error?.code === 'COUPON_NOT_APPLICABLE')
  check('cupón de producto gratis en otro producto → 409', (await withCoupon(latte.id, cFree.id)).body.error?.code === 'COUPON_NOT_APPLICABLE')
  const foreign = await prisma.coupon.create({ data: { userId: otherUser.id, rewardId: rPct.id, title: 'ajeno', type: 'PERCENT_DISCOUNT', percent: 10, pointsCost: 1, expiresAt: new Date(Date.now() + 5 * 86400_000) } })
  check('cupón de otro usuario → 409', (await withCoupon(latte.id, foreign.id)).body.error?.code === 'COUPON_NOT_APPLICABLE')
  const dead = await prisma.coupon.create({ data: { userId: tempId, rewardId: rPct.id, title: 'vencido', type: 'PERCENT_DISCOUNT', percent: 10, pointsCost: 1, expiresAt: new Date(Date.now() - 60_000) } })
  check('cupón con la fecha vencida → 409', (await withCoupon(latte.id, dead.id)).body.error?.code === 'COUPON_NOT_APPLICABLE')
  check('cupón inexistente → 409; con cantidad 2 → 400', (await withCoupon(latte.id, randomUUID())).status === 409 && (await withCoupon(latte.id, cFree.id, 2)).status === 400)
  const lineCoupon = (await call('GET', '/checkouts', T)).body.checkouts[0].items.find((i: any) => i.couponTitle)
  check('no se cambia la cantidad de una línea con cupón (409)', (await call('PATCH', `/checkout/items/${lineCoupon.id}`, T, { quantity: 3 })).status === 409)

  // ---------- Liberación de cupones ----------
  const afterRemove = await call('DELETE', `/checkout/items/${lineCoupon.id}`, T)
  check('quitar la línea con cupón lo devuelve a AVAILABLE', afterRemove.status === 200 && (await coupon(c1.id)).status === 'AVAILABLE')
  await withCoupon(latte.id, c1.id)
  const open = (await call('GET', '/checkouts', T)).body.checkouts[0]
  check('cancelar el checkout libera los cupones', (await call('POST', `/checkouts/${open.id}/cancel`, T)).status === 200 && (await coupon(c1.id)).status === 'AVAILABLE')
  // expirar el checkout
  const e1 = (await withCoupon(latte.id, c1.id)).body.checkout
  await prisma.order.update({ where: { id: e1.id }, data: { expiresAt: new Date(Date.now() - 60_000) } })
  const lazy = (await call('GET', '/checkouts', T)).body.checkouts.find((c: any) => c.id === e1.id)
  check('al expirar el checkout (lectura perezosa) el cupón vuelve a AVAILABLE', lazy.status === 'EXPIRED' && (await coupon(c1.id)).status === 'AVAILABLE')
  // la tarea de expiración de checkouts también libera
  const e2 = (await withCoupon(latte.id, c1.id)).body.checkout
  await prisma.order.update({ where: { id: e2.id }, data: { expiresAt: new Date(Date.now() - 60_000) } })
  await expireStaleCheckouts(prisma)
  check('la tarea de expiración de checkouts libera el cupón', (await coupon(c1.id)).status === 'AVAILABLE' && (await prisma.order.findUniqueOrThrow({ where: { id: e2.id } })).status === 'EXPIRED')
  // cupón que ya pasó su fecha: al liberar queda EXPIRED
  const e3 = (await withCoupon(latte.id, c1.id)).body.checkout
  await prisma.coupon.update({ where: { id: c1.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
  await call('POST', `/checkouts/${e3.id}/cancel`, T)
  check('si ya pasó su fecha, al liberarlo pasa a EXPIRED', (await coupon(c1.id)).status === 'EXPIRED')

  // ---------- Un cupón RESERVED no vence; la tarea solo vence AVAILABLE ----------
  const e4 = (await withCoupon(latte.id, cFree.id.replace(cFree.id, (await prisma.coupon.create({ data: { userId: tempId, rewardId: rPct.id, title: 'reservado', type: 'PERCENT_DISCOUNT', percent: 10, pointsCost: 1, expiresAt: new Date(Date.now() + 86400_000) } })).id))).body.checkout
  const reserved = (await prisma.coupon.findFirstOrThrow({ where: { userId: tempId, title: 'reservado' } }))
  await prisma.coupon.update({ where: { id: reserved.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
  await expireStaleCoupons(prisma)
  check('un cupón RESERVED sigue siendo válido aunque pase su fecha (la tarea no lo vence)', (await coupon(reserved.id)).status === 'RESERVED')
  const prep = await call('POST', `/checkouts/${e4.id}/prepare-payment`, T)
  check('y el pedido puede pagarse con él', prep.status === 200, prep.body.error?.message)
  await call('POST', `/checkouts/${e4.id}/cancel`, T)

  // ---------- Vencimiento (tarea y lectura perezosa) ----------
  const avail = await prisma.coupon.create({ data: { userId: tempId, rewardId: rPct.id, title: 'por vencer', type: 'PERCENT_DISCOUNT', percent: 10, pointsCost: 1, expiresAt: new Date(Date.now() - 1000) } })
  const exp1 = await expireStaleCoupons(prisma)
  check('la tarea vence los AVAILABLE con la fecha pasada y es idempotente', exp1 >= 1 && (await coupon(avail.id)).status === 'EXPIRED' && (await expireStaleCoupons(prisma)) === 0)
  const lazyCoupon = await prisma.coupon.create({ data: { userId: tempId, rewardId: rPct.id, title: 'perezoso', type: 'PERCENT_DISCOUNT', percent: 10, pointsCost: 1, expiresAt: new Date(Date.now() - 1000) } })
  const expiredTab = (await call('GET', '/coupons?status=expired', T)).body.coupons
  check('al leer «vencidos» el cupón se vence solo (lectura perezosa)', expiredTab.some((c: any) => c.id === lazyCoupon.id) && !(await call('GET', '/coupons?status=available', T)).body.coupons.some((c: any) => c.id === lazyCoupon.id))

  // ---------- Producto gratis dado de baja ----------
  await call('PATCH', `/admin/products/${espresso.id}/active`, admin, { isActive: false })
  const free2 = (await call('GET', '/coupons?status=available', T)).body.coupons.find((c: any) => c.id === cFree.id)
  check('producto dado de baja: el cupón gratis queda «no utilizable»', free2.isUsable === false)
  check('y no se ofrece ni se puede aplicar', (await call('GET', `/products/${espresso.id}/coupons`, T)).status === 404 && (await withCoupon(espresso.id, cFree.id)).status === 409)
  await call('PATCH', `/admin/products/${espresso.id}/active`, admin, { isActive: true })
  check('al reactivar el producto vuelve a ser utilizable', (await call('GET', '/coupons?status=available', T)).body.coupons.find((c: any) => c.id === cFree.id).isUsable === true)
} finally {
  console.log('\n--- Tiempos por endpoint (ms): n / mediana / máximo')
  for (const [k, v] of Object.entries(times).sort()) { const a = [...v].sort((x, y) => x - y); console.log(`${k.padEnd(44)} ${v.length} / ${a[Math.floor(a.length / 2)]} / ${a.at(-1)}`) }
  if (tempId) {
    await prisma.order.deleteMany({ where: { customerId: tempId } })
    await prisma.pointsMovement.deleteMany({ where: { userId: tempId } })
    await prisma.coupon.deleteMany({ where: { OR: [{ userId: tempId }, { title: 'ajeno' }] } })
  }
  if (createdRewards.length) await prisma.reward.deleteMany({ where: { id: { in: createdRewards } } })
  if (tempId) { await prisma.user.deleteMany({ where: { id: tempId } }); await supabaseAdmin.auth.admin.deleteUser(tempId) }
  await prisma.settings.update({ where: { id: 1 }, data: { openDays: saved.openDays, openTime: saved.openTime, closeTime: saved.closeTime } })
  const esp = await prisma.product.findFirstOrThrow({ where: { name: 'Espresso' } })
  console.log('restos:', await prisma.user.count({ where: { email: { startsWith: 'e2e8-' } } }), 'usuarios,', await prisma.reward.count({ where: { name: { startsWith: 'E2E' } } }), 'recompensas | Espresso activo:', esp.isActive, '| recompensas del seed:', await prisma.reward.count())
  await prisma.$disconnect()
}
console.log(failed ? `\n${failed} FALLAS` : '\nTODO OK')
process.exit(failed ? 1 : 0)
