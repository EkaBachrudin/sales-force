-- Migration: 005_seed_blocks
-- Description: Seed initial blocks for each property
-- Created: 2026-07-12
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Blocks
-- Purpose: Create blocks for each property cluster
-- Mapping:
-- - Cluster Harmony → 3 blocks (Blok A, Blok B, Blok C)
-- - Green Valley → 2 blocks (Blok A, Blok B)
-- - Grand Orchid → 2 blocks (Blok D, Blok E)
-- - Skyline Residences → 3 blocks (Lantai 1-15, Lantai 16-30, Lantai 31-45)
-- - Business Park → 2 blocks (Blok A, Blok B)
-- - Townhouse Collection → 2 blocks (Menteng, Kemang)
-- - Mutiara Residence → 2 blocks (Blok Sapphire, Blok Ruby)
-- - The Peak Villa → 2 blocks (Area Pine, Area Oak)
-- ============================================================================

-- ============================================================================
-- 1. Cluster Harmony - 3 Blocks
-- ============================================================================
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Cluster Harmony'), 'Blok A', true),
    ((SELECT id FROM properties WHERE name = 'Cluster Harmony'), 'Blok B', true),
    ((SELECT id FROM properties WHERE name = 'Cluster Harmony'), 'Blok C', true);

-- ============================================================================
-- 2. Green Valley - 2 Blocks
-- ============================================================================
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Green Valley'), 'Blok A', true),
    ((SELECT id FROM properties WHERE name = 'Green Valley'), 'Blok B', true);

-- ============================================================================
-- 3. Grand Orchid - 2 Blocks
-- ============================================================================
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Grand Orchid'), 'Blok D', true),
    ((SELECT id FROM properties WHERE name = 'Grand Orchid'), 'Blok E', true);

-- ============================================================================
-- 4. Skyline Residences - 3 Blocks (by floor range)
-- ============================================================================
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Skyline Residences'), 'Lantai 1-15', true),
    ((SELECT id FROM properties WHERE name = 'Skyline Residences'), 'Lantai 16-30', true),
    ((SELECT id FROM properties WHERE name = 'Skyline Residences'), 'Lantai 31-45', true);

-- ============================================================================
-- 5. Business Park - 2 Blocks
-- ============================================================================
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Business Park'), 'Blok A', true),
    ((SELECT id FROM properties WHERE name = 'Business Park'), 'Blok B', true);

-- ============================================================================
-- 6. Townhouse Collection - 2 Blocks
-- ============================================================================
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Townhouse Collection'), 'Menteng', true),
    ((SELECT id FROM properties WHERE name = 'Townhouse Collection'), 'Kemang', true);


-- ============================================================================
-- B. SEED BLOCKS
-- ============================================================================

-- 1. Blocks untuk Mutiara Residence (Sales 2) - 2 Blok
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Mutiara Residence'), 'Blok Sapphire', true),
    ((SELECT id FROM properties WHERE name = 'Mutiara Residence'), 'Blok Ruby', true);

-- 2. Blocks untuk The Peak Villa (Sales 3) - 2 Blok
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'The Peak Villa'), 'Area Pine', true),
    ((SELECT id FROM properties WHERE name = 'The Peak Villa'), 'Area Oak', true);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT p.name as property, b.name as block 
-- FROM blocks b JOIN properties p ON b.property_id = p.id 
-- ORDER BY p.name, b.name;