/**
 * Rutas de proveedores
 */
const router = require('express').Router();
const suppliersController = require('../controllers/suppliersController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(auth);

// ==================== Proveedores ====================

// Listar proveedores
router.get('/', suppliersController.list);

// Crear proveedor
router.post('/', suppliersController.create);

// Obtener proveedor con entradas
router.get('/:id', suppliersController.getById);

// ==================== Entradas ====================

// Crear entrada
router.post('/:id/entries', suppliersController.createEntry);

// Obtener entrada especifica
router.get('/entries/:id', suppliersController.getEntry);

// Registrar entrega parcial
router.post('/entries/:id/deliveries', suppliersController.addDelivery);

// Cerrar entrada repetitiva
router.post('/entries/:id/close', suppliersController.closeEntry);

// Subir imagen de ticket
router.post(
    '/entries/:id/image',
    suppliersController.upload,
    suppliersController.uploadImage
);

// ==================== Sincronizacion ====================

// Sincronizar entradas
router.post('/sync', suppliersController.sync);

module.exports = router;
