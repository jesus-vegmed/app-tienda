/**
 * Rutas de autenticacion
 */
const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Login (admin por password, cajero por codigo)
router.post('/login', authController.login);

// Obtener usuario autenticado
router.get('/me', auth, authController.me);

module.exports = router;
