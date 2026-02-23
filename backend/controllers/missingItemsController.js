/**
 * Controlador de Faltantes
 * Solo opera en la nube, requiere conexion
 */
const MissingItem = require('../models/MissingItem');
const { validateRequired, isValidUrgency } = require('../utils/validators');

const missingItemsController = {
    /**
     * POST /api/missing-items
     * Crear un faltante
     */
    async create(req, res, next) {
        try {
            const { valid, missing } = validateRequired(req.body, ['product_name']);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes: ' + missing.join(', '),
                });
            }

            if (req.body.urgency && !isValidUrgency(req.body.urgency)) {
                return res.status(400).json({
                    success: false,
                    message: 'Urgencia invalida. Usar: alta, media o baja',
                });
            }

            const item = await MissingItem.create(req.body);
            res.status(201).json({ success: true, data: item });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/missing-items
     * Listar faltantes ordenados por urgencia
     */
    async list(req, res, next) {
        try {
            const show_purchased = req.query.show_purchased === 'true';
            const items = await MissingItem.list({ show_purchased });
            res.json({ success: true, data: items });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/missing-items/:id
     * Actualizar un faltante
     */
    async update(req, res, next) {
        try {
            if (req.body.urgency && !isValidUrgency(req.body.urgency)) {
                return res.status(400).json({
                    success: false,
                    message: 'Urgencia invalida. Usar: alta, media o baja',
                });
            }

            const item = await MissingItem.update(req.params.id, req.body);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Faltante no encontrado',
                });
            }
            res.json({ success: true, data: item });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/missing-items/:id/purchase
     * Marcar como comprado
     */
    async markAsPurchased(req, res, next) {
        try {
            const item = await MissingItem.markAsPurchased(req.params.id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Faltante no encontrado',
                });
            }
            res.json({ success: true, data: item });
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/missing-items/:id
     * Eliminar un faltante
     */
    async delete(req, res, next) {
        try {
            const item = await MissingItem.delete(req.params.id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Faltante no encontrado',
                });
            }
            res.json({ success: true, data: item });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = missingItemsController;
