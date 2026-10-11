import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { getAllowedOrigins } from './config/env.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'
import { requireTrustedOrigin } from './middlewares/security.middleware.js'
import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.routes.js'

const app = express()
const allowedOrigins = getAllowedOrigins()

app.disable('x-powered-by')

// Vercel sits one proxy hop in front of the function and sets X-Forwarded-For/Proto.
const trustProxy = process.env.TRUST_PROXY || (process.env.VERCEL ? "1" : "")

if (trustProxy) {
    app.set('trust proxy', Number(trustProxy))
}

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'OK' })
})

app.use('/api/auth', requireTrustedOrigin(allowedOrigins), authRoutes)
app.use('/api/products', productRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
