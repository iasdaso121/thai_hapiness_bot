const { Router } = require('express')
const router = Router()
const botController = require('../controllers/botController')
const checkRole = require('../middleware/checkRoleMiddleware')

// Публичные routes (для бота)
router.get('/content/:key', botController.getContent)
router.get('/cities-with-districts', botController.getCitiesWithDistricts)
router.get('/categories-with-products', botController.getCategoriesWithProducts)
router.get('/products-by-category/:categoryId', botController.getProductsByCategory)
router.get('/categories/:categoryId/districts', botController.getAvailableDistrictsForCategory)

// для клиентов и покупок
router.post('/clients/:telegramId/purchase', botController.addPurchase)
router.get('/clients/:telegramId/purchases', botController.getClientPurchases)
router.post('/clients/:telegramId', botController.getOrCreateClient)
router.get('/clients/:telegramId/balance', botController.getClientBalance)
router.post('/clients/:telegramId/balance/adjust', botController.adjustClientBalance)
router.post(
    '/clients/:telegramId/balance/test-topup',
    botController.testTopUpBalance.bind(botController)
)

// Защищенные routes (админка)
router.get('/content', checkRole('ADMIN'), botController.getAllContent)
router.post('/content', checkRole('ADMIN'), botController.createContent)
router.put('/content/:id', checkRole('ADMIN'), botController.updateContent)
router.delete('/content/:id', checkRole('ADMIN'), botController.deleteContent)

module.exports = router
