-- ============================================
-- Migracion inicial: Sistema de Gestion de Tienda
-- ============================================

-- Extension para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tabla de usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    code VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'cajero' CHECK (role IN ('admin', 'cajero')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla de cortes de caja
-- ============================================
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    denominations JSONB NOT NULL DEFAULT '{}',
    expected NUMERIC(10, 2) NOT NULL DEFAULT 0,
    actual NUMERIC(10, 2) NOT NULL DEFAULT 0,
    fund NUMERIC(10, 2) NOT NULL DEFAULT 800,
    withdrawal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    withdrawal_detail JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Productos predefinidos para importes
-- ============================================
CREATE TABLE IF NOT EXISTS importe_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Importes (tickets de envases retornables)
-- ============================================
CREATE TABLE IF NOT EXISTS importes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code CHAR(6) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'vencido', 'cobrado')),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Items dentro de un importe
-- ============================================
CREATE TABLE IF NOT EXISTS importe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    importe_id UUID NOT NULL REFERENCES importes(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Proveedores
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('unico', 'repetitivo')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Entradas de proveedores (compras)
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2),
    quantity INTEGER,
    ticket_image VARCHAR(500),
    has_ticket BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    user_id UUID NOT NULL REFERENCES users(id),
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Entregas parciales (proveedores repetitivos)
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES supplier_entries(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Faltantes (solo nube)
-- ============================================
CREATE TABLE IF NOT EXISTS missing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(200) NOT NULL,
    size VARCHAR(100),
    urgency VARCHAR(10) NOT NULL DEFAULT 'media' CHECK (urgency IN ('alta', 'media', 'baja')),
    purchased BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla de sincronizacion
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    client_id VARCHAR(100),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_importes_code ON importes(code);
CREATE INDEX IF NOT EXISTS idx_importes_status ON importes(status);
CREATE INDEX IF NOT EXISTS idx_importes_created ON importes(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_created ON cash_registers(created_at);
CREATE INDEX IF NOT EXISTS idx_supplier_entries_supplier ON supplier_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_deliveries_entry ON supplier_deliveries(entry_id);
CREATE INDEX IF NOT EXISTS idx_missing_items_urgency ON missing_items(urgency);
CREATE INDEX IF NOT EXISTS idx_sync_log_table ON sync_log(table_name, record_id);

-- ============================================
-- Admin por defecto (password: admin123)
-- Hash bcrypt de 'admin123'
-- ============================================
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$8K1p/I0VZ5YO7sGTfGqVgOCQZqR9fKqKzMq9FJ5c6EKjY1Af6FWXK', 'admin')
ON CONFLICT (username) DO NOTHING;
