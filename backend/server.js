/**
 * Servidor principal - Sistema de Gestion de Tienda
 * Express + PostgreSQL | API REST
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const errorHandler = require('./middleware/errorHandler');

// Rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cashRegisterRoutes = require('./routes/cashRegister');
const importesRoutes = require('./routes/importes');
const supplierRoutes = require('./routes/suppliers');
const missingItemsRoutes = require('./routes/missingItems');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Middleware global ====================

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Carpeta de uploads estatica
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== Rutas de la API ====================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/importes', importesRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/missing-items', missingItemsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== Manejo de errores ====================

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Manejador centralizado de errores
app.use(errorHandler);

// ==================== Iniciar servidor ====================

app.listen(PORT, () => {
    console.log('[SERVIDOR] Corriendo en puerto ' + PORT);
    console.log('[SERVIDOR] Entorno: ' + (process.env.NODE_ENV || 'development'));
});

module.exports = app;
