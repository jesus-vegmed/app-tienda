/**
 * Modelo de Faltantes
 * Solo opera en la nube, sin almacenamiento local
 */
const db = require('../config/db');

const MissingItem = {
    /**
     * Crear un faltante
     */
    async create({ product_name, size, urgency }) {
        const { rows } = await db.query(
            `INSERT INTO missing_items (product_name, size, urgency)
       VALUES ($1, $2, $3) RETURNING *`,
            [product_name, size || null, urgency || 'media']
        );
        return rows[0];
    },

    /**
     * Listar faltantes ordenados por urgencia
     */
    async list({ show_purchased = false }) {
        let query = `
      SELECT * FROM missing_items
    `;

        if (!show_purchased) {
            query += ' WHERE purchased = false';
        }

        // Ordenar por urgencia: alta > media > baja
        query += `
      ORDER BY
        CASE urgency
          WHEN 'alta' THEN 1
          WHEN 'media' THEN 2
          WHEN 'baja' THEN 3
        END ASC,
        created_at DESC
    `;

        const { rows } = await db.query(query);
        return rows;
    },

    /**
     * Buscar por ID
     */
    async findById(id) {
        const { rows } = await db.query(
            'SELECT * FROM missing_items WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Marcar como comprado
     */
    async markAsPurchased(id) {
        const { rows } = await db.query(
            `UPDATE missing_items SET purchased = true, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Eliminar un faltante
     */
    async delete(id) {
        const { rows } = await db.query(
            'DELETE FROM missing_items WHERE id = $1 RETURNING *',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Actualizar un faltante
     */
    async update(id, { product_name, size, urgency }) {
        const fields = [];
        const values = [];
        let idx = 1;

        if (product_name !== undefined) {
            fields.push(`product_name = $${idx++}`);
            values.push(product_name);
        }
        if (size !== undefined) {
            fields.push(`size = $${idx++}`);
            values.push(size);
        }
        if (urgency !== undefined) {
            fields.push(`urgency = $${idx++}`);
            values.push(urgency);
        }

        if (fields.length === 0) return this.findById(id);

        fields.push('updated_at = NOW()');
        values.push(id);

        const { rows } = await db.query(
            `UPDATE missing_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return rows[0] || null;
    },
};

module.exports = MissingItem;
