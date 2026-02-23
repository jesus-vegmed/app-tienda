/**
 * Servicio de corte de caja
 * Operaciones locales + cola de sync
 * Incluye nombre del cajero
 */
import { getDB, generateUUID } from '../database/init';
import syncService from './syncService';

const cashRegisterService = {
    /**
     * Migrar columna user_name si no existe
     */
    async _migrate(database) {
        try {
            await database.runAsync('ALTER TABLE cash_registers ADD COLUMN user_name TEXT');
        } catch (e) { /* ya existe */ }
    },

    /**
     * Crear corte de caja (local primero)
     */
    async create({ denominations, expected, fund, notes, userId, userName }) {
        const database = await getDB();
        await this._migrate(database);

        const id = generateUUID();
        const now = new Date().toISOString();

        // Calcular total real
        let actual = 0;
        if (denominations && typeof denominations === 'object') {
            for (const [denom, count] of Object.entries(denominations)) {
                actual += parseFloat(denom) * parseInt(count || 0, 10);
            }
        }

        const currentFund = fund || 800;
        const withdrawal = Math.max(0, actual - currentFund);

        // Calcular retiro por denominaciones
        const DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5];
        let remaining = withdrawal;
        const withdrawalDetail = {};
        for (const denom of DENOMS) {
            if (remaining <= 0) break;
            const available = parseInt(denominations[denom] || 0, 10);
            const needed = Math.floor(remaining / denom);
            const toTake = Math.min(needed, available);
            if (toTake > 0) {
                withdrawalDetail[denom] = toTake;
                remaining -= toTake * denom;
            }
        }

        await database.runAsync(
            `INSERT INTO cash_registers
        (id, user_id, user_name, denominations, expected, actual, fund, withdrawal, withdrawal_detail, notes, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
            [
                id, userId, userName || null,
                JSON.stringify(denominations),
                expected, actual, currentFund, withdrawal,
                JSON.stringify(withdrawalDetail),
                notes || null, now, now,
            ]
        );

        // Agregar a cola de sync
        await syncService.enqueue('cash_registers', id, 'insert', {
            id, user_id: userId, user_name: userName, denominations, expected, actual,
            fund: currentFund, withdrawal, withdrawal_detail: withdrawalDetail,
            notes, created_at: now, updated_at: now,
        });

        return {
            id, user_id: userId, user_name: userName, denominations, expected, actual,
            fund: currentFund, withdrawal, withdrawal_detail: withdrawalDetail,
            notes, created_at: now, updated_at: now,
        };
    },

    /**
     * Obtener historial local
     */
    async list(userId, role) {
        const database = await getDB();
        await this._migrate(database);

        let query;
        let params;

        if (role === 'admin') {
            query = 'SELECT * FROM cash_registers ORDER BY created_at DESC LIMIT 50';
            params = [];
        } else {
            query = 'SELECT * FROM cash_registers WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
            params = [userId];
        }

        const rows = await database.getAllAsync(query, params);
        return rows.map((r) => ({
            ...r,
            denominations: JSON.parse(r.denominations || '{}'),
            withdrawal_detail: JSON.parse(r.withdrawal_detail || '{}'),
        }));
    },
};

export default cashRegisterService;
