const sequelize = require('../db')
const {DataTypes} = require('sequelize')
const bcrypt = require('bcrypt')
require('dotenv').config()

const BotContent = sequelize.define('bot_content', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    key: {type: DataTypes.STRING, unique: true, allowNull: false}, // 'welcome', 'help', 'about'
    text: {type: DataTypes.TEXT},
    image: {type: DataTypes.STRING},
})

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING, allowNull: true},
    role: {type: DataTypes.STRING, defaultValue: "USER"},
})

const Category = sequelize.define('category', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false},
})

const Product = sequelize.define('product', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false},
    description: {type: DataTypes.TEXT, defaultValue: "description"},
    img: {type: DataTypes.STRING, allowNull: false},
        
    categoryId: {type: DataTypes.INTEGER, allowNull: false},
})

const Position = sequelize.define('position', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false},
    price: {type: DataTypes.INTEGER, allowNull: false},
    location: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.STRING, allowNull: false},

    productId: {type: DataTypes.INTEGER, allowNull: false},
    cityId: {type: DataTypes.INTEGER, allowNull: false},
    districtId: {type: DataTypes.INTEGER, allowNull: false},
})

const City = sequelize.define('city', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false},
})

const District = sequelize.define('district', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    cityId: {type: DataTypes.INTEGER, allowNull: false},
})

const Client = sequelize.define('client', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    telegramId: {type: DataTypes.BIGINT, unique: true, allowNull: false},
    username: {type: DataTypes.STRING},
    firstName: {type: DataTypes.STRING},
    lastName: {type: DataTypes.STRING},
    purchasedPositions: {
        type: DataTypes.JSON,
        defaultValue: []
    }
})

const Payment = sequelize.define('payment', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    telegramId: {type: DataTypes.BIGINT, allowNull: false},
    clientId: {type: DataTypes.INTEGER, allowNull: true},
    positionId: {type: DataTypes.INTEGER, allowNull: false},
    providerInvoiceId: {type: DataTypes.STRING, allowNull: false},
    status: {type: DataTypes.STRING, allowNull: false},
    payUrl: {type: DataTypes.STRING},
    asset: {type: DataTypes.STRING},
    amount: {type: DataTypes.STRING},
    description: {type: DataTypes.TEXT},
    payload: {type: DataTypes.STRING},
    positionSnapshot: {type: DataTypes.JSON, allowNull: false},
    purchaseCreated: {type: DataTypes.BOOLEAN, defaultValue: false},
    paidAt: {type: DataTypes.DATE, allowNull: true},
    expiresAt: {type: DataTypes.DATE, allowNull: true},
})

Client.belongsToMany(Position, { through: 'ClientPositions' })
Position.belongsToMany(Client, { through: 'ClientPositions' })

Client.hasMany(Payment, { foreignKey: 'clientId', as: 'payments' })
Payment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' })

Position.hasMany(Payment, { foreignKey: 'positionId', as: 'payments' })
Payment.belongsTo(Position, { foreignKey: 'positionId', as: 'position' })

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' })
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

// Город имеет много районов
City.hasMany(District, { foreignKey: 'cityId', as: 'districts' })
District.belongsTo(City, { foreignKey: 'cityId', as: 'city' })

// Карточка товара имеет много активных позиций
Product.hasMany(Position, { foreignKey: 'productId', as: 'positions' })
Position.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

// Позиция принадлежит городу и району
City.hasMany(Position, { foreignKey: 'cityId', as: 'positions' })
Position.belongsTo(City, { foreignKey: 'cityId', as: 'city' })

District.hasMany(Position, { foreignKey: 'districtId', as: 'positions' })
Position.belongsTo(District, { foreignKey: 'districtId', as: 'district' })

const createDefaultAdmin = async () => {
    try {
        const adminLogin = process.env.ADMIN_LOGIN
        const adminPassword = process.env.ADMIN_PASSWORD
        
        if (!adminLogin || !adminPassword) {
            console.log('ADMIN_LOGIN or ADMIN_PASSWORD not set in .env, skipping admin creation')
            return
        }
        
        const adminExists = await User.findOne({ where: { name: adminLogin } })
        
        if (!adminExists) {
            const hashPassword = await bcrypt.hash(adminPassword, 4)
            await User.create({
                name: adminLogin,
                password: hashPassword,
                role: 'ADMIN'
            })
            console.log(`Default admin user created: ${adminLogin}`)
        } else {
            console.log(`Admin user "${adminLogin}" already exists`)
        }
    } catch (error) {
        console.error('Error creating default admin:', error)
    }
}

module.exports = {
    User, BotContent, Category, Product, Position, City, District, Client, Payment,
    createDefaultAdmin
}