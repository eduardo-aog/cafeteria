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

// Catálogo de demostración (sección 15), sin imágenes: la web usa las genéricas por categoría.
const PRODUCTS = [
  {
    category: 'CAFE',
    name: 'Espresso',
    priceCents: 200,
    description: 'Café corto e intenso, servido solo.',
  },
  {
    category: 'CAFE',
    name: 'Americano',
    priceCents: 250,
    description: 'Espresso alargado con agua caliente.',
  },
  {
    category: 'CAFE',
    name: 'Capuchino',
    priceCents: 350,
    description: 'Espresso con leche vaporizada y espuma cremosa.',
  },
  {
    category: 'CAFE',
    name: 'Latte',
    priceCents: 400,
    description: 'Espresso con abundante leche vaporizada y una capa fina de espuma.',
  },
  {
    category: 'CAFE',
    name: 'Moca',
    priceCents: 450,
    description: 'Espresso con chocolate y leche vaporizada.',
  },
  {
    category: 'CAFE',
    name: 'Macchiato',
    priceCents: 375,
    description: 'Espresso manchado con un toque de espuma de leche.',
  },
  {
    category: 'BEBIDAS',
    name: 'Chocolate caliente',
    priceCents: 350,
    description: 'Chocolate espeso preparado con leche.',
  },
  {
    category: 'BEBIDAS',
    name: 'Té chai',
    priceCents: 325,
    description: 'Té negro especiado con leche vaporizada.',
  },
  {
    category: 'BEBIDAS',
    name: 'Frappé de vainilla',
    priceCents: 475,
    description: 'Bebida fría y cremosa de vainilla con hielo.',
  },
  {
    category: 'BEBIDAS',
    name: 'Limonada',
    priceCents: 275,
    description: 'Limón natural, hielo y un toque de azúcar.',
  },
  {
    category: 'POSTRES',
    name: 'Brownie',
    priceCents: 300,
    description: 'Bizcocho húmedo de chocolate con nueces.',
  },
  {
    category: 'POSTRES',
    name: 'Cheesecake',
    priceCents: 425,
    description: 'Porción de tarta de queso con base de galleta.',
  },
  {
    category: 'POSTRES',
    name: 'Croissant',
    priceCents: 250,
    description: 'Hojaldre de mantequilla horneado cada mañana.',
  },
  {
    category: 'POSTRES',
    name: 'Galleta de avena',
    priceCents: 175,
    description: 'Galleta casera de avena y pasas.',
  },
] as const

// Cuentas de demostración (sección 15): todas con la contraseña SEED_DEMO_PASSWORD.
const DEMO_USERS = [
  { email: 'cajero@demo.com', name: 'Cajero Demo', canCashier: true, pointsBalance: 0 },
  { email: 'barista@demo.com', name: 'Barista Demo', canBarista: true, pointsBalance: 0 },
  { email: 'gerente@demo.com', name: 'Gerente Demo', canManager: true, pointsBalance: 0 },
  { email: 'cliente@demo.com', name: 'Cliente Demo', pointsBalance: 1500 },
]

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

  // Solo se crea si el producto no existe: no pisa lo que el gerente haya editado.
  for (const product of PRODUCTS) {
    const exists = await prisma.product.findFirst({
      where: { name: product.name },
      select: { id: true },
    })
    if (!exists) await prisma.product.create({ data: product })
  }

  // Tasa de respaldo (Bs 886,23) solo si nunca se ha guardado ninguna. Se marca como antigua
  // (fetchedAt) para que el arranque consulte el BCV y cualquier tasa real la reemplace.
  if ((await prisma.exchangeRate.count()) === 0) {
    const today = new Date().toISOString().slice(0, 10)
    await prisma.exchangeRate.create({
      data: {
        rateHundredths: 88623,
        bcvDate: new Date(`${today}T00:00:00Z`),
        fetchedAt: new Date('2000-01-01T00:00:00Z'),
      },
    })
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

  for (const demo of DEMO_USERS) {
    const { email, name, pointsBalance, ...permissions } = demo
    const id = await ensureAuthUser(email, seed.SEED_DEMO_PASSWORD)
    // `update` sin pointsBalance: volver a correr el seed no reinicia los puntos.
    await prisma.user.upsert({
      where: { id },
      update: { name, email, ...permissions },
      create: { id, name, email, pointsBalance, ...permissions },
    })
  }

  console.log(
    `Seed listo: Settings, ${BANKS.length} bancos, ${PRODUCTS.length} productos, administrador y ${DEMO_USERS.length} cuentas de demostración.`,
  )
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
