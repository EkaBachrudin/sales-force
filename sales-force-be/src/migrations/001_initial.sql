-- Migration: 001_initial
-- Description: Create initial schema for Sales Force Automation System
-- Created: 2025-01-15
-- Database: PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- Purpose: Menyimpan data properti yang bisa ditawarkan oleh sales
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    price NUMERIC(15, 2),
    land_area NUMERIC(10, 2),
    building_area NUMERIC(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    car_ports INTEGER,
    certificate VARCHAR(50) CHECK (certificate IN ('SHM', 'HGB', 'Lainnya')),
    description TEXT,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: leads
-- Purpose: Menyimpan data calon pembeli (leads) dari berbagai sumber
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    nik VARCHAR(16) CHECK (nik ~ '^[0-9]{16}$' OR nik IS NULL),
    npwp VARCHAR(20) CHECK (npwp ~ '^[0-9]{15,20}$' OR npwp IS NULL),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    source VARCHAR(50) DEFAULT 'Visit',
    budget_range JSONB,
    property_price NUMERIC(15, 2),
    down_payment NUMERIC(15, 2),
    down_payment_percentage NUMERIC(5, 2) CHECK (down_payment_percentage >= 10 AND down_payment_percentage <= 50),
    interest_rate NUMERIC(5, 2) DEFAULT 5.5 CHECK (interest_rate > 0),
    loan_term_years INTEGER DEFAULT 15 CHECK (loan_term_years IN (5, 10, 15, 20, 25)),
    estimated_monthly_payment NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'surveyed', 'negotiating', 'closed', 'cancelled')),
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
    old_status VARCHAR(50) CHECK (old_status IN ('new', 'contacted', 'surveyed', 'negotiating', 'closed', 'cancelled')),
    new_status VARCHAR(50) CHECK (new_status IN ('new', 'contacted', 'surveyed', 'negotiating', 'closed', 'cancelled')),
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
-- Indexes for Performance
-- ============================================================================

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

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
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- Leads Indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);
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
