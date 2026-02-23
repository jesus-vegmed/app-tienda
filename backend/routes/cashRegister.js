/**
 * Rutas de corte de caja
 */
const router = require('express').Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

// Todas las rutas requieren autenticacion
router.use(auth);

// Crear corte
router.post('/', cashRegisterController.create);

// Listar historial (admin ve todos, cajero ve los suyos)
router.get('/', cashRegisterController.list);

// Obtener corte por ID
router.get('/:id', cashRegisterController.getById);

// Sincronizar corte desde cliente
router.post('/sync', cashRegisterController.sync);

module.exports = router;
