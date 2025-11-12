const { Router } = require('express')
const router = Router()
const cityController = require('../controllers/cityController')
const checkRole = require('../middleware/checkRoleMiddleware')

router.post('/', checkRole('ADMIN'), cityController.create)
router.get('/', cityController.getAll)
router.delete('/:id', checkRole('ADMIN'), cityController.delete)

module.exports = router