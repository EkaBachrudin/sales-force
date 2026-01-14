-- ============================================
-- Initial Database Setup for Sales Force
-- ============================================

-- This script runs automatically when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set default timezone
SET timezone = 'Asia/Jakarta';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Sales Force database initialized successfully';
END $$;
