/**
 * Middleware de verificación de roles
 * Uso: requireRole('admin') o requireRole('admin', 'cajero')
 * @param  {...string} roles - Roles permitidos
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para esta acción',
            });
        }

        next();
    };
};

module.exports = requireRole;
