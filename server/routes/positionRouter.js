const { Router } = require('express')
const router = Router()
const positionController = require('../controllers/positionController')
const checkRole = require('../middleware/checkRoleMiddleware')

router.post('/', checkRole('ADMIN'), positionController.create)
router.get('/', positionController.getAll) // Для админки
router.get('/:id', positionController.getOne)
router.delete('/:id', checkRole('ADMIN'), positionController.delete)

module.exports = router