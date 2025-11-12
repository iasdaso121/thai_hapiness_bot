const { Router } = require('express')
const router = Router()
const paymentController = require('../controllers/paymentController')

router.post('/crypto/invoice', paymentController.createCryptoInvoice.bind(paymentController))
router.get('/:paymentId', paymentController.getPayment.bind(paymentController))
router.post('/crypto/webhook', paymentController.handleCryptoWebhook.bind(paymentController))

module.exports = router
