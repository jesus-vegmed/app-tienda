/**
 * Controlador de autenticacion
 * Login para admin (password) y cajero (codigo)
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    /**
     * POST /api/auth/login
     * Body: { username, password } para admin
     * Body: { code } para cajero
     */
    async login(req, res, next) {
        try {
            const { username, password, code } = req.body;

            let user;

            // Login por codigo (cajero)
            if (code) {
                user = await User.findByCode(code);
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Codigo de acceso invalido',
                    });
                }
            }
            // Login por usuario y contrasena (admin)
            else if (username && password) {
                user = await User.findByUsername(username);
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Usuario no encontrado',
                    });
                }

                if (!user.password_hash) {
                    return res.status(401).json({
                        success: false,
                        message: 'Este usuario no tiene contrasena configurada',
                    });
                }

                const validPassword = await User.verifyPassword(password, user.password_hash);
                if (!validPassword) {
                    return res.status(401).json({
                        success: false,
                        message: 'Contrasena incorrecta',
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Proporciona usuario/contrasena o codigo de acceso',
                });
            }

            // Generar token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                    },
                },
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/auth/me
     * Obtener datos del usuario autenticado
     */
    async me(req, res, next) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            res.json({
                success: true,
                data: user,
            });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = authController;
