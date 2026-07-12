-- Migration: 001_schema
-- Description: Combined initial schema with roles and subscriptions
-- Created: 2026-06-28
-- Database: PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- Table: users
-- Purpose: Menyimpan data sales/agent yang menggunakan sistem
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ============================================================================
-- Table: user_sessions
-- Purpose: Menyimpan sesi aktif user untuk refresh token & session management
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: revoked_tokens
-- Purpose: Blacklist JWT yang di-revoke sebelum expiry
-- ============================================================================
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jti VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- Table: properties
-- Purpose: Menyimpan data properti utama/cluster yang bisa ditawarkan oleh sales
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    land_area NUMERIC(10, 2),
    address TEXT,
    description TEXT,
    siteplan_assets VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: blocks
-- Purpose: Menyimpan data blok/cluster dalam sebuah properti
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_block_name_per_property UNIQUE (property_id, name)
);

-- ============================================================================
-- Table: units
-- Purpose: Menyimpan data unit spesifik yang dijual
-- ============================================================================
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    land_area NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked', 'sold')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_unit_name_per_block UNIQUE (block_id, name)
);

-- ============================================================================
-- Table: leads
-- Purpose: Menyimpan data calon pembeli (leads) dari berbagai sumber
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    nik VARCHAR(16) CHECK (nik ~ '^[0-9]{16}$' OR nik IS NULL),
    npwp VARCHAR(20) CHECK (npwp ~ '^[0-9]{15,20}$' OR npwp IS NULL),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    source VARCHAR(50) DEFAULT 'Visit',
    budget_range JSONB,
    property_price NUMERIC(15, 2),
    down_payment NUMERIC(15, 2),
    down_payment_percentage NUMERIC(5, 2) CHECK (down_payment_percentage >= 1 AND down_payment_percentage <= 100),
    interest_rate NUMERIC(5, 2) DEFAULT 5.5 CHECK (interest_rate > 0),
    loan_term_years INTEGER DEFAULT 15 CHECK (loan_term_years IN (5, 10, 15, 20, 25)),
    estimated_monthly_payment NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'surveyed', 'negotiating', 'booked', 'closed', 'cancelled')),
    notes TEXT,
    last_followed_up_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_phone CHECK (phone ~ '^[0-9]{10,20}$')
);

-- ============================================================================
-- Table: lead_activities
-- Purpose: Audit Trail & History untuk lead activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('status_change', 'note_added', 'call', 'whatsapp')),
    old_status VARCHAR(50) CHECK (old_status IN ('new', 'contacted', 'surveyed', 'negotiating', 'booked', 'closed', 'cancelled')),
    new_status VARCHAR(50) CHECK (new_status IN ('new', 'contacted', 'surveyed', 'negotiating', 'booked', 'closed', 'cancelled')),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: whatsapp_messages
-- Purpose: Menyimpan log pesan WhatsApp
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    message_text TEXT NOT NULL,
    message_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: reminder_schedules
-- Purpose: Menyimpan jadwal follow-up reminder
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminder_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    message TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- Insert Default Roles
-- Purpose: Seed initial roles for the system
-- ============================================================================
INSERT INTO roles (name, description, permissions) VALUES
    ('Admin', 'Full system access', '{"access": ["dashboard", "leads", "analytics", "properties", "settings", "users", "subscriptions"]}'),
    ('Supervisor', 'Can manage team and view all leads', '{"access": ["dashboard", "leads", "analytics", "properties", "settings", "users"]}'),
    ('Sales', 'Can manage assigned leads and properties', '{"access": ["dashboard", "leads", "analytics", "properties", "settings"]}')
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
-- Table: subscriptions
-- Purpose: Subscription management for users
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50) NOT NULL CHECK (subscription_type IN ('monthly', 'quarterly', 'annual')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'overdue', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_period CHECK (period_end IS NULL OR period_start IS NULL OR period_end > period_start)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- User Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Revoked Tokens Indexes
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti ON revoked_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);

-- Properties Indexes
CREATE INDEX IF NOT EXISTS idx_properties_assigned_to ON properties(assigned_to);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- Blocks Indexes
CREATE INDEX IF NOT EXISTS idx_blocks_property_id ON blocks(property_id);
CREATE INDEX IF NOT EXISTS idx_blocks_is_active ON blocks(is_active);

-- Units Indexes
CREATE INDEX IF NOT EXISTS idx_units_block_id ON units(block_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_is_active ON units(is_active);

-- Leads Indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_unit_id ON leads(unit_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_nik ON leads(nik);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- Lead Activities Indexes
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);

-- WhatsApp Messages Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Reminder Schedules Indexes
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_user_id ON reminder_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_lead_id ON reminder_schedules(lead_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_remind_at ON reminder_schedules(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_is_completed ON reminder_schedules(is_completed);

-- Roles Indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Subscriptions Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_type ON subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_due_date ON subscriptions(due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);

-- ============================================================================
-- Database Triggers for Auto-update Unit Status
-- Purpose: Automatically update unit.status based on lead.status
-- ============================================================================

-- Function to update unit status when lead status changes
CREATE OR REPLACE FUNCTION update_unit_status_from_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if unit_id is set
    IF NEW.unit_id IS NOT NULL THEN
        -- If lead is deleted or unit_id is NULL, set unit to available
        IF TG_OP = 'DELETE' THEN
            UPDATE units 
            SET status = 'available'
            WHERE id = OLD.unit_id;
        
        -- If lead is inserted or updated
        ELSE
            CASE NEW.status
                -- Active leads: set unit to reserved
                WHEN 'new', 'contacted', 'surveyed', 'negotiating' THEN
                    UPDATE units 
                    SET status = 'reserved'
                    WHERE id = NEW.unit_id;
                
                -- Booked lead: set unit to booked
                WHEN 'booked' THEN
                    UPDATE units 
                    SET status = 'booked'
                    WHERE id = NEW.unit_id;
                
                -- Closed lead: set unit to sold
                WHEN 'closed' THEN
                    UPDATE units 
                    SET status = 'sold'
                    WHERE id = NEW.unit_id;
                
                -- Cancelled lead: set unit back to available
                WHEN 'cancelled' THEN
                    UPDATE units 
                    SET status = 'available'
                    WHERE id = NEW.unit_id;
            END CASE;
        END IF;
    END IF;
    
    -- Handle unit_id change
    IF TG_OP = 'UPDATE' AND OLD.unit_id IS DISTINCT FROM NEW.unit_id THEN
        -- If unit_id changed, set old unit to available
        IF OLD.unit_id IS NOT NULL THEN
            UPDATE units 
            SET status = 'available'
            WHERE id = OLD.unit_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on leads table
DROP TRIGGER IF EXISTS trg_lead_status_change ON leads;
CREATE TRIGGER trg_lead_status_change
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW EXECUTE FUNCTION update_unit_status_from_lead();