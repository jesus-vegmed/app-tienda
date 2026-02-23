/**
 * Servicio de proveedores - Reescrito
 * Repetitivo: solo cantidad + notas -> entregas parciales -> cerrar con monto + ticket
 * Unico: monto obligatorio, nota, ticket opcional (se cierra al crear)
 * Incluye user_name en entregas para saber quien recibio
 */
import { getDB, generateUUID } from '../database/init';
import syncService from './syncService';

const suppliersService = {
    /**
     * Migrar columnas si no existen
     */
    async _migrate(database) {
        const migrations = [
            'ALTER TABLE supplier_deliveries ADD COLUMN user_name TEXT',
            'ALTER TABLE supplier_deliveries ADD COLUMN notes TEXT',
        ];
        for (const sql of migrations) {
            try { await database.runAsync(sql); } catch (e) { /* ya existe */ }
        }
    },

    /**
     * Crear entrada de proveedor
     */
    async createEntry({ supplierName, type, amount, quantity, notes, ticketUri, userId }) {
        const database = await getDB();
        const id = generateUUID();
        const now = new Date().toISOString();

        await database.runAsync(
            `INSERT INTO supplier_entries
        (id, supplier_id, supplier_name, supplier_type, amount, quantity, has_ticket, notes, user_id, is_closed, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
            [id, '', supplierName, type, amount || null, quantity || null,
                ticketUri ? 1 : 0, notes || null, userId,
                type === 'unico' ? 1 : 0, now, now]
        );

        await syncService.enqueue('supplier_entries', id, 'insert', {
            id, supplier_name: supplierName, supplier_type: type, amount, quantity,
            has_ticket: !!ticketUri, notes, user_id: userId,
            is_closed: type === 'unico', created_at: now, updated_at: now,
        });

        return { id, supplier_name: supplierName, supplier_type: type, amount, quantity, created_at: now };
    },

    /**
     * Listar entradas con filtro
     */
    async listEntries({ showClosed = false, daysBack = null, search = '' } = {}) {
        const database = await getDB();
        await this._migrate(database);

        let query = 'SELECT * FROM supplier_entries WHERE 1=1';
        const params = [];

        if (showClosed) {
            query += ' AND is_closed = 1';
        } else {
            query += ' AND is_closed = 0';
        }

        if (daysBack && daysBack > 0) {
            const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
            query += ' AND created_at > ?';
            params.push(since);
        }

        if (search && search.trim()) {
            query += ' AND LOWER(supplier_name) LIKE ?';
            params.push('%' + search.trim().toLowerCase() + '%');
        }

        query += ' ORDER BY created_at DESC';
        const rows = await database.getAllAsync(query, params);

        // Cargar entregas para cada entrada
        for (const row of rows) {
            const deliveries = await database.getAllAsync(
                'SELECT * FROM supplier_deliveries WHERE entry_id = ? ORDER BY created_at ASC',
                [row.id]
            );
            row.deliveries = deliveries;
        }

        return rows;
    },

    /**
     * Agregar entrega parcial (para repetitivo)
     * amount aquí significa "cantidad de productos"
     */
    async addDelivery({ entryId, quantity, notes, userId, userName }) {
        const database = await getDB();
        await this._migrate(database);

        const id = generateUUID();
        const now = new Date().toISOString();

        await database.runAsync(
            `INSERT INTO supplier_deliveries (id, entry_id, amount, user_id, user_name, notes, sync_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [id, entryId, quantity, userId, userName || null, notes || null, now]
        );

        await syncService.enqueue('supplier_deliveries', id, 'insert', {
            entry_id: entryId, amount: quantity, user_id: userId, user_name: userName, notes,
        });

        return { id, entry_id: entryId, amount: quantity, user_name: userName, created_at: now };
    },

    /**
     * Cerrar entrada repetitiva con monto total
     */
    async closeEntry(entryId, totalAmount, hasTicket) {
        const database = await getDB();
        const now = new Date().toISOString();

        await database.runAsync(
            `UPDATE supplier_entries SET is_closed = 1, amount = ?, has_ticket = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
            [totalAmount, hasTicket ? 1 : 0, now, entryId]
        );

        await syncService.enqueue('supplier_entries', entryId, 'update', {
            id: entryId, amount: totalAmount, has_ticket: hasTicket ? 1 : 0, is_closed: 1,
        });

        return { total: totalAmount };
    },
};

export default suppliersService;
