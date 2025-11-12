const jwt = require('jsonwebtoken')
// module.exports = function (req, res, next) {
//     if (req.method === "OPTIONS") {
//         next()
//     }
//     try {
//         const token = req.headers.authorization.split(' ')[1] // bearer
//         if (!token) {
//             return res.status(401).json({message: "Unauthorized"})
//         }
//         const decoded = jwt.verify(token, process.env.SECRET_KEY)
//         req.user = decoded
//         next()
//     } catch (e) {
//         res.status(401).json({message: "Unauthorized"})
//     }
// } 

//decode token , check valid or not
module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next()
    }
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            return res.status(401).json({message: "Unauthorized"})
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        req.user = decoded
        next()
    } catch (e) {
        return res.status(401).json({message: "Unauthorized"})
    }
}