/**
 * Modelo de Usuario
 * Maneja operaciones CRUD para admins y cajeros
 */
const db = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
    /**
     * Buscar usuario por username
     */
    async findByUsername(username) {
        const { rows } = await db.query(
            'SELECT * FROM users WHERE username = $1 AND active = true',
            [username]
        );
        return rows[0] || null;
    },

    /**
     * Buscar usuario por codigo (cajeros)
     */
    async findByCode(code) {
        const { rows } = await db.query(
            'SELECT * FROM users WHERE code = $1 AND active = true AND role = $2',
            [code, 'cajero']
        );
        return rows[0] || null;
    },

    /**
     * Buscar usuario por ID
     */
    async findById(id) {
        const { rows } = await db.query(
            'SELECT id, username, role, code, active, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Crear un nuevo usuario
     */
    async create({ username, password, code, role }) {
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }
        const { rows } = await db.query(
            `INSERT INTO users (username, password_hash, code, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, code, active, created_at, updated_at`,
            [username, passwordHash, code || null, role || 'cajero']
        );
        return rows[0];
    },

    /**
     * Listar todos los cajeros
     */
    async listCashiers() {
        const { rows } = await db.query(
            `SELECT id, username, code, role, active, created_at, updated_at
       FROM users WHERE role = $1 ORDER BY created_at DESC`,
            ['cajero']
        );
        return rows;
    },

    /**
     * Eliminar (desactivar) un cajero
     */
    async deactivate(id) {
        const { rows } = await db.query(
            `UPDATE users SET active = false, updated_at = NOW()
       WHERE id = $1 AND role = $2
       RETURNING id, username, role, active`,
            [id, 'cajero']
        );
        return rows[0] || null;
    },

    /**
     * Verificar contrasena admin
     */
    async verifyPassword(plainPassword, hash) {
        return bcrypt.compare(plainPassword, hash);
    },
};

module.exports = User;
