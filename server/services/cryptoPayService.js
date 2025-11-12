const https = require('https')
const { URL } = require('url')

class CryptoPayService {
    constructor(apiToken) {
        this.apiToken = apiToken
        this.baseUrl = 'https://pay.crypt.bot/api'
    }

    isConfigured() {
        return Boolean(this.apiToken)
    }

    async request(endpoint, {method = 'GET', body} = {}) {
        if (!this.isConfigured()) {
            throw new Error('Crypto Pay API token is not configured')
        }

        const url = new URL(endpoint, this.baseUrl)
        const payload = body ? JSON.stringify(body) : null

        const options = {
            method,
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'Crypto-Pay-Api-Token': this.apiToken,
            },
        }

        if (payload) {
            options.headers['Content-Type'] = 'application/json'
            options.headers['Content-Length'] = Buffer.byteLength(payload)
        }

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = ''

                res.on('data', (chunk) => {
                    data += chunk
                })

                res.on('end', () => {
                    if (!data) {
                        return resolve({ ok: false, error: 'Empty response from Crypto Pay API' })
                    }

                    try {
                        const parsed = JSON.parse(data)
                        resolve(parsed)
                    } catch (error) {
                        reject(new Error(`Failed to parse Crypto Pay API response: ${error.message}`))
                    }
                })
            })

            req.on('error', (error) => {
                reject(error)
            })

            if (payload) {
                req.write(payload)
            }

            req.end()
        })
    }

    async createInvoice(params) {
        const response = await this.request('/createInvoice', { method: 'POST', body: params })

        if (!response.ok) {
            const message = response?.error?.message || 'Failed to create Crypto Pay invoice'
            throw new Error(message)
        }

        return response.result
    }

    async getInvoice(invoiceId) {
        if (!invoiceId) {
            throw new Error('Invoice ID is required')
        }

        const response = await this.request(`/getInvoices?invoice_ids=${invoiceId}`)

        if (!response.ok) {
            const message = response?.error?.message || 'Failed to fetch Crypto Pay invoice'
            throw new Error(message)
        }

        const invoices = response.result || []
        if (Array.isArray(invoices) && invoices.length > 0) {
            return invoices[0]
        }

        return null
    }
}

module.exports = new CryptoPayService(process.env.CRYPTO_PAY_API_TOKEN)
