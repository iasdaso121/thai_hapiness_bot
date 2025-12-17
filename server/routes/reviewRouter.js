const { Router } = require('express')
const router = Router()
const reviewController = require('../controllers/reviewController')
const checkRole = require('../middleware/checkRoleMiddleware')

router.post('/', checkRole('ADMIN'), reviewController.create)
router.post('/bulk', checkRole('ADMIN'), reviewController.bulkCreate)
router.get('/', reviewController.getAll)
router.get('/stats', reviewController.getStats)
router.delete('/:id', checkRole('ADMIN'), reviewController.delete)

module.exports = router
