const Router = require('express')
const router = new Router()
const catalogController = require('../controllers/catalogController')

// Основной поток каталога
router.get('/categories', catalogController.getCategories)
router.get('/categories/:categoryId/products', catalogController.getProductsByCategory)
router.get('/products/:productId/positions', catalogController.getPositionsByProduct)

// Фильтрация
router.get('/positions/search', catalogController.searchPositions)
router.get('/cities/available', catalogController.getAvailableCities)
router.get('/cities/:cityId/districts', catalogController.getDistrictsByCity)

module.exports = router