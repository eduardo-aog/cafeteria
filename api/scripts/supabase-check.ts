import { existsSync, readFileSync } from 'node:fs'
import { parse } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { env } from '../src/config/env.js'

// Comprueba la configuración de Supabase sin mostrar claves.
const webEnvPath = '../web/.env'
const anonKey = existsSync(webEnvPath)
  ? parse(readFileSync(webEnvPath)).VITE_SUPABASE_ANON_KEY?.trim()
  : undefined
if (!anonKey) {
  console.error('Falta VITE_SUPABASE_ANON_KEY en web/.env.')
  process.exit(1)
}

const authOptions = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, authOptions)
const anon = createClient(env.SUPABASE_URL, anonKey, authOptions)

let failed = false
const ok = (msg: string) => console.log(`OK    ${msg}`)
const bad = (msg: string) => {
  failed = true
  console.error(`ERROR ${msg}`)
}

// 1. API de administrador de Auth
const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
if (users.error) bad(`La API de administrador de Auth no responde: ${users.error.message}`)
else ok('La API de administrador de Auth responde.')

// 2. Bucket público
const bucket = await admin.storage.getBucket(env.SUPABASE_STORAGE_BUCKET)
if (bucket.error || !bucket.data) bad(`No existe el bucket "${env.SUPABASE_STORAGE_BUCKET}".`)
else if (!bucket.data.public) bad(`El bucket "${env.SUPABASE_STORAGE_BUCKET}" no es público.`)
else ok(`El bucket "${env.SUPABASE_STORAGE_BUCKET}" existe y es público.`)

// 3. Registro público desactivado: un signUp con la clave pública debe fallar
const email = `check-${crypto.randomUUID()}@example.com`
const signUp = await anon.auth.signUp({ email, password: crypto.randomUUID() })
if (signUp.error) {
  ok('El registro público está desactivado.')
} else {
  bad('El registro público está ACTIVADO: desactiva «Allow new users to sign up».')
  if (signUp.data.user) await admin.auth.admin.deleteUser(signUp.data.user.id)
}

process.exit(failed ? 1 : 0)
