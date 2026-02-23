/**
 * Modelo de Proveedor
 * Maneja proveedores unicos y repetitivos con entregas parciales
 */
const db = require('../config/db');

const Supplier = {
    /**
     * Crear un nuevo proveedor
     */
    async create({ name, type }) {
        const { rows } = await db.query(
            `INSERT INTO suppliers (name, type) VALUES ($1, $2) RETURNING *`,
            [name, type]
        );
        return rows[0];
    },

    /**
     * Listar proveedores
     */
    async list() {
        const { rows } = await db.query(
            'SELECT * FROM suppliers WHERE active = true ORDER BY name ASC'
        );
        return rows;
    },

    /**
     * Buscar proveedor por ID
     */
    async findById(id) {
        const { rows } = await db.query(
            'SELECT * FROM suppliers WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Crear una entrada de proveedor (compra)
     */
    async createEntry({ supplier_id, amount, quantity, has_ticket, notes, user_id, created_at, updated_at }) {
        const { rows } = await db.query(
            `INSERT INTO supplier_entries
        (supplier_id, amount, quantity, has_ticket, notes, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                supplier_id,
                amount || null,
                quantity || null,
                has_ticket || false,
                notes || null,
                user_id,
                created_at || new Date().toISOString(),
                updated_at || new Date().toISOString(),
            ]
        );
        return rows[0];
    },

    /**
     * Listar entradas de un proveedor
     * No muestra compras antiguas por defecto (ultimos 30 dias)
     */
    async listEntries({ supplier_id, show_all = false, limit = 50, offset = 0 }) {
        let query = `
      SELECT se.*, u.username as cashier_name
      FROM supplier_entries se
      JOIN users u ON se.user_id = u.id
      WHERE se.supplier_id = $1
    `;
        const params = [supplier_id];

        if (!show_all) {
            params.push(30);
            query += ` AND se.created_at > NOW() - INTERVAL '1 day' * $${params.length}`;
        }

        params.push(limit);
        query += ` ORDER BY se.created_at DESC LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const { rows } = await db.query(query, params);
        return rows;
    },

    /**
     * Agregar entrega parcial (proveedores repetitivos)
     */
    async addDelivery({ entry_id, amount, user_id }) {
        const { rows } = await db.query(
            `INSERT INTO supplier_deliveries (entry_id, amount, user_id)
       VALUES ($1, $2, $3) RETURNING *`,
            [entry_id, amount, user_id]
        );
        return rows[0];
    },

    /**
     * Listar entregas de una entrada
     */
    async listDeliveries(entry_id) {
        const { rows } = await db.query(
            `SELECT sd.*, u.username as cashier_name
       FROM supplier_deliveries sd
       JOIN users u ON sd.user_id = u.id
       WHERE sd.entry_id = $1
       ORDER BY sd.created_at ASC`,
            [entry_id]
        );
        return rows;
    },

    /**
     * Cerrar una entrada repetitiva (muestra total final)
     */
    async closeEntry(entry_id) {
        // Calcular total de entregas
        const { rows: deliveries } = await db.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM supplier_deliveries WHERE entry_id = $1',
            [entry_id]
        );

        const total = deliveries[0].total;

        const { rows } = await db.query(
            `UPDATE supplier_entries
       SET is_closed = true, amount = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
            [total, entry_id]
        );

        return rows[0] || null;
    },

    /**
     * Subir imagen de ticket
     */
    async uploadTicketImage(entry_id, imagePath) {
        const { rows } = await db.query(
            `UPDATE supplier_entries
       SET ticket_image = $1, has_ticket = true, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
            [imagePath, entry_id]
        );
        return rows[0] || null;
    },

    /**
     * Upsert para sincronizacion
     */
    async upsertEntry({ id, supplier_id, amount, quantity, has_ticket, notes, user_id, is_closed, created_at, updated_at }) {
        const { rows } = await db.query(
            `INSERT INTO supplier_entries
        (id, supplier_id, amount, quantity, has_ticket, notes, user_id, is_closed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
        amount = EXCLUDED.amount,
        quantity = EXCLUDED.quantity,
        has_ticket = EXCLUDED.has_ticket,
        notes = EXCLUDED.notes,
        is_closed = EXCLUDED.is_closed,
        updated_at = EXCLUDED.updated_at
       WHERE supplier_entries.updated_at < EXCLUDED.updated_at
       RETURNING *`,
            [id, supplier_id, amount, quantity, has_ticket, notes, user_id, is_closed, created_at, updated_at]
        );
        return rows[0] || null;
    },
};

module.exports = Supplier;
