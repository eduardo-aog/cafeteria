import './dev-guard.js'
import { execFileSync } from 'node:child_process'
import { env } from '../src/config/env.js'
import { prisma } from '../src/lib/prisma.js'
import { supabaseAdmin } from '../src/lib/supabase.js'

// Deja la base de datos solo con los datos de demostración (15). DESTRUCTIVO: borra todos los pedidos, cuentas
// (incluidas las de Supabase Auth), movimientos e imágenes. Sin `--confirm` solo muestra lo que borraría.
//   npm run db:reset-demo                       → resumen (no cambia nada)
//   npm run db:reset-demo -- --confirm          → borra y vuelve a crear los datos de demostración
//   npm run db:reset-demo -- --confirm --with-sales   → además, ventas históricas para los reportes
const confirm = process.argv.includes('--confirm')
const withSales = process.argv.includes('--with-sales')
const PAGE = 200

async function authUsers() {
  const users: { id: string; email: string | undefined }[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PAGE })
    if (error) throw new Error(`No se pudieron listar las cuentas de Auth: ${error.message}`)
    users.push(...data.users.map((u) => ({ id: u.id, email: u.email })))
    if (data.users.length < PAGE) return users
  }
}

// Todos los archivos del bucket, entrando en las «carpetas» (cada producto guarda las suyas en la suya).
async function bucketFiles(prefix = ''): Promise<string[]> {
  const bucket = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET)
  const files: string[] = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await bucket.list(prefix, { limit: PAGE, offset })
    if (error) throw new Error(`No se pudo listar el bucket: ${error.message}`)
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null) files.push(...(await bucketFiles(path)))
      else files.push(path)
    }
    if (data.length < PAGE) return files
  }
}

const run = (command: string, args: string[]) => execFileSync(command, args, { stdio: 'inherit' })

const [users, files, orders, payments, movements, coupons, productsWithImage] = await Promise.all([
  authUsers(),
  bucketFiles(),
  prisma.order.count(),
  prisma.paymentSubmission.count(),
  prisma.pointsMovement.count(),
  prisma.coupon.count(),
  prisma.product.count({ where: { imageUrl: { not: null } } }),
])

console.log('Se borrará TODO esto y se volverán a crear solo los datos de demostración:')
console.log(
  `  - ${orders} pedidos, ${payments} envíos de pago, ${movements} movimientos de puntos y ${coupons} cupones`,
)
console.log(
  `  - ${users.length} cuentas de Supabase Auth (incluidas las de demostración y la del administrador)`,
)
console.log(
  `  - ${files.length} imágenes del bucket «${env.SUPABASE_STORAGE_BUCKET}» (${productsWithImage} productos con imagen propia)`,
)
console.log(
  '  - Los productos, recompensas, ajustes y la tasa BCV vuelven a sus valores iniciales.',
)

if (!confirm) {
  console.log('\nNo se cambió nada. Para ejecutarlo de verdad: npm run db:reset-demo -- --confirm')
  await prisma.$disconnect()
  process.exit(0)
}

console.log('\n1/4 Reiniciando la base de datos (prisma migrate reset)…')
// El cliente de Prisma se cierra antes: el reinicio recrea el esquema.
await prisma.$disconnect()
run('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-generate', '--skip-seed'])

console.log('\n2/4 Borrando las cuentas de Supabase Auth…')
for (const user of users) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (error)
    throw new Error(`No se pudo borrar la cuenta ${user.email ?? user.id}: ${error.message}`)
}
console.log(`  ${users.length} cuentas borradas.`)

console.log('\n3/4 Vaciando el bucket de imágenes…')
const bucket = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET)
for (let i = 0; i < files.length; i += 100) {
  const { error } = await bucket.remove(files.slice(i, i + 100))
  if (error) throw new Error(`No se pudo vaciar el bucket: ${error.message}`)
}
console.log(`  ${files.length} imágenes borradas.`)

console.log('\n4/4 Creando los datos de demostración (seed)…')
run('npx', ['tsx', 'prisma/seed.ts'])
if (withSales) run('npx', ['tsx', 'prisma/seed-sales.ts'])
console.log('\nListo. La tasa BCV real se guarda sola la próxima vez que arranque el servidor.')
