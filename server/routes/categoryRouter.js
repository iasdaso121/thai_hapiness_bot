const { Router } = require('express')
const router = Router()
const categoryController = require('../controllers/categoryController')
const checkRole = require('../middleware/checkRoleMiddleware')

router.post('/', checkRole('ADMIN'), categoryController.create)
router.get('/', categoryController.getAll)
router.get('/:id', categoryController.getOne)
router.delete('/:id', checkRole('ADMIN'), categoryController.delete)

module.exports = router