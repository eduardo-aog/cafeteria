import 'dotenv/config'
import { z } from 'zod'

const baseSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('product-images'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().min(1),
  BCV_API_URL: z.url(),
})

// Las variables SEED_* solo son obligatorias para el seed.
const seedSchema = z.object({
  SEED_ADMIN_NAME: z.string().min(1),
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  SEED_DEMO_PASSWORD: z.string().min(8),
})

function fail(label: string, error: z.ZodError): never {
  const names = [...new Set(error.issues.map((i) => i.path.join('.')))]
  console.error(`${label}: faltan o son inválidas estas variables de entorno: ${names.join(', ')}`)
  process.exit(1)
}

function parse<T extends z.ZodType>(schema: T, label: string): z.infer<T> {
  const result = schema.safeParse(process.env)
  if (!result.success) fail(label, result.error)
  return result.data
}

export const env = parse(baseSchema, 'Configuración')

export function getSeedEnv() {
  return parse(seedSchema, 'Seed')
}
