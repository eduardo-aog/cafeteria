import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

// Lista las variables que faltan o están vacías, sin mostrar sus valores.
const example = parseEnv(readFileSync('.env.example', 'utf8'))
if (!existsSync('.env')) {
  console.error('No existe web/.env. Créalo con: cp web/.env.example web/.env')
  process.exit(1)
}
const actual = parseEnv(readFileSync('.env', 'utf8'))
const missing = Object.keys(example).filter((key) => !actual[key]?.trim())

if (missing.length > 0) {
  console.error(`Faltan o están vacías en web/.env (${missing.length}):`)
  for (const key of missing) console.error(`  - ${key}`)
  process.exit(1)
}
console.log('web/.env está completo.')
