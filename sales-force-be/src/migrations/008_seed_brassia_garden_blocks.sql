-- Migration: 008_seed_brassia_garden_blocks
-- Description: Seed blocks for Brassia Garden property
-- Created: 2026-07-22
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Blocks for Brassia Garden
-- Purpose: Create 4 blocks (A, B, C, D) for Brassia Garden property
-- ============================================================================

-- ============================================================================
-- Brassia Garden - 4 Blocks
-- Total units distribution:
-- - Blok A: 15 units (84 m² each)
-- - Blok B: 10 units (84-128 m²)
-- - Blok C: 16 units (84-125 m²)
-- - Blok D: 11 units (82-133 m²)
-- ============================================================================
INSERT INTO blocks (property_id, name, is_active)
VALUES
    ((SELECT id FROM properties WHERE name = 'Brassia Garden'), 'Blok A', true),
    ((SELECT id FROM properties WHERE name = 'Brassia Garden'), 'Blok B', true),
    ((SELECT id FROM properties WHERE name = 'Brassia Garden'), 'Blok C', true),
    ((SELECT id FROM properties WHERE name = 'Brassia Garden'), 'Blok D', true);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT p.name as property, b.name as block 
-- FROM blocks b JOIN properties p ON b.property_id = p.id 
-- WHERE p.name = 'Brassia Garden'
-- ORDER BY b.name;