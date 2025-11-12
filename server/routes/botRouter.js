const { Router } = require('express')
const router = Router()
const botController = require('../controllers/botController')
const checkRole = require('../middleware/checkRoleMiddleware')

// Публичные routes (для бота)
router.get('/content/:key', botController.getContent)
router.get('/cities-with-districts', botController.getCitiesWithDistricts)
router.get('/categories-with-products', botController.getCategoriesWithProducts)
router.get('/products-by-category/:categoryId', botController.getProductsByCategory)

// для клиентов и покупок
router.post('/clients/:telegramId/purchase', botController.addPurchase)
router.get('/clients/:telegramId/purchases', botController.getClientPurchases)
router.post('/clients/:telegramId', botController.getOrCreateClient)

// Защищенные routes (админка)
router.get('/content', checkRole('ADMIN'), botController.getAllContent)
router.post('/content', checkRole('ADMIN'), botController.createContent)
router.put('/content/:id', checkRole('ADMIN'), botController.updateContent)
router.delete('/content/:id', checkRole('ADMIN'), botController.deleteContent)

module.exports = router