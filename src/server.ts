import express from 'express'
import authRoutes from './routes/authRoutes.ts'
import userRoutes from './routes/userRoutes.ts'
import habitRoutes from './routes/habitRoutes.ts'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import {  env, isDev, isTestEnv } from '../env.ts'
import { APIError, errorHandler } from './middleware/errorHandler.ts';

const app = express()
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  morgan('dev', {
    skip: () => isTestEnv(),
  })
)

app.use((_, __, next) => {
  next(new APIError('This is a test error', 'validationError', 400))
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Habit Tracker API',
  })
  // res.send('<button>click </button>')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/habits', habitRoutes)

app.use(errorHandler)
export { app }

export default app
