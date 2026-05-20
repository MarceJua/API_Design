import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'habits' })
})

router.get('/:id', (req, res) => {
  res.json({ message: `habit with id ${req.params.id}` })
})

router.post('/', (req, res) => {
  res.status(201).json({ message: 'habit created' })
})

router.delete('/:id', (req, res) => {
  res.json({ message: `habit with id ${req.params.id} deleted` })
})

router.post('/:id/complete', (req, res) => {
  res.json({ message: `habit with id ${req.params.id} marked as complete` })
})

export default router
