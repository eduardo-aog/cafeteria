import { existsSync, readFileSync } from 'node:fs'
import { parse } from 'dotenv'

// Lista las variables que faltan o están vacías, sin mostrar sus valores.
const example = parse(readFileSync('.env.example'))
if (!existsSync('.env')) {
  console.error('No existe api/.env. Créalo con: cp api/.env.example api/.env')
  process.exit(1)
}
const actual = parse(readFileSync('.env'))
const missing = Object.keys(example).filter((key) => !actual[key]?.trim())

if (missing.length > 0) {
  console.error(`Faltan o están vacías en api/.env (${missing.length}):`)
  for (const key of missing) console.error(`  - ${key}`)
  process.exit(1)
}
console.log('api/.env está completo.')
