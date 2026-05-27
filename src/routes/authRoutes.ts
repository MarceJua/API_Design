import { Router } from 'express'
import { register, login } from '../controllers/authController.ts'
import { validateBody } from '../middleware/validation.ts'
import { z } from 'zod'
import { insertUserSchema } from '../db/schema.ts'

// Login validation schema
const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const router = Router()

// Routes
router.post('/register', validateBody(insertUserSchema), register)

router.post('/login', validateBody(loginSchema), login)

export default router
