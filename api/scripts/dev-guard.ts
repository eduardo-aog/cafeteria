import { env } from '../src/config/env.js'

// Los scripts dev:* alteran datos a propósito: nunca deben correr contra producción.
if (env.NODE_ENV === 'production') {
  console.error('Este script solo es para desarrollo: se niega a correr con NODE_ENV=production.')
  process.exit(1)
}
