/**
 * Rutas de faltantes (solo nube)
 */
const router = require('express').Router();
const missingItemsController = require('../controllers/missingItemsController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(auth);

// Crear faltante
router.post('/', missingItemsController.create);

// Listar faltantes
router.get('/', missingItemsController.list);

// Actualizar faltante
router.put('/:id', missingItemsController.update);

// Marcar como comprado
router.post('/:id/purchase', missingItemsController.markAsPurchased);

// Eliminar faltante
router.delete('/:id', missingItemsController.delete);

module.exports = router;
