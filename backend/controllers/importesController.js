/**
 * Controlador de Importes (envases retornables)
 * CRUD de tickets, cobro por codigo, expiracion automatica
 */
const Importe = require('../models/Importe');
const ImporteProduct = require('../models/ImporteProduct');
const generateCode = require('../utils/generateCode');
const { validateRequired } = require('../utils/validators');

const importesController = {
    /**
     * POST /api/importes
     * Crear un nuevo importe con items
     */
    async create(req, res, next) {
        try {
            const { items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe incluir al menos un producto',
                });
            }

            // Validar cada item
            for (const item of items) {
                if (!item.product_name || !item.price) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cada producto debe tener nombre y precio',
                    });
                }
            }

            // Generar codigo unico
            let code;
            let exists = true;
            while (exists) {
                code = generateCode();
                const found = await Importe.findByCode(code);
                exists = !!found;
            }

            const importe = await Importe.create({
                id: req.body.id || undefined,
                code,
                user_id: req.user.id,
                items,
                created_at: req.body.created_at,
                updated_at: req.body.updated_at,
            });

            res.status(201).json({ success: true, data: importe });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/importes
     * Listar importes con filtro opcional por estado
     */
    async list(req, res, next) {
        try {
            // Ejecutar limpieza automatica
            await Importe.expireOld();
            await Importe.deleteOld();

            const { status, limit = 50, offset = 0 } = req.query;
            const importes = await Importe.list({
                status,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            });
            res.json({ success: true, data: importes });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/importes/:id
     * Obtener un importe por ID
     */
    async getById(req, res, next) {
        try {
            const importe = await Importe.findById(req.params.id);
            if (!importe) {
                return res.status(404).json({
                    success: false,
                    message: 'Importe no encontrado',
                });
            }
            res.json({ success: true, data: importe });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/importes/charge
     * Cobrar un importe por codigo
     */
    async charge(req, res, next) {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Codigo requerido',
                });
            }

            const importe = await Importe.charge(code);
            if (!importe) {
                return res.status(404).json({
                    success: false,
                    message: 'Importe no encontrado o ya fue cobrado',
                });
            }

            res.json({ success: true, data: importe });
        } catch (err) {
            next(err);
        }
    },

    // ==================== Productos predefinidos ====================

    /**
     * GET /api/importes/products
     * Listar productos predefinidos
     */
    async listProducts(req, res, next) {
        try {
            const products = await ImporteProduct.listActive();
            res.json({ success: true, data: products });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/importes/products
     * Crear producto predefinido (admin)
     */
    async createProduct(req, res, next) {
        try {
            const { valid, missing } = validateRequired(req.body, ['name', 'price']);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes: ' + missing.join(', '),
                });
            }

            const product = await ImporteProduct.create(req.body);
            res.status(201).json({ success: true, data: product });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/importes/products/:id
     * Actualizar producto predefinido (admin)
     */
    async updateProduct(req, res, next) {
        try {
            const product = await ImporteProduct.update(req.params.id, req.body);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado',
                });
            }
            res.json({ success: true, data: product });
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/importes/products/:id
     * Desactivar producto predefinido (admin)
     */
    async deleteProduct(req, res, next) {
        try {
            const product = await ImporteProduct.deactivate(req.params.id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado',
                });
            }
            res.json({ success: true, data: product });
        } catch (err) {
            next(err);
        }
    },

    // ==================== Sincronizacion ====================

    /**
     * POST /api/importes/sync
     * Sincronizar importes desde el cliente
     */
    async sync(req, res, next) {
        try {
            const { importes } = req.body;
            const results = [];

            if (importes && Array.isArray(importes)) {
                for (const importe of importes) {
                    const result = await Importe.upsert({
                        ...importe,
                        user_id: req.user.id,
                    });
                    if (result) results.push(result);
                }
            }

            res.json({ success: true, data: results });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/importes/sync/:since
     * Obtener cambios desde una fecha
     */
    async getChanges(req, res, next) {
        try {
            const since = req.params.since || new Date(0).toISOString();
            const changes = await Importe.getChangesSince(since);
            const productChanges = await ImporteProduct.getChangesSince(since);

            res.json({
                success: true,
                data: {
                    importes: changes,
                    products: productChanges,
                },
            });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = importesController;
