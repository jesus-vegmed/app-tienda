/**
 * Rutas de importes (envases retornables)
 */
const router = require('express').Router();
const importesController = require('../controllers/importesController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

// Todas las rutas requieren autenticacion
router.use(auth);

// ==================== Importes ====================

// Crear importe
router.post('/', importesController.create);

// Listar importes (con filtro por estado)
router.get('/', importesController.list);

// Cobrar importe por codigo
router.post('/charge', importesController.charge);

// Obtener importe por ID
router.get('/:id', importesController.getById);

// ==================== Productos predefinidos ====================

// Listar productos
router.get('/products/list', importesController.listProducts);

// Crear producto (admin)
router.post('/products', auth, requireRole('admin'), importesController.createProduct);

// Actualizar producto (admin)
router.put('/products/:id', auth, requireRole('admin'), importesController.updateProduct);

// Eliminar producto (admin)
router.delete('/products/:id', auth, requireRole('admin'), importesController.deleteProduct);

// ==================== Sincronizacion ====================

// Sincronizar importes desde cliente
router.post('/sync', importesController.sync);

// Obtener cambios desde una fecha
router.get('/sync/:since', importesController.getChanges);

module.exports = router;
