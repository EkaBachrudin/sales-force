-- Migration: 002_seed_users
-- Description: Seed initial users for development/testing
-- Created: 2025-01-28
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Users with Roles
-- Purpose: Create initial users for testing (Admin, Supervisor, Sales)
-- Note: Passwords are hashed with bcrypt (10 rounds)
-- Default passwords: Admin123, Supervisor123, Sales123
-- ============================================================================

-- ============================================================================
-- 1. Admin User
-- Email: admin@example.com
-- Password: Admin123
-- ============================================================================
INSERT INTO users (full_name, email, phone, password_hash, role_id, is_active)
VALUES (
    'Admin User',
    'admin@example.com',
    '6281234567800',
    '$2y$10$950mf1eiKTv9Kd7dGiryYOBG6n/NXI8qaL7tSnaP109egLTywlEk6',
    (SELECT id FROM roles WHERE name = 'Admin'),
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. Supervisor User
-- Email: supervisor@example.com
-- Password: Supervisor123
-- ============================================================================
INSERT INTO users (full_name, email, phone, password_hash, role_id, is_active)
VALUES (
    'Supervisor User',
    'supervisor@example.com',
    '6281234567801',
    '$2y$10$tFCwPi3MZHiJSVe9plLVreipbPlkClvqVY5N7Yfl9HPgFo3QXSOC.',
    (SELECT id FROM roles WHERE name = 'Supervisor'),
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 3. Sales User
-- Email: sales@example.com
-- Password: Sales123
-- ============================================================================
INSERT INTO users (full_name, email, phone, password_hash, role_id, is_active)
VALUES (
    'Sales User',
    'sales@example.com',
    '6281234567802',
    '$2y$10$ZCwS77uLY1bonQvoeP9unebzCZU.NQg56H//JTw5PGszWsf2vr8Qi',
    (SELECT id FROM roles WHERE name = 'Sales'),
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 4. Sales User 2
-- Email: sales2@example.com
-- Password: Sales123
-- ============================================================================
INSERT INTO users (full_name, email, phone, password_hash, role_id, is_active)
VALUES (
    'Sales User 2',
    'sales2@example.com',
    '6281234567803',
    '$2y$10$ZCwS77uLY1bonQvoeP9unebzCZU.NQg56H//JTw5PGszWsf2vr8Qi',
    (SELECT id FROM roles WHERE name = 'Sales'),
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 5. Sales User 3
-- Email: sales3@example.com
-- Password: Sales123
-- ============================================================================
INSERT INTO users (full_name, email, phone, password_hash, role_id, is_active)
VALUES (
    'Sales User 3',
    'sales3@example.com',
    '6281234567804',
    '$2y$10$ZCwS77uLY1bonQvoeP9unebzCZU.NQg56H//JTw5PGszWsf2vr8Qi',
    (SELECT id FROM roles WHERE name = 'Sales'),
    true
) ON CONFLICT (email) DO NOTHING;
