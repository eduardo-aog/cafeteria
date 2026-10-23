import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './config/env.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { meRouter } from './routes/me.js'
import { errorHandler, notFound } from './middleware/error.js'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.WEB_ORIGIN }))
app.use(express.json({ limit: '100kb' }))

app.use('/api', healthRouter)
app.use('/api', authRouter)
app.use('/api', meRouter)

app.use(notFound)
app.use(errorHandler)
