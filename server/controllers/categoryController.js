const {Category, Product} = require('../models/models')
const ApiError = require('../error/ApiError')

class CategoryController {
    async create(req, res, next) {
        try {
            const {name} = req.body
            const category = await Category.create({name})
            return res.json(category)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const categories = await Category.findAll({
                include: [{model: Product, as: 'products'}]
            })
            return res.json(categories)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const category = await Category.findOne({
                where: {id},
                include: [{model: Product, as: 'products'}]
            })
            if (!category) {
                return next(ApiError.notFound('Category not found'))
            }
            return res.json(category)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const category = await Category.findByPk(id)
            if (!category) {
                return next(ApiError.notFound('Category not found'))
            }
            
            // Проверяем наличие продуктов в категории
            const productsCount = await category.countProducts()
            if (productsCount > 0) {
                return next(ApiError.badRequest('Cannot delete category with products'))
            }
            
            await category.destroy()
            return res.json({message: 'Category deleted'})
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }
}

module.exports = new CategoryController()