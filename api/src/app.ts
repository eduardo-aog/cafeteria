import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './config/env.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { meRouter } from './routes/me.js'
import { menuRouter } from './routes/menu.js'
import { managerRouter } from './routes/manager.js'
import { adminRouter } from './routes/admin.js'
import { baristaRouter } from './routes/barista.js'
import { cashierRouter } from './routes/cashier.js'
import { checkoutRouter } from './routes/checkout.js'
import { ordersRouter } from './routes/orders.js'
import { errorHandler, notFound } from './middleware/error.js'

export const app = express()

// Solo en desarrollo: tiempo de cada petición, para saber qué acción es lenta.
if (env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      console.log(
        `${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start} ms`,
      )
    })
    next()
  })
}

app.use(helmet())
app.use(cors({ origin: env.WEB_ORIGIN }))
app.use(express.json({ limit: '100kb' }))

app.use('/api', healthRouter)
app.use('/api', authRouter)
app.use('/api', meRouter)
app.use('/api', menuRouter)
app.use('/api', managerRouter)
app.use('/api', adminRouter)
app.use('/api', checkoutRouter)
app.use('/api', cashierRouter)
app.use('/api', baristaRouter)
app.use('/api', ordersRouter)

app.use(notFound)
app.use(errorHandler)
