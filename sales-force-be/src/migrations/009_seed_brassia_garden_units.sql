-- Migration: 009_seed_brassia_garden_units
-- Description: Seed units for Brassia Garden property blocks
-- Created: 2026-07-22
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Units for Brassia Garden
-- Purpose: Create individual units for each block with specific land areas
-- Total: 52 units (A: 15, B: 10, C: 16, D: 11)
-- ============================================================================

-- ============================================================================
-- 1. Brassia Garden - Blok A (15 units, 84 m² each)
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
VALUES
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A1', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A2', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A3', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A4', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A5', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A6', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A7', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A8', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A9', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A10', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A11', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A12', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A12a', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A14', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok A' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'A15', 84.00, 'available');

-- ============================================================================
-- 2. Brassia Garden - Blok B (10 units, 84-128 m²)
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
VALUES
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B1', 128.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B2', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B3', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B4', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B5', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B6', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B7', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B8', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B9', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok B' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'B10', 89.00, 'available');

-- ============================================================================
-- 3. Brassia Garden - Blok C (16 units, 84-125 m²)
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
VALUES
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C1', 111.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C2', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C3', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C4', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C5', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C6', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C7', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C8', 100.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C9', 125.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C10', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C11', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C12', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C12a', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C14', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C15', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok C' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'C16', 100.00, 'available');

-- ============================================================================
-- 4. Brassia Garden - Blok D (11 units, 82-133 m²)
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
VALUES
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D1', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D2', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D3', 84.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D4', 82.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D5', 133.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D6', 85.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D7', 93.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D8', 92.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D9', 89.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D10', 85.00, 'available'),
    ((SELECT id FROM blocks WHERE name = 'Blok D' AND property_id = (SELECT id FROM properties WHERE name = 'Brassia Garden')), 'D11', 100.00, 'available');

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT p.name as property, b.name as block, COUNT(u.id) as total_units,
--        SUM(CASE WHEN u.status = 'available' THEN 1 ELSE 0 END) as available,
--        SUM(CASE WHEN u.status = 'reserved' THEN 1 ELSE 0 END) as reserved,
--        SUM(CASE WHEN u.status = 'booked' THEN 1 ELSE 0 END) as booked,
--        SUM(CASE WHEN u.status = 'sold' THEN 1 ELSE 0 END) as sold
-- FROM units u
-- JOIN blocks b ON u.block_id = b.id
-- JOIN properties p ON b.property_id = p.id
-- WHERE p.name = 'Brassia Garden'
-- GROUP BY p.name, b.name
-- ORDER BY b.name;