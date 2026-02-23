/**
 * Rutas de gestion de usuarios (cajeros)
 * Solo accesible por admin
 */
const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

// Todas las rutas requieren autenticacion y rol admin
router.use(auth);
router.use(requireRole('admin'));

// Listar cajeros
router.get('/cashiers', userController.listCashiers);

// Crear cajero
router.post('/cashiers', userController.createCashier);

// Eliminar (desactivar) cajero
router.delete('/cashiers/:id', userController.deleteCashier);

module.exports = router;
