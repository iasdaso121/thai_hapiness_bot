const { BotContent, Product, Position, City, District, Category, Client } = require('../models/models')
const ApiError = require('../error/ApiError')
const uuid = require('uuid')
const path = require('path')

class BotController {
    async getContent(req, res, next) {
        try {
            const { key } = req.params
            const content = await BotContent.findOne({ where: { key } })
            if (!content) {
                return next(ApiError.notFound('Content not found'))
            }
            return res.json(content)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async getAllContent(req, res, next) {
        try {
            const content = await BotContent.findAll()
            return res.json(content)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async createContent(req, res, next) {
        try {
            const { key, text } = req.body
            let imageName = null

            if (req.files && req.files.image) {
                const { image } = req.files
                imageName = uuid.v4() + ".jpg"
                await image.mv(path.resolve(__dirname, '..', 'static', imageName))
            }

            const content = await BotContent.create({
                key,
                text,
                image: imageName
            })
            return res.json(content)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }
    async updateContent(req, res, next) {
        try {
            const { id } = req.params
            const { key, text } = req.body
            let imageName = null

            const content = await BotContent.findByPk(id)
            if (!content) {
                return next(ApiError.notFound('Content not found'))
            }

            if (req.files && req.files.image) {
                const { image } = req.files
                imageName = uuid.v4() + ".jpg"
                await image.mv(path.resolve(__dirname, '..', 'static', imageName))
            } else {
                imageName = content.image
            }

            await content.update({
                key,
                text,
                image: imageName
            })
            return res.json(content)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async deleteContent(req, res, next) {
        try {
            const { id } = req.params
            const content = await BotContent.findByPk(id)
            if (!content) {
                return next(ApiError.notFound('Content not found'))
            }
            await content.destroy()
            return res.json({ message: 'Content deleted' })
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async getCitiesWithDistricts(req, res, next) {
        try {
            const cities = await City.findAll({
                include: [{ model: District, as: 'districts' }]
            })
            return res.json(cities)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async getProductsWithPositions(req, res, next) {
        try {
            const { cityId, districtId } = req.query
            let whereCondition = {}

            if (cityId) whereCondition.cityId = cityId
            if (districtId) whereCondition.districtId = districtId

            const products = await Product.findAll({
                include: [{
                    model: Position,
                    as: 'positions',
                    where: whereCondition,
                    required: false
                }]
            })
            return res.json(products)
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async getCategoriesWithProducts(req, res, next) {
        try {
            const categories = await Category.findAll({
                include: [{
                    model: Product,
                    as: 'products',
                    include: [{
                        model: Position,
                        as: 'positions'
                    }]
                }]
            return res.json(categories)
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async getProductsByCategory(req, res, next) {
            try {
                const { categoryId } = req.params
                const { cityId, districtId } = req.query

                let positionWhere = {}
                if (cityId) positionWhere.cityId = cityId
                if (districtId) positionWhere.districtId = districtId

                const products = await Product.findAll({
                    where: { categoryId },
                    include: [{
                        model: Position,
                        as: 'positions',
                        where: positionWhere,
                        required: !!cityId || !!districtId
                    }]
                })
                return res.json(products)
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async getAvailableDistrictsForCategory(req, res, next) {
            try {
                const { categoryId } = req.params
                const { cityId } = req.query

                if (!cityId) {
                    return res.json([])
                }

                const positions = await Position.findAll({
                    where: { cityId },
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            where: { categoryId },
                            required: true
                        },
                        {
                            model: District,
                            as: 'district',
                            required: true
                        }
                    ]
                })

                const districtsMap = new Map()
                positions.forEach(pos => {
                    if (pos.district) {
                        districtsMap.set(pos.district.id, {
                            id: pos.district.id,
                            name: pos.district.name
                        })
                    }
                })

                return res.json(Array.from(districtsMap.values()))
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async getOrCreateClient(req, res, next) {
            try {
                const { telegramId } = req.params
                const { username, firstName, lastName } = req.body
                console.log(`[BotController] Creating client for telegramId: ${telegramId}`, {
                    username, firstName, lastName
                })

                let client = await Client.findOne({ where: { telegramId } })

                if (!client) {
                    client = await Client.create({
                        telegramId,
                        username,
                        firstName,
                        lastName,
                        purchasedPositions: []
                    })
                } else {
                    if (username || firstName || lastName) {
                        await client.update({
                            username: username || client.username,
                            firstName: firstName || client.firstName,
                            lastName: lastName || client.lastName
                        })
                    }
                }

                return res.json(client)
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async addPurchase(req, res, next) {
            try {
                const { telegramId } = req.params
                const { positionId, positionName, price, productName } = req.body

                let client = await Client.findOne({ where: { telegramId } })
                if (!client) {
                    return next(ApiError.notFound('Client not found'))
                }

                const position = await Position.findByPk(positionId, {
                    include: [{ model: Product, as: 'product' }]
                })
                if (!position) {
                    return next(ApiError.notFound('Position not found'))
                }

                const purchasePrice = parseFloat(price || position.price)
                const currentBalance = parseFloat(client.balance || 0)

                if (isNaN(purchasePrice) || purchasePrice <= 0) {
                    return next(ApiError.badRequest('Invalid position price'))
                }

                if (currentBalance < purchasePrice) {
                    return next(ApiError.badRequest('Insufficient balance'))
                }

                // объект покупки
                const purchase = {
                    positionId: positionId,
                    positionName: positionName || position.name,
                    price: purchasePrice,
                    productName: productName || (position.product ? position.product.name : 'Unknown'),
                    purchaseDate: new Date().toISOString()
                }

                const currentPurchases = client.purchasedPositions || []
                const updatedPurchases = [...currentPurchases, purchase]

                await client.update({
                    purchasedPositions: updatedPurchases,
                    balance: currentBalance - purchasePrice
                })

                return res.json({
                    success: true,
                    purchase: purchase,
                    totalPurchases: updatedPurchases.length,
                    balance: currentBalance - purchasePrice
                })
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async getClientPurchases(req, res, next) {
            try {
                const { telegramId } = req.params

                const client = await Client.findOne({ where: { telegramId } })
                if (!client) {
                    return next(ApiError.notFound('Client not found'))
                }

                const purchases = client.purchasedPositions || []

                return res.json({
                    client: {
                        telegramId: client.telegramId,
                        username: client.username,
                        firstName: client.firstName,
                        lastName: client.lastName
                    },
                    purchases: purchases,
                    total: purchases.length
                })
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async getClientBalance(req, res, next) {
            try {
                const { telegramId } = req.params
                let client = await Client.findOne({ where: { telegramId } })

                if (!client) {
                    client = await Client.create({
                        telegramId,
                        balance: 0,
                        purchasedPositions: []
                    })
                }

                return res.json({
                    telegramId: client.telegramId,
                    balance: parseFloat(client.balance || 0)
                })
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async adjustClientBalance(req, res, next) {
            try {
                const { telegramId } = req.params
                const { amount } = req.body

                const parsedAmount = parseFloat(amount)

                if (isNaN(parsedAmount) || parsedAmount === 0) {
                    return next(ApiError.badRequest('Amount must be a non-zero number'))
                }

                let client = await Client.findOne({ where: { telegramId } })
                if (!client) {
                    client = await Client.create({
                        telegramId,
                        balance: 0,
                        purchasedPositions: []
                    })
                }

                const currentBalance = parseFloat(client.balance || 0)
                const newBalance = currentBalance + parsedAmount

                if (newBalance < 0) {
                    return next(ApiError.badRequest('Insufficient balance for this operation'))
                }

                await client.update({ balance: newBalance })

                return res.json({
                    telegramId: client.telegramId,
                    previousBalance: currentBalance,
                    balance: newBalance,
                    changedBy: parsedAmount
                })
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }

    async testTopUpBalance(req, res, next) {
            try {
                let { amount } = req.body
                amount = amount !== undefined ? parseFloat(amount) : 25

                if (isNaN(amount) || amount <= 0) {
                    return next(ApiError.badRequest('Amount must be a positive number'))
                }

                req.body.amount = amount
                return this.adjustClientBalance(req, res, next)
            } catch (e) {
                next(ApiError.internal(e.message))
            }
        }
    }

module.exports = new BotController()
