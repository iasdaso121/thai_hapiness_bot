const crypto = require('crypto')
const ApiError = require('../error/ApiError')
const { Client, Position, Product, Payment } = require('../models/models')
const cryptoPayService = require('../services/cryptoPayService')

const DEFAULT_ASSET = process.env.CRYPTO_PAY_ASSET || 'USDT'
const PRICE_DIVISOR = Number(process.env.CRYPTO_PAY_PRICE_DIVISOR || 1)
const PRICE_MULTIPLIER = Number(process.env.CRYPTO_PAY_PRICE_MULTIPLIER || 1)
const DEFAULT_EXPIRES_IN = Number(process.env.CRYPTO_PAY_EXPIRES_IN || 3600)

const toFixedAmount = (value) => {
    const precision = Number(process.env.CRYPTO_PAY_AMOUNT_PRECISION || 6)
    const fixed = Number(value).toFixed(precision)
    return Number.parseFloat(fixed).toString()
}

class PaymentController {
    async createCryptoInvoice(req, res, next) {
        try {
            const { telegramId, positionId } = req.body

            if (!telegramId || !positionId) {
                return next(ApiError.badRequest('telegramId and positionId are required'))
            }

            if (!cryptoPayService.isConfigured()) {
                return next(ApiError.internal('Crypto Pay API token is not configured'))
            }

            const client = await Client.findOne({ where: { telegramId } })
            if (!client) {
                return next(ApiError.notFound('Client not found'))
            }

            const position = await Position.findByPk(positionId, {
                include: [{ model: Product, as: 'product' }]
            })

            if (!position) {
                return next(ApiError.notFound('Position not found'))
            }

            const basePrice = Number(position.price)
            if (!basePrice || Number.isNaN(basePrice)) {
                return next(ApiError.badRequest('Invalid position price'))
            }

            const adjustedPrice = (basePrice / (PRICE_DIVISOR || 1)) * (PRICE_MULTIPLIER || 1)
            const amount = toFixedAmount(adjustedPrice)

            const payload = JSON.stringify({
                telegramId,
                positionId,
                clientId: client.id,
                timestamp: Date.now()
            })

            const descriptionPrefix = process.env.CRYPTO_PAY_DESCRIPTION_PREFIX || 'Purchase'
            const description = `${descriptionPrefix}: ${position.product ? position.product.name : 'Product'} - ${position.name}`

            const invoiceParams = {
                asset: DEFAULT_ASSET,
                amount,
                description,
                payload,
                allow_anonymous: false,
                allow_comments: false,
                expires_in: DEFAULT_EXPIRES_IN,
            }

            if (process.env.CRYPTO_PAY_PAID_BUTTON_URL) {
                invoiceParams.paid_btn_name = process.env.CRYPTO_PAY_PAID_BUTTON_NAME || 'open_bot'
                invoiceParams.paid_btn_url = process.env.CRYPTO_PAY_PAID_BUTTON_URL
            }

            const invoice = await cryptoPayService.createInvoice(invoiceParams)

            const positionSnapshot = {
                id: position.id,
                name: position.name,
                price: position.price,
                location: position.location,
                type: position.type,
                productId: position.productId,
                productName: position.product ? position.product.name : null,
            }

            const payment = await Payment.create({
                telegramId,
                clientId: client.id,
                positionId: position.id,
                providerInvoiceId: String(invoice.invoice_id),
                status: invoice.status,
                payUrl: invoice.pay_url,
                asset: invoice.asset || DEFAULT_ASSET,
                amount: invoice.amount || amount,
                description,
                payload,
                positionSnapshot,
                expiresAt: invoice.expiration_date ? new Date(invoice.expiration_date) : null,
            })

            return res.json({
                success: true,
                payment: {
                    id: payment.id,
                    status: payment.status,
                    payUrl: payment.payUrl,
                    amount: payment.amount,
                    asset: payment.asset,
                    providerInvoiceId: payment.providerInvoiceId,
                    positionId: payment.positionId,
                    position: positionSnapshot,
                    expiresAt: payment.expiresAt,
                },
                invoice,
            })
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async getPayment(req, res, next) {
        try {
            const { paymentId } = req.params

            const payment = await Payment.findByPk(paymentId)
            if (!payment) {
                return next(ApiError.notFound('Payment not found'))
            }

            if (payment.status !== 'paid' && cryptoPayService.isConfigured()) {
                try {
                    const invoice = await cryptoPayService.getInvoice(payment.providerInvoiceId)

                    if (invoice && invoice.status && invoice.status !== payment.status) {
                        const updates = {
                            status: invoice.status,
                            asset: invoice.asset || payment.asset,
                            amount: invoice.amount || payment.amount,
                            payUrl: invoice.pay_url || payment.payUrl,
                            expiresAt: invoice.expiration_date ? new Date(invoice.expiration_date) : payment.expiresAt,
                            paidAt: invoice.paid_at ? new Date(invoice.paid_at) : payment.paidAt,
                        }

                        await payment.update(updates)

                        await payment.reload()

                        if (invoice.status === 'paid' && !payment.purchaseCreated) {
                            await this.createPurchaseForPayment(payment)
                            await payment.reload()
                        }
                    }
                } catch (error) {
                    console.error('Failed to refresh payment status:', error.message)
                }
            }

            return res.json({
                success: true,
                payment: {
                    id: payment.id,
                    status: payment.status,
                    payUrl: payment.payUrl,
                    amount: payment.amount,
                    asset: payment.asset,
                    providerInvoiceId: payment.providerInvoiceId,
                    telegramId: payment.telegramId,
                    positionId: payment.positionId,
                    position: payment.positionSnapshot,
                    purchaseCreated: payment.purchaseCreated,
                    paidAt: payment.paidAt,
                    expiresAt: payment.expiresAt,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                }
            })
        } catch (error) {
            next(ApiError.internal(error.message))
        }
    }

    async handleCryptoWebhook(req, res) {
        const signature = req.headers['crypto-pay-api-signature']
        const rawBody = req.rawBody || JSON.stringify(req.body)

        if (!signature || !rawBody) {
            return res.status(400).json({ ok: false })
        }

        if (!cryptoPayService.isConfigured()) {
            return res.status(500).json({ ok: false })
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.CRYPTO_PAY_API_TOKEN)
            .update(rawBody)
            .digest('hex')

        if (signature !== expectedSignature) {
            return res.status(403).json({ ok: false })
        }

        let update
        try {
            update = typeof req.body === 'object' && Object.keys(req.body).length
                ? req.body
                : JSON.parse(rawBody)
        } catch (error) {
            return res.status(400).json({ ok: false })
        }

        const { update_type: updateType, invoice } = update

        if (updateType === 'invoice_paid' && invoice) {
            const providerInvoiceId = String(invoice.invoice_id)

            const payment = await Payment.findOne({ where: { providerInvoiceId } })
            if (payment) {
                const updates = {
                    status: invoice.status,
                    asset: invoice.asset || payment.asset,
                    amount: invoice.amount || payment.amount,
                    payUrl: invoice.pay_url || payment.payUrl,
                    expiresAt: invoice.expiration_date ? new Date(invoice.expiration_date) : payment.expiresAt,
                    paidAt: invoice.paid_at ? new Date(invoice.paid_at) : new Date(),
                }

                await payment.update(updates)

                if (!payment.purchaseCreated) {
                    await this.createPurchaseForPayment(payment)
                }
            }
        }

        return res.json({ ok: true })
    }

    async createPurchaseForPayment(payment) {
        const client = payment.clientId
            ? await Client.findByPk(payment.clientId)
            : await Client.findOne({ where: { telegramId: payment.telegramId } })

        if (!client) {
            return
        }

        const currentPurchases = Array.isArray(client.purchasedPositions) ? client.purchasedPositions : []

        if (currentPurchases.some((purchase) => purchase.paymentId === payment.id)) {
            await payment.update({ purchaseCreated: true })
            return
        }

        let positionSnapshot = payment.positionSnapshot || null

        if (!positionSnapshot) {
            const position = await Position.findByPk(payment.positionId, {
                include: [{ model: Product, as: 'product' }]
            })
            if (position) {
                positionSnapshot = {
                    id: position.id,
                    name: position.name,
                    price: position.price,
                    location: position.location,
                    type: position.type,
                    productId: position.productId,
                    productName: position.product ? position.product.name : null,
                }
                await payment.update({ positionSnapshot })
            }
        }

        if (!positionSnapshot) {
            return
        }

        const purchase = {
            positionId: positionSnapshot.id,
            positionName: positionSnapshot.name,
            price: positionSnapshot.price,
            productName: positionSnapshot.productName || 'Unknown',
            location: positionSnapshot.location,
            purchaseDate: new Date().toISOString(),
            paymentId: payment.id,
            providerInvoiceId: payment.providerInvoiceId,
        }

        const updatedPurchases = [...currentPurchases, purchase]

        await client.update({ purchasedPositions: updatedPurchases })
        await payment.update({ purchaseCreated: true })
    }
}

module.exports = new PaymentController()
