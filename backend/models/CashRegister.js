/**
 * Modelo de Corte de Caja
 * Operaciones para registrar y consultar cortes de caja
 */
const db = require('../config/db');

const CashRegister = {
    /**
     * Crear un nuevo corte de caja
     */
    async create({ user_id, denominations, expected, actual, fund, withdrawal, withdrawal_detail, notes }) {
        const { rows } = await db.query(
            `INSERT INTO cash_registers
        (user_id, denominations, expected, actual, fund, withdrawal, withdrawal_detail, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                user_id,
                JSON.stringify(denominations || {}),
                expected || 0,
                actual || 0,
                fund || 800,
                withdrawal || 0,
                JSON.stringify(withdrawal_detail || {}),
                notes || null,
            ]
        );
        return rows[0];
    },

    /**
     * Obtener historial de cortes (admin ve todos, cajero solo los suyos)
     */
    async list({ user_id, role, limit = 50, offset = 0 }) {
        let query;
        let params;

        if (role === 'admin') {
            query = `
        SELECT cr.*, u.username as cashier_name
        FROM cash_registers cr
        JOIN users u ON cr.user_id = u.id
        ORDER BY cr.created_at DESC
        LIMIT $1 OFFSET $2
      `;
            params = [limit, offset];
        } else {
            query = `
        SELECT cr.*, u.username as cashier_name
        FROM cash_registers cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.user_id = $1
        ORDER BY cr.created_at DESC
        LIMIT $2 OFFSET $3
      `;
            params = [user_id, limit, offset];
        }

        const { rows } = await db.query(query, params);
        return rows;
    },

    /**
     * Obtener un corte por ID
     */
    async findById(id) {
        const { rows } = await db.query(
            `SELECT cr.*, u.username as cashier_name
       FROM cash_registers cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Sincronizar un corte desde el cliente
     */
    async upsert({ id, user_id, denominations, expected, actual, fund, withdrawal, withdrawal_detail, notes, created_at, updated_at }) {
        const { rows } = await db.query(
            `INSERT INTO cash_registers
        (id, user_id, denominations, expected, actual, fund, withdrawal, withdrawal_detail, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
        denominations = EXCLUDED.denominations,
        expected = EXCLUDED.expected,
        actual = EXCLUDED.actual,
        fund = EXCLUDED.fund,
        withdrawal = EXCLUDED.withdrawal,
        withdrawal_detail = EXCLUDED.withdrawal_detail,
        notes = EXCLUDED.notes,
        updated_at = EXCLUDED.updated_at
       WHERE cash_registers.updated_at < EXCLUDED.updated_at
       RETURNING *`,
            [
                id, user_id,
                JSON.stringify(denominations || {}),
                expected || 0, actual || 0, fund || 800,
                withdrawal || 0,
                JSON.stringify(withdrawal_detail || {}),
                notes || null,
                created_at || new Date().toISOString(),
                updated_at || new Date().toISOString(),
            ]
        );
        return rows[0] || null;
    },
};

module.exports = CashRegister;
