const uuid = require('uuid')
const path = require('path')
const {Product, Category, Position} = require('../models/models')
const ApiError = require('../error/ApiError')

class ProductController {
    async create(req, res, next) {
        try {
            const {name, description, categoryId} = req.body
            const {img} = req.files

            const category = await Category.findByPk(categoryId)
            if (!category) {
                return next(ApiError.badRequest('Category not found'))
            }

            let filename = uuid.v4() + ".jpg"
            await img.mv(path.resolve(__dirname, '..', 'static', filename))

            const product = await Product.create({name, description, img: filename, categoryId})
            
            return res.json(product)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    // async getAll(req, res, next) {
    //     try {
    //         let {categoryId, limit, page} = req.query
    //         page = page || 1
    //         limit = limit || 9
    //         let offset = page * limit - limit

    //         let whereCondition = {}
    //         if (categoryId && categoryId !== 'null' && categoryId !== 'undefined') {
    //             whereCondition.categoryId = categoryId
    //         }

    //         const products = await Product.findAndCountAll({
    //             where: whereCondition,
    //             limit, 
    //             offset,
    //             include: [{model: Category, as: 'category'}],
    //             order: [['name', 'ASC']]
    //         })
        
    //         return res.json(products)
    //     } catch (e) {
    //         next(ApiError.badRequest(e.message))
    //     }
    // }
    async getAll(req, res, next) {
        try {
            let {categoryId, limit, page, includePositions} = req.query
            page = page || 1
            limit = limit || 50 // Увеличим лимит для админки
            let offset = page * limit - limit

            // Создаем условие для фильтрации
            let whereCondition = {}
            if (categoryId && categoryId !== 'null' && categoryId !== 'undefined') {
                whereCondition.categoryId = categoryId
            }

            // Базовые включения
            let include = [{model: Category, as: 'category'}]
            
            // ВСЕГДА включаем позиции для подсчета (только ID)
            include.push({
                model: Position,
                as: 'positions',
                attributes: ['id'] // Только ID для подсчета, не грузим все данные
            })

            const products = await Product.findAndCountAll({
                where: whereCondition,
                limit, 
                offset,
                include: include,
                order: [['name', 'ASC']]
            })
        
            return res.json(products)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const product = await Product.findOne({
                where: {id},
                include: [{model: Category, as: 'category'},
                          {model: Position, as: 'positions'}] // !
            })
            if (!product) {
                return next(ApiError.notFound('Product not found'))
            }
            return res.json(product)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async getByCategory(req, res, next) {
        try {
            const {categoryId} = req.params
            const products = await Product.findAll({
                where: {categoryId},
                include: [{model: Category, as: 'category'}]
            })
            return res.json(products)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const product = await Product.findByPk(id)
            if (!product) {
                return next(ApiError.notFound('Product not found'))
            }
            await product.destroy()
            return res.json({message: 'Product deleted'})
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }
}

module.exports = new ProductController()