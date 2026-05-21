import { Router } from 'express'
import { z } from 'zod'
import { validateBody, validateParams } from '../middleware/validation.ts'

// Define validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
})

const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
})

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'users' })
})

router.get('/:id', (req, res) => {
  res.json({ message: `user with id ${req.params.id}` })
})

router.put('/:id', (req, res) => {
  res.json({ message: `user with id ${req.params.id} updated` })
})

router.delete('/:id', (req, res) => {
  res.json({ message: `user with id ${req.params.id} deleted` })
})

// Apply validation middleware
router.post('/users', 
  validateBody(createUserSchema),  // Validate request body
  //createUser                       // Route handler (body is now validated!)
)

router.get('/users/:id',
  validateParams(userIdSchema),    // Validate URL parameters
  //getUser
)

export default router
