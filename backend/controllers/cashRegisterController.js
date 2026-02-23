/**
 * Controlador de Corte de Caja
 * Crear cortes, ver historial, calcular retiro por denominaciones
 */
const CashRegister = require('../models/CashRegister');
const { validateRequired } = require('../utils/validators');

// Denominaciones reales mexicanas (billetes y monedas)
const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5];

const cashRegisterController = {
    /**
     * POST /api/cash-register
     * Crear un nuevo corte de caja
     */
    async create(req, res, next) {
        try {
            const { valid, missing } = validateRequired(req.body, ['denominations', 'expected']);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes: ' + missing.join(', '),
                });
            }

            const { denominations, expected, fund, notes, id, created_at, updated_at } = req.body;

            // Calcular total real segun denominaciones
            let actual = 0;
            if (denominations && typeof denominations === 'object') {
                for (const [denom, count] of Object.entries(denominations)) {
                    actual += parseFloat(denom) * parseInt(count || 0, 10);
                }
            }

            // Calcular retiro (actual - fondo)
            const currentFund = fund || 800;
            const withdrawalAmount = Math.max(0, actual - currentFund);

            // Calcular retiro por denominaciones reales
            let remaining = withdrawalAmount;
            const withdrawalDetail = {};
            for (const denom of DENOMINATIONS) {
                if (remaining <= 0) break;
                const available = parseInt(denominations[denom] || 0, 10);
                const needed = Math.floor(remaining / denom);
                const toTake = Math.min(needed, available);
                if (toTake > 0) {
                    withdrawalDetail[denom] = toTake;
                    remaining -= toTake * denom;
                }
            }

            const record = await CashRegister.create({
                user_id: req.user.id,
                denominations,
                expected: parseFloat(expected),
                actual,
                fund: currentFund,
                withdrawal: withdrawalAmount,
                withdrawal_detail: withdrawalDetail,
                notes,
            });

            res.status(201).json({ success: true, data: record });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/cash-register
     * Listar historial de cortes
     */
    async list(req, res, next) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const records = await CashRegister.list({
                user_id: req.user.id,
                role: req.user.role,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            });
            res.json({ success: true, data: records });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/cash-register/:id
     * Obtener un corte especifico
     */
    async getById(req, res, next) {
        try {
            const record = await CashRegister.findById(req.params.id);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Corte de caja no encontrado',
                });
            }
            res.json({ success: true, data: record });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/cash-register/sync
     * Sincronizar un corte desde el cliente (offline)
     */
    async sync(req, res, next) {
        try {
            const result = await CashRegister.upsert({
                ...req.body,
                user_id: req.user.id,
            });
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = cashRegisterController;
