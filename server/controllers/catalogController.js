const {Category, Product, Position, City, District} = require('../models/models')
const ApiError = require('../error/ApiError')

// Сценарии использования:
// Для бота:
// Каталог → /api/catalog/categories
// Продукты категории → /api/catalog/categories/:categoryId/products
// Позиции продукта → /api/catalog/products/:productId/positions?cityId=1

// Для админки:
// Все позиции → /api/positions
// Расширенный поиск → /api/catalog/positions/search?categoryId=1&cityId=2&minPrice=1000
class CatalogController {
    // 1. Получить все категории с количеством продуктов
    async getCategories(req, res, next) {
        try {
            const categories = await Category.findAll({
                include: [{
                    model: Product,
                    as: 'products',
                    attributes: ['id'] // Только ID для подсчета
                }]
            })
            
            // Добавляем счетчик продуктов к каждой категории
            const categoriesWithCount = categories.map(category => ({
                ...category.toJSON(),
                productsCount: category.products.length
            }))
            
            return res.json(categoriesWithCount)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    // 2. Получить продукты по категории с фильтрацией по городу/району
    async getProductsByCategory(req, res, next) {
        try {
            const {categoryId} = req.params
            let {cityId, districtId, hasPositions} = req.query
            
            // Базовое условие для продуктов
            let productWhere = {categoryId}
            
            // Условие для позиций
            let positionWhere = {}
            if (cityId) positionWhere.cityId = cityId
            if (districtId) positionWhere.districtId = districtId
            
            const products = await Product.findAll({
                where: productWhere,
                include: [{
                    model: Position,
                    as: 'positions',
                    where: positionWhere,
                    required: hasPositions === 'true' // Только продукты с позициями
                }],
                order: [['name', 'ASC']]
            })
            
            return res.json(products)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    // 3. Получить позиции по продукту с фильтрацией
    async getPositionsByProduct(req, res, next) {
        try {
            const {productId} = req.params
            let {cityId, districtId, limit, page} = req.query
            
            page = page || 1
            limit = limit || 20
            let offset = page * limit - limit
            
            let whereCondition = {productId}
            if (cityId) whereCondition.cityId = cityId
            if (districtId) whereCondition.districtId = districtId

            const positions = await Position.findAndCountAll({
                where: whereCondition,
                limit,
                offset,
                include: [
                    {model: Product, as: 'product'},
                    {model: City, as: 'city'},
                    {model: District, as: 'district'}
                ],
                order: [['price', 'ASC']] // Сортировка по цене
            })
            
            return res.json(positions)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    // 4. Универсальный поиск позиций (для админки и сложных фильтров)
    async searchPositions(req, res, next) {
        try {
            let {productId, categoryId, cityId, districtId, minPrice, maxPrice, type, limit, page} = req.query
            
            page = page || 1
            limit = limit || 20
            let offset = page * limit - limit
            
            let whereCondition = {}
            
            // Построение условий фильтрации
            if (productId) whereCondition.productId = productId
            if (cityId) whereCondition.cityId = cityId
            if (districtId) whereCondition.districtId = districtId
            if (type) whereCondition.type = type
            
            // Фильтрация по цене
            if (minPrice || maxPrice) {
                whereCondition.price = {}
                if (minPrice) whereCondition.price[Op.gte] = parseInt(minPrice)
                if (maxPrice) whereCondition.price[Op.lte] = parseInt(maxPrice)
            }
            
            let include = [
                {
                    model: Product,
                    as: 'product',
                    include: [{model: Category, as: 'category'}]
                },
                {model: City, as: 'city'},
                {model: District, as: 'district'}
            ]
            
            // Если фильтр по категории - добавляем условие
            if (categoryId && !productId) {
                include[0].where = {categoryId}
            }

            const positions = await Position.findAndCountAll({
                where: whereCondition,
                include: include,
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            })
            
            return res.json(positions)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    // 5. Получить доступные города для фильтрации
    async getAvailableCities(req, res, next) {
        try {
            const cities = await City.findAll({
                include: [{
                    model: Position,
                    as: 'positions',
                    attributes: ['id'], // Только для подсчета
                    required: true // Только города с позициями
                }],
                order: [['name', 'ASC']]
            })
            
            return res.json(cities)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    // 6. Получить районы по городу (для фильтрации)
    async getDistrictsByCity(req, res, next) {
        try {
            const {cityId} = req.params
            const districts = await District.findAll({
                where: {cityId},
                include: [{
                    model: Position,
                    as: 'positions',
                    attributes: ['id'],
                    required: true // Только районы с позициями
                }],
                order: [['name', 'ASC']]
            })
            
            return res.json(districts)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }
}

module.exports = new CatalogController()