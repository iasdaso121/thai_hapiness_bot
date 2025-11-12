const {City, District} = require('../models/models')
const ApiError = require('../error/ApiError')

class CityController {
    async create(req, res, next) {
        try {
            const {name} = req.body
            const city = await City.create({name})
            return res.json(city)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const cities = await City.findAll({
                include: [{model: District, as: 'districts'}]
            })
            return res.json(cities)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const city = await City.findByPk(id)
            if (!city) {
                return next(ApiError.notFound('City not found'))
            }
            await city.destroy()
            return res.json({message: 'City deleted'})
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }
}

module.exports = new CityController()