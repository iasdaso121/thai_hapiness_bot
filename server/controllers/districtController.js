const {District} = require('../models/models')
const ApiError = require('../error/ApiError')

class DistrictController {
    async create(req, res, next) {
        try {
            const {name, cityId} = req.body // cityId!
            const district = await District.create({name, cityId})
            return res.json(district)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const districts = await District.findAll({
                include: [{model: City, as: 'city'}]
            })
            return res.json(districts)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async getByCity(req, res, next) {
        try {
            const {cityId} = req.params
            const districts = await District.findAll({where: {cityId}})
            return res.json(districts)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params // Удаляем по ID
            const district = await District.findByPk(id)
            if (!district) {
                return next(ApiError.notFound('District not found'))
            }
            await district.destroy()
            return res.json({message: 'District deleted'})
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }
}

module.exports = new DistrictController()