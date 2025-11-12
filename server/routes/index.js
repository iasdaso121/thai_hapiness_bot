const { Router } = require('express')
const router = Router()

const userRouter = require('./userRouter')
const botRouter = require('./botRouter')
const catalogRouter = require('./catalogRouter')
const categoryRouter = require('./categoryRouter')
const productRouter = require('./productRouter')
const positionRouter = require('./positionRouter')
const cityRouter = require('./cityRouter')
const districtRouter = require('./districtRouter')

router.use('/user', userRouter)
router.use('/bot', botRouter)
router.use('/catalog', catalogRouter)
router.use('/category', categoryRouter)
router.use('/product', productRouter)
router.use('/position', positionRouter)
router.use('/city', cityRouter)
router.use('/district', districtRouter)

module.exports = router

// Карта API endpoints:
// User:
// POST /api/user/registration
// POST /api/user/login
// GET /api/user/auth

// Bot Content:
// GET /api/bot/content/:key
// GET /api/bot/cities-with-districts
// GET /api/bot/categories-with-products
// GET /api/bot/products-by-category/:categoryId
// GET /api/bot/content (admin)
// POST /api/bot/content (admin)
// PUT /api/bot/content/:id (admin)
// DELETE /api/bot/content/:id (admin)

// Catalog:
// GET /api/catalog/categories
// GET /api/catalog/categories/:categoryId/products
// GET /api/catalog/products/:productId/positions
// GET /api/catalog/positions/search
// GET /api/catalog/cities/available
// GET /api/catalog/cities/:cityId/districts

// Categories:
// POST /api/category (admin)
// GET /api/category
// GET /api/category/:id
// DELETE /api/category/:id (admin)

// Products:
// POST /api/product (admin)
// GET /api/product
// GET /api/product/:id
// DELETE /api/product/:id (admin)

// Positions:
// POST /api/position (admin)
// GET /api/position
// GET /api/position/:id
// DELETE /api/position/:id (admin)

// Cities & Districts:
// POST /api/city (admin)
// GET /api/city
// DELETE /api/city/:id (admin)
// POST /api/district (admin)
// GET /api/district
// GET /api/district/city/:cityId
// DELETE /api/district/:id (admin)