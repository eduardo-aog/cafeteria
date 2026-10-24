import { env } from './config/env.js'
import { app } from './app.js'
import { startJobs } from './jobs/index.js'
import { prisma } from './lib/prisma.js'

app.listen(env.PORT, () => {
  console.log(`API escuchando en el puerto ${env.PORT}`)
  // Abre la conexión a la base de datos ya, para que la primera petición no pague ese tiempo.
  prisma.$connect().catch((err: unknown) => {
    console.error(
      'No se pudo abrir la conexión a la base de datos:',
      err instanceof Error ? err.message : err,
    )
  })
  startJobs()
})
