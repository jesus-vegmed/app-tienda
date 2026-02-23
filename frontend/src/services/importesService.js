/**
 * Servicio de importes (envases retornables)
 * Operaciones locales + cola de sync
 */
import { getDB, generateUUID, generateLocalCode } from '../database/init';
import syncService from './syncService';
import api from './api';

const importesService = {
    /**
     * Crear importe local con nombre de cliente
     */
    async create({ items, clientName, userId }) {
        const database = await getDB();
        const id = generateUUID();
        const code = generateLocalCode();
        const now = new Date().toISOString();

        // Intentar agregar columna client_name si no existe (migracion en caliente)
        try {
            await database.runAsync('ALTER TABLE importes ADD COLUMN client_name TEXT');
        } catch (e) { /* columna ya existe, ignorar */ }

        await database.runAsync(
            `INSERT INTO importes (id, code, client_name, status, user_id, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, 'activo', ?, 'pending', ?, ?)`,
            [id, code, clientName || null, userId, now, now]
        );

        // Insertar items
        for (const item of items) {
            const itemId = generateUUID();
            await database.runAsync(
                `INSERT INTO importe_items (id, importe_id, product_name, price, quantity, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [itemId, id, item.product_name, item.price, item.quantity || 1, now]
            );
        }

        // Agregar a cola de sync
        await syncService.enqueue('importes', id, 'insert', {
            id, code, client_name: clientName, status: 'activo', user_id: userId, items, created_at: now, updated_at: now,
        });

        return { id, code, client_name: clientName, status: 'activo', items, created_at: now };
    },

    /**
     * Listar importes locales con filtro por estado
     */
    async list(status) {
        const database = await getDB();
        let query = `
      SELECT i.*,
        (SELECT COALESCE(SUM(ii.price * ii.quantity), 0)
         FROM importe_items ii WHERE ii.importe_id = i.id) as total
      FROM importes i
    `;
        const params = [];

        // Auto-expirar localmente
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        await database.runAsync(
            `UPDATE importes SET status = 'vencido', updated_at = datetime('now')
       WHERE status = 'activo' AND created_at < ?`,
            [fiveDaysAgo]
        );

        // Auto-eliminar de mas de 30 dias
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await database.runAsync(
            'DELETE FROM importes WHERE created_at < ?',
            [thirtyDaysAgo]
        );

        if (status) {
            query += ' WHERE i.status = ?';
            params.push(status);
        }

        query += ' ORDER BY i.created_at DESC';

        const rows = await database.getAllAsync(query, params);
        return rows;
    },

    /**
     * Obtener importe por ID con items
     */
    async getById(id) {
        const database = await getDB();
        const importe = await database.getFirstAsync(
            'SELECT * FROM importes WHERE id = ?', [id]
        );
        if (!importe) return null;

        const items = await database.getAllAsync(
            'SELECT * FROM importe_items WHERE importe_id = ?', [id]
        );

        return { ...importe, items };
    },

    /**
     * Cobrar importe por codigo (local)
     */
    async charge(code) {
        const database = await getDB();
        const now = new Date().toISOString();

        const importe = await database.getFirstAsync(
            `SELECT * FROM importes WHERE code = ? AND status IN ('activo', 'vencido')`,
            [code.toUpperCase()]
        );

        if (!importe) return null;

        await database.runAsync(
            `UPDATE importes SET status = 'cobrado', updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
            [now, importe.id]
        );

        // Agregar a cola de sync
        await syncService.enqueue('importes', importe.id, 'update', {
            id: importe.id, code: importe.code, status: 'cobrado',
            user_id: importe.user_id, updated_at: now,
        });

        return { ...importe, status: 'cobrado' };
    },

    /**
     * Buscar importe por codigo
     */
    async findByCode(code) {
        const database = await getDB();
        const importe = await database.getFirstAsync(
            'SELECT * FROM importes WHERE code = ?',
            [code.toUpperCase()]
        );
        if (!importe) return null;

        const items = await database.getAllAsync(
            'SELECT * FROM importe_items WHERE importe_id = ?',
            [importe.id]
        );

        return { ...importe, items };
    },
};

export default importesService;
