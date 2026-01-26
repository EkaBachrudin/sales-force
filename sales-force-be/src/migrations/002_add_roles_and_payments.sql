-- Migration: 002_add_roles_and_payments
-- Description: Add roles table for role management and payments table for subscription management
-- Created: 2025-01-26
-- Database: PostgreSQL 15+

-- ============================================================================
-- Table: roles
-- Purpose: Role management for users (sales, admin, supervisor, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Modify users table: Add role_id column
-- Purpose: Link users to roles
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- ============================================================================
-- Table: payments
-- Purpose: Payment & subscription management for users
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('subscription', 'one_time', 'commission', 'bonus')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50) CHECK (payment_method IN ('bank_transfer', 'credit_card', 'e_wallet', 'cash', 'other')),
    transaction_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_period CHECK (period_end IS NULL OR period_start IS NULL OR period_end > period_start)
);

-- ============================================================================
-- Insert Default Roles
-- Purpose: Seed initial roles for the system
-- ============================================================================
INSERT INTO roles (name, description, permissions) VALUES
    ('Admin', 'Full system access', '{"manage_users": true, "manage_roles": true, "manage_properties": true, "view_all_leads": true, "manage_payments": true}'),
    ('Supervisor', 'Can manage team and view all leads', '{"manage_users": false, "manage_roles": false, "manage_properties": true, "view_all_leads": true, "manage_payments": false}'),
    ('Sales', 'Can manage assigned leads and properties', '{"manage_users": false, "manage_roles": false, "manage_properties": true, "view_all_leads": false, "manage_payments": false}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Update existing users to have default 'Sales' role
-- Purpose: Backfill role_id for existing users
-- ============================================================================
DO $$
BEGIN
    UPDATE users
    SET role_id = (SELECT id FROM roles WHERE name = 'Sales' LIMIT 1)
    WHERE role_id IS NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating users with default role: %', SQLERRM;
END $$;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Roles Indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Users Indexes (for role_id)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_period ON payments(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
