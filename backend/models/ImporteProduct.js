/**
 * Modelo de Productos de Importe
 * Productos predefinidos editables por admin
 */
const db = require('../config/db');

const ImporteProduct = {
    /**
     * Listar productos activos
     */
    async listActive() {
        const { rows } = await db.query(
            'SELECT * FROM importe_products WHERE active = true ORDER BY name ASC'
        );
        return rows;
    },

    /**
     * Listar todos los productos (incluido inactivos)
     */
    async listAll() {
        const { rows } = await db.query(
            'SELECT * FROM importe_products ORDER BY name ASC'
        );
        return rows;
    },

    /**
     * Crear un producto
     */
    async create({ name, price }) {
        const { rows } = await db.query(
            `INSERT INTO importe_products (name, price) VALUES ($1, $2) RETURNING *`,
            [name, price]
        );
        return rows[0];
    },

    /**
     * Actualizar un producto
     */
    async update(id, { name, price, active }) {
        const fields = [];
        const values = [];
        let idx = 1;

        if (name !== undefined) {
            fields.push(`name = $${idx++}`);
            values.push(name);
        }
        if (price !== undefined) {
            fields.push(`price = $${idx++}`);
            values.push(price);
        }
        if (active !== undefined) {
            fields.push(`active = $${idx++}`);
            values.push(active);
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const { rows } = await db.query(
            `UPDATE importe_products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return rows[0] || null;
    },

    /**
     * Eliminar un producto (soft delete)
     */
    async deactivate(id) {
        const { rows } = await db.query(
            `UPDATE importe_products SET active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Obtener cambios desde una fecha
     */
    async getChangesSince(since) {
        const { rows } = await db.query(
            `SELECT * FROM importe_products WHERE updated_at > $1 ORDER BY updated_at ASC`,
            [since]
        );
        return rows;
    },
};

module.exports = ImporteProduct;
