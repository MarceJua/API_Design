import { Router } from 'express'
import { z } from 'zod'
import { validateBody, validateParams } from '../middleware/validation.ts'
import { name } from 'drizzle-orm';


// Define validation schemas
const createHabitSchema = z.object({
  name: z.string()
})

const completeParamSchema = z.object({
  id: z.string().max(3)
})

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'habits' })
})

router.get('/:id', (req, res) => {
  res.json({ message: `habit with id ${req.params.id}` })
})

router.post('/', validateBody(createHabitSchema), (req, res) => {
  res.status(201).json({ message: 'habit created' })
})

router.delete('/:id', (req, res) => {
  res.json({ message: `habit with id ${req.params.id} deleted` })
})

router.post('/:id/complete',validateParams(completeParamSchema), validateBody(createHabitSchema), (req, res) => {
  res.json({ message: `habit with id ${req.params.id} marked as complete` })
})

export default router
