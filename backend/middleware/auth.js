/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization
 */
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación requerido',
            });
        }

        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token inválido',
        });
    }
};

module.exports = auth;
