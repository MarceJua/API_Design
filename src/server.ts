import express from 'express'
import authRoutes from './routes/authRoutes.ts'
import userRoutes from './routes/userRoutes.ts'
import habitRoutes from './routes/habirRoutes.ts'

const app = express()

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Habit Tracker API',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/habits', habitRoutes)

export { app }

export default app
