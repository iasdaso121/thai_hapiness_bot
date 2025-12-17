const { Review } = require('../models/models')
const ApiError = require('../error/ApiError')

class ReviewController {
    async create(req, res, next) {
        try {
            const { text, author, rating } = req.body
            const review = await Review.create({ text, author, rating })
            return res.json(review)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async bulkCreate(req, res, next) {
        try {
            const { reviews } = req.body // Expecting array of {text, author, rating}
            if (!Array.isArray(reviews)) {
                return next(ApiError.badRequest("Reviews must be an array"))
            }
            const createdReviews = await Review.bulkCreate(reviews)
            return res.json(createdReviews)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async getAll(req, res) {
        const reviews = await Review.findAll()
        return res.json(reviews)
    }

    async getStats(req, res) {
        try {
            const count = await Review.count()
            const sum = await Review.sum('rating')
            const average = count > 0 ? (sum / count).toFixed(1) : 0
            return res.json({ count, average })
        } catch (e) {
            return res.status(500).json(e)
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params
            const review = await Review.findOne({ where: { id } })
            if (review) {
                await review.destroy()
                return res.json({ message: "Review deleted" })
            }
            return res.json({ message: "Review not found" })
        } catch (e) {
            return res.status(500).json(e)
        }
    }
}

module.exports = new ReviewController()
