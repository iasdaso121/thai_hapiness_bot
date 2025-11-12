const {Position, Product, Category, City, District} = require('../models/models')
const ApiError = require('../error/ApiError')

class PositionController {
    async create(req, res, next) {
        try {
            const {name, price, location, type, productId, cityId, districtId} = req.body
            
            const product = await Product.findByPk(productId)
            if (!product) {
                return next(ApiError.badRequest('Product not found'))
            }

            const position = await Position.create({name, price, location, type, productId, cityId, districtId})
            
            return res.json(position)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res, next) {
        try {
            let {productId, cityId, districtId, limit, page} = req.query
            page = page || 1
            limit = limit || 15
            let offset = page * limit - limit

            let whereCondition = {}
            if (productId) whereCondition.productId = productId
            if (cityId) whereCondition.cityId = cityId
            if (districtId) whereCondition.districtId = districtId

            const positions = await Position.findAndCountAll({
                where: whereCondition,
                limit,
                offset,
                include: [
                    {
                        model: Product, 
                        as: 'product',
                        include: [{model: Category, as: 'category'}]
                    },
                    {model: City, as: 'city'},
                    {model: District, as: 'district'}
                ],
                order: [['createdAt', 'DESC']]
            })
            
            return res.json(positions)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const position = await Position.findOne({
                where: {id},
                include: [
                    {model: Product, as: 'product'},
                    {model: City, as: 'city'},
                    {model: District, as: 'district'}
                ]
            })
            if (!position) {
                return next(ApiError.notFound('Position not found'))
            }
            return res.json(position)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const position = await Position.findByPk(id)
            if (!position) {
                return next(ApiError.notFound('Position not found'))
            }
            await position.destroy()
            return res.json({message: 'Position deleted'})
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }
}

module.exports = new PositionController()