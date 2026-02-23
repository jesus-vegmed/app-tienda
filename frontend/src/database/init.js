/**
 * Inicializacion de base de datos SQLite local
 * Esquema local que espeja el backend con columnas de sincronizacion
 */
import * as SQLite from 'expo-sqlite';

let db = null;

/**
 * Obtener instancia de la base de datos
 */
export const getDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('tienda_local.db');
        await db.execAsync('PRAGMA journal_mode = WAL;');
        await db.execAsync('PRAGMA foreign_keys = ON;');
    }
    return db;
};

/**
 * Inicializar todas las tablas locales
 */
export const initDatabase = async () => {
    const database = await getDB();

    await database.execAsync(`
    -- Usuarios (cache local)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      code TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Cortes de caja
    CREATE TABLE IF NOT EXISTS cash_registers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      denominations TEXT NOT NULL DEFAULT '{}',
      expected REAL NOT NULL DEFAULT 0,
      actual REAL NOT NULL DEFAULT 0,
      fund REAL NOT NULL DEFAULT 800,
      withdrawal REAL NOT NULL DEFAULT 0,
      withdrawal_detail TEXT DEFAULT '{}',
      notes TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Productos predefinidos de importes
    CREATE TABLE IF NOT EXISTS importe_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Importes
    CREATE TABLE IF NOT EXISTS importes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'activo',
      user_id TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Items de importes
    CREATE TABLE IF NOT EXISTS importe_items (
      id TEXT PRIMARY KEY,
      importe_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (importe_id) REFERENCES importes(id) ON DELETE CASCADE
    );

    -- Entradas de proveedores
    CREATE TABLE IF NOT EXISTS supplier_entries (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      supplier_name TEXT,
      supplier_type TEXT,
      amount REAL,
      quantity INTEGER,
      has_ticket INTEGER NOT NULL DEFAULT 0,
      ticket_image_local TEXT,
      notes TEXT,
      user_id TEXT NOT NULL,
      is_closed INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Entregas parciales
    CREATE TABLE IF NOT EXISTS supplier_deliveries (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      amount REAL NOT NULL,
      user_id TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES supplier_entries(id) ON DELETE CASCADE
    );

    -- Cola de sincronizacion
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Metadata de sincronizacion
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

    console.log('[DB] Base de datos local inicializada');
};

/**
 * Generar UUID simple
 */
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * Generar codigo de 6 caracteres
 */
export const generateLocalCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
