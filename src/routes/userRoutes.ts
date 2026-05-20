import { Router } from 'express'

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

export default router
