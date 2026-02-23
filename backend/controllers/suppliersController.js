/**
 * Controlador de Proveedores
 * Proveedores unicos y repetitivos con entregas parciales
 */
const Supplier = require('../models/Supplier');
const multer = require('multer');
const path = require('path');
const { validateRequired, isValidSupplierType } = require('../utils/validators');

// Configuracion de multer para imagenes de tickets
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imagenes JPG, PNG o WebP'));
        }
    },
});

const suppliersController = {
    upload: upload.single('ticket_image'),

    /**
     * POST /api/suppliers
     * Crear un proveedor
     */
    async create(req, res, next) {
        try {
            const { valid, missing } = validateRequired(req.body, ['name', 'type']);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes: ' + missing.join(', '),
                });
            }

            if (!isValidSupplierType(req.body.type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de proveedor invalido. Usar: unico o repetitivo',
                });
            }

            const supplier = await Supplier.create(req.body);
            res.status(201).json({ success: true, data: supplier });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/suppliers
     * Listar proveedores
     */
    async list(req, res, next) {
        try {
            const suppliers = await Supplier.list();
            res.json({ success: true, data: suppliers });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/suppliers/:id
     * Obtener proveedor con sus entradas
     */
    async getById(req, res, next) {
        try {
            const supplier = await Supplier.findById(req.params.id);
            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: 'Proveedor no encontrado',
                });
            }

            const show_all = req.query.show_all === 'true';
            const entries = await Supplier.listEntries({
                supplier_id: supplier.id,
                show_all,
            });

            res.json({ success: true, data: { ...supplier, entries } });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/suppliers/:id/entries
     * Crear una entrada de proveedor (compra)
     */
    async createEntry(req, res, next) {
        try {
            const supplier = await Supplier.findById(req.params.id);
            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: 'Proveedor no encontrado',
                });
            }

            // Proveedor unico: monto obligatorio
            if (supplier.type === 'unico') {
                if (!req.body.amount) {
                    return res.status(400).json({
                        success: false,
                        message: 'El monto es obligatorio para proveedores unicos',
                    });
                }
            }

            const entry = await Supplier.createEntry({
                supplier_id: supplier.id,
                amount: req.body.amount,
                quantity: req.body.quantity,
                has_ticket: req.body.has_ticket || false,
                notes: req.body.notes,
                user_id: req.user.id,
                created_at: req.body.created_at,
                updated_at: req.body.updated_at,
            });

            res.status(201).json({ success: true, data: entry });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/suppliers/entries/:id
     * Obtener una entrada especifica
     */
    async getEntry(req, res, next) {
        try {
            const entries = await Supplier.listEntries({
                supplier_id: null,
                show_all: true,
            });
            // Buscar por ID directamente
            const { rows } = await require('../config/db').query(
                `SELECT se.*, u.username as cashier_name, s.name as supplier_name, s.type as supplier_type
         FROM supplier_entries se
         JOIN users u ON se.user_id = u.id
         JOIN suppliers s ON se.supplier_id = s.id
         WHERE se.id = $1`,
                [req.params.id]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Entrada no encontrada',
                });
            }

            const entry = rows[0];

            // Si es repetitivo, incluir entregas
            if (entry.supplier_type === 'repetitivo') {
                entry.deliveries = await Supplier.listDeliveries(entry.id);
                // No mostrar monto acumulado hasta que este cerrado
                if (!entry.is_closed) {
                    entry.amount = null;
                }
            }

            res.json({ success: true, data: entry });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/suppliers/entries/:id/deliveries
     * Registrar entrega parcial (repetitivo)
     */
    async addDelivery(req, res, next) {
        try {
            const { amount } = req.body;
            if (!amount) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto es requerido',
                });
            }

            const delivery = await Supplier.addDelivery({
                entry_id: req.params.id,
                amount: parseFloat(amount),
                user_id: req.user.id,
            });

            res.status(201).json({ success: true, data: delivery });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/suppliers/entries/:id/close
     * Cerrar una entrada repetitiva
     */
    async closeEntry(req, res, next) {
        try {
            const entry = await Supplier.closeEntry(req.params.id);
            if (!entry) {
                return res.status(404).json({
                    success: false,
                    message: 'Entrada no encontrada',
                });
            }
            res.json({ success: true, data: entry });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/suppliers/entries/:id/image
     * Subir imagen de ticket
     */
    async uploadImage(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Imagen requerida',
                });
            }

            const imagePath = '/uploads/' + req.file.filename;
            const entry = await Supplier.uploadTicketImage(req.params.id, imagePath);

            if (!entry) {
                return res.status(404).json({
                    success: false,
                    message: 'Entrada no encontrada',
                });
            }

            res.json({ success: true, data: entry });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/suppliers/sync
     * Sincronizar entradas desde el cliente
     */
    async sync(req, res, next) {
        try {
            const { entries } = req.body;
            const results = [];

            if (entries && Array.isArray(entries)) {
                for (const entry of entries) {
                    const result = await Supplier.upsertEntry({
                        ...entry,
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
};

module.exports = suppliersController;
