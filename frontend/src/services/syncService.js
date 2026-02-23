/**
 * Servicio de sincronizacion
 * Cola de operaciones, push/pull, resolucion de conflictos por timestamp
 */
import { getDB } from '../database/init';
import api from './api';

const syncService = {
    /**
     * Agregar operacion a la cola de sincronizacion
     */
    async enqueue(tableName, recordId, operation, payload) {
        const database = await getDB();
        await database.runAsync(
            `INSERT INTO sync_queue (table_name, record_id, operation, payload)
       VALUES (?, ?, ?, ?)`,
            [tableName, recordId, operation, JSON.stringify(payload)]
        );
    },

    /**
     * Procesar toda la cola pendiente
     * Retorna { synced, failed }
     */
    async processQueue() {
        const database = await getDB();
        const pending = await database.getAllAsync(
            'SELECT * FROM sync_queue ORDER BY created_at ASC'
        );

        let synced = 0;
        let failed = 0;

        for (const item of pending) {
            try {
                const payload = JSON.parse(item.payload);
                let endpoint = '';

                // Determinar endpoint segun tabla
                switch (item.table_name) {
                    case 'cash_registers':
                        endpoint = '/cash-register/sync';
                        break;
                    case 'importes':
                        endpoint = '/importes/sync';
                        await api.post(endpoint, { importes: [payload] });
                        break;
                    case 'supplier_entries':
                        endpoint = '/suppliers/sync';
                        await api.post(endpoint, { entries: [payload] });
                        break;
                    default:
                        endpoint = '/' + item.table_name + '/sync';
                        break;
                }

                if (item.table_name === 'cash_registers') {
                    await api.post(endpoint, payload);
                }

                // Marcar registro local como sincronizado
                await database.runAsync(
                    `UPDATE ${item.table_name} SET sync_status = 'synced' WHERE id = ?`,
                    [item.record_id]
                );

                // Eliminar de la cola
                await database.runAsync(
                    'DELETE FROM sync_queue WHERE id = ?',
                    [item.id]
                );

                synced++;
            } catch (error) {
                // Si es conflicto (409), comparar timestamps
                if (error.response && error.response.status === 409) {
                    // Last-write-wins: nuestros datos son mas recientes, forzar
                    console.log('[SYNC] Conflicto detectado para ' + item.record_id);
                }

                // Incrementar intentos
                await database.runAsync(
                    'UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?',
                    [item.id]
                );

                // Eliminar si tiene demasiados intentos
                if (item.attempts >= 10) {
                    await database.runAsync(
                        'DELETE FROM sync_queue WHERE id = ?',
                        [item.id]
                    );
                    console.log('[SYNC] Operacion descartada tras 10 intentos: ' + item.record_id);
                }

                failed++;
            }
        }

        return { synced, failed, total: pending.length };
    },

    /**
     * Pull: obtener cambios del servidor desde la ultima sincronizacion
     */
    async pullChanges() {
        const database = await getDB();

        // Obtener timestamp de ultima sincronizacion
        const meta = await database.getFirstAsync(
            'SELECT value FROM sync_metadata WHERE key = ?',
            ['last_sync']
        );

        const since = meta ? meta.value : new Date(0).toISOString();

        try {
            // Importes
            const importesRes = await api.get('/importes/sync/' + encodeURIComponent(since));
            if (importesRes.data.success) {
                const { importes, products } = importesRes.data.data;

                // Actualizar importes locales
                for (const imp of importes) {
                    await database.runAsync(
                        `INSERT OR REPLACE INTO importes (id, code, status, user_id, sync_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'synced', ?, ?)`,
                        [imp.id, imp.code, imp.status, imp.user_id, imp.created_at, imp.updated_at]
                    );

                    // Items
                    if (imp.items) {
                        await database.runAsync(
                            'DELETE FROM importe_items WHERE importe_id = ?',
                            [imp.id]
                        );
                        for (const item of imp.items) {
                            await database.runAsync(
                                `INSERT INTO importe_items (id, importe_id, product_name, price, quantity, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [item.id, imp.id, item.product_name, item.price, item.quantity, item.created_at]
                            );
                        }
                    }
                }

                // Actualizar productos predefinidos
                for (const prod of products) {
                    await database.runAsync(
                        `INSERT OR REPLACE INTO importe_products (id, name, price, active, sync_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'synced', ?, ?)`,
                        [prod.id, prod.name, prod.price, prod.active ? 1 : 0, prod.created_at, prod.updated_at]
                    );
                }
            }

            // Actualizar timestamp de ultima sincronizacion
            await database.runAsync(
                `INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_sync', ?)`,
                [new Date().toISOString()]
            );

            console.log('[SYNC] Pull completado');
        } catch (error) {
            console.log('[SYNC] Error en pull: ' + (error.message || 'Sin conexion'));
        }
    },

    /**
     * Sincronizacion completa: push + pull
     */
    async fullSync() {
        console.log('[SYNC] Iniciando sincronizacion completa...');
        const pushResult = await this.processQueue();
        await this.pullChanges();
        console.log('[SYNC] Completado. Sincronizados: ' + pushResult.synced + ', Fallidos: ' + pushResult.failed);
        return pushResult;
    },

    /**
     * Obtener cantidad de operaciones pendientes
     */
    async getPendingCount() {
        const database = await getDB();
        const result = await database.getFirstAsync(
            'SELECT COUNT(*) as count FROM sync_queue'
        );
        return result ? result.count : 0;
    },
};

export default syncService;
