import { getSeedEnv } from '../src/config/env.js'
import { prisma } from '../src/lib/prisma.js'
import { supabaseAdmin } from '../src/lib/supabase.js'

const BANKS = [
  ['0102', 'Banco de Venezuela'],
  ['0104', 'Venezolano de Crédito'],
  ['0105', 'Mercantil'],
  ['0108', 'BBVA Provincial'],
  ['0114', 'Bancaribe'],
  ['0115', 'Banco Exterior'],
  ['0128', 'Banco Caroní'],
  ['0134', 'Banesco'],
  ['0137', 'Sofitasa'],
  ['0138', 'Banco Plaza'],
  ['0146', 'Bangente'],
  ['0151', 'BFC Banco Fondo Común'],
  ['0156', '100% Banco'],
  ['0157', 'DelSur'],
  ['0163', 'Banco del Tesoro'],
  ['0166', 'Banco Agrícola de Venezuela'],
  ['0168', 'Bancrecer'],
  ['0169', 'R4 Banco Microfinanciero'],
  ['0171', 'Banco Activo'],
  ['0172', 'Bancamiga'],
  ['0173', 'Banco Internacional de Desarrollo'],
  ['0174', 'Banplus'],
  ['0175', 'Banco Digital de los Trabajadores'],
  ['0177', 'BANFANB'],
  ['0178', 'N58 Banco Digital'],
  ['0191', 'BNC Banco Nacional de Crédito'],
] as const

// Devuelve el id del usuario de Auth con ese correo; lo crea si no existe.
async function ensureAuthUser(email: string, password: string): Promise<string> {
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (created.data.user) return created.data.user.id

  // Ya existía: se busca entre los usuarios de Auth.
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`No se pudo listar los usuarios de Auth: ${error.message}`)
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found.id
    if (data.users.length < 200) break
  }
  throw new Error(
    `No se pudo crear el usuario de Auth ${email}: ${created.error?.message ?? 'error desconocido'}`,
  )
}

async function main() {
  const seed = getSeedEnv()

  // Los valores por defecto ya vienen del esquema; solo se fijan los datos de cobro de ejemplo.
  // `update` vacío: no pisa lo que el administrador haya editado.
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      paymentDocType: 'J',
      paymentDocNumber: '123456789',
      paymentBankCode: '0134',
      paymentPhone: '04141234567',
    },
  })

  for (const [code, name] of BANKS) {
    await prisma.bank.upsert({ where: { code }, update: { name }, create: { code, name } })
  }

  const adminId = await ensureAuthUser(seed.SEED_ADMIN_EMAIL, seed.SEED_ADMIN_PASSWORD)
  await prisma.user.upsert({
    where: { id: adminId },
    update: { name: seed.SEED_ADMIN_NAME, email: seed.SEED_ADMIN_EMAIL, isAdmin: true },
    create: {
      id: adminId,
      name: seed.SEED_ADMIN_NAME,
      email: seed.SEED_ADMIN_EMAIL,
      isAdmin: true,
    },
  })

  console.log(`Seed listo: Settings, ${BANKS.length} bancos y administrador.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
