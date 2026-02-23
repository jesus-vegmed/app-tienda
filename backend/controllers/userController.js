/**
 * Controlador de usuarios
 * CRUD de cajeros (solo admin)
 */
const User = require('../models/User');
const { validateRequired } = require('../utils/validators');

const userController = {
    /**
     * GET /api/users/cashiers
     * Listar cajeros (solo admin)
     */
    async listCashiers(req, res, next) {
        try {
            const cashiers = await User.listCashiers();
            res.json({ success: true, data: cashiers });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/users/cashiers
     * Crear cajero (solo admin)
     * Body: { username, code }
     */
    async createCashier(req, res, next) {
        try {
            const { valid, missing } = validateRequired(req.body, ['username', 'code']);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes: ' + missing.join(', '),
                });
            }

            const { username, code } = req.body;

            // Verificar que no exista
            const existing = await User.findByUsername(username);
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un usuario con ese nombre',
                });
            }

            const cashier = await User.create({ username, code, role: 'cajero' });
            res.status(201).json({ success: true, data: cashier });
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/users/cashiers/:id
     * Desactivar cajero (solo admin)
     */
    async deleteCashier(req, res, next) {
        try {
            const cashier = await User.deactivate(req.params.id);
            if (!cashier) {
                return res.status(404).json({
                    success: false,
                    message: 'Cajero no encontrado',
                });
            }
            res.json({ success: true, data: cashier });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = userController;
