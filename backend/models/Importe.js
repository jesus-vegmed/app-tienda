/**
 * Modelo de Importe (envases retornables)
 * Maneja tickets con multiples productos, estados y expiracion
 */
const db = require('../config/db');

const Importe = {
    /**
     * Crear un nuevo importe con sus items
     */
    async create({ id, code, user_id, items, created_at, updated_at }) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                `INSERT INTO importes (id, code, status, user_id, created_at, updated_at)
         VALUES ($1, $2, 'activo', $3, $4, $5)
         RETURNING *`,
                [
                    id || undefined,
                    code,
                    user_id,
                    created_at || new Date().toISOString(),
                    updated_at || new Date().toISOString(),
                ]
            );

            const importe = rows[0];

            // Insertar items del importe
            if (items && items.length > 0) {
                for (const item of items) {
                    await client.query(
                        `INSERT INTO importe_items (importe_id, product_name, price, quantity)
             VALUES ($1, $2, $3, $4)`,
                        [importe.id, item.product_name, item.price, item.quantity || 1]
                    );
                }
            }

            await client.query('COMMIT');

            // Retornar con items
            return this.findById(importe.id);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    /**
     * Buscar importe por ID con items
     */
    async findById(id) {
        const { rows: importeRows } = await db.query(
            `SELECT i.*, u.username as cashier_name
       FROM importes i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
            [id]
        );

        if (importeRows.length === 0) return null;

        const importe = importeRows[0];
        const { rows: items } = await db.query(
            'SELECT * FROM importe_items WHERE importe_id = $1',
            [id]
        );

        return { ...importe, items };
    },

    /**
     * Buscar importe por codigo unico
     */
    async findByCode(code) {
        const { rows } = await db.query(
            'SELECT id FROM importes WHERE code = $1',
            [code.toUpperCase()]
        );
        if (rows.length === 0) return null;
        return this.findById(rows[0].id);
    },

    /**
     * Listar importes con filtro por estado
     */
    async list({ status, limit = 50, offset = 0 }) {
        let query = `
      SELECT i.*, u.username as cashier_name,
        (SELECT COALESCE(SUM(ii.price * ii.quantity), 0)
         FROM importe_items ii WHERE ii.importe_id = i.id) as total
      FROM importes i
      LEFT JOIN users u ON i.user_id = u.id
    `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` WHERE i.status = $${params.length}`;
        }

        params.push(limit);
        query += ` ORDER BY i.created_at DESC LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const { rows } = await db.query(query, params);
        return rows;
    },

    /**
     * Cobrar un importe por codigo
     */
    async charge(code) {
        const { rows } = await db.query(
            `UPDATE importes SET status = 'cobrado', updated_at = NOW()
       WHERE code = $1 AND status IN ('activo', 'vencido')
       RETURNING *`,
            [code.toUpperCase()]
        );
        if (rows.length === 0) return null;
        return this.findById(rows[0].id);
    },

    /**
     * Marcar como vencidos los importes de mas de 5 dias
     */
    async expireOld() {
        const { rowCount } = await db.query(
            `UPDATE importes SET status = 'vencido', updated_at = NOW()
       WHERE status = 'activo'
       AND created_at < NOW() - INTERVAL '5 days'`
        );
        return rowCount;
    },

    /**
     * Eliminar importes de mas de 30 dias
     */
    async deleteOld() {
        const { rowCount } = await db.query(
            `DELETE FROM importes
       WHERE created_at < NOW() - INTERVAL '30 days'`
        );
        return rowCount;
    },

    /**
     * Obtener cambios desde una fecha (para sincronizacion)
     */
    async getChangesSince(since) {
        const { rows } = await db.query(
            `SELECT i.*, u.username as cashier_name
       FROM importes i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.updated_at > $1
       ORDER BY i.updated_at ASC`,
            [since]
        );

        // Adjuntar items
        for (const importe of rows) {
            const { rows: items } = await db.query(
                'SELECT * FROM importe_items WHERE importe_id = $1',
                [importe.id]
            );
            importe.items = items;
        }

        return rows;
    },

    /**
     * Upsert para sincronizacion (last-write-wins)
     */
    async upsert({ id, code, status, user_id, items, created_at, updated_at }) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                `INSERT INTO importes (id, code, status, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
         WHERE importes.updated_at < EXCLUDED.updated_at
         RETURNING *`,
                [id, code, status || 'activo', user_id, created_at, updated_at]
            );

            if (rows.length > 0 && items && items.length > 0) {
                // Reemplazar items
                await client.query('DELETE FROM importe_items WHERE importe_id = $1', [id]);
                for (const item of items) {
                    await client.query(
                        `INSERT INTO importe_items (importe_id, product_name, price, quantity)
             VALUES ($1, $2, $3, $4)`,
                        [id, item.product_name, item.price, item.quantity || 1]
                    );
                }
            }

            await client.query('COMMIT');
            return rows[0] || null;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
};

module.exports = Importe;
