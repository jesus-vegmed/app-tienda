/**
 * Script para ejecutar migraciones SQL
 * Uso: node migrations/run.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const runMigrations = async () => {
    const client = await pool.connect();
    try {
        // Crear tabla de control de migraciones
        await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

        // Leer archivos de migracion
        const migrationsDir = __dirname;
        const files = fs.readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            // Verificar si ya fue ejecutada
            const { rows } = await client.query(
                'SELECT id FROM _migrations WHERE name = $1',
                [file]
            );

            if (rows.length > 0) {
                console.log('[MIGRACION] Ya ejecutada: ' + file);
                continue;
            }

            // Ejecutar migracion
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO _migrations (name) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log('[MIGRACION] Ejecutada: ' + file);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('[MIGRACION] Error en ' + file + ':', err.message);
                throw err;
            }
        }

        console.log('[MIGRACION] Todas las migraciones completadas');
    } finally {
        client.release();
        await pool.end();
    }
};

runMigrations().catch((err) => {
    console.error('[MIGRACION] Error fatal:', err);
    process.exit(1);
});
