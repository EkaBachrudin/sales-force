-- Migration: 006_seed_units
-- Description: Seed initial units for each block
-- Created: 2026-07-12
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Units
-- Purpose: Create individual units for each block with varying status
-- Note: Status will be automatically updated by triggers when leads are assigned
-- ============================================================================

-- ============================================================================
-- 1. Cluster Harmony - Blok A (Tipe 45/72)
-- 10 units with varied land_area
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'A-' || LPAD(i::text, 2, '0'),
    72.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 10) AS i
WHERE b.name = 'Blok A' AND b.property_id = (SELECT id FROM properties WHERE name = 'Cluster Harmony');

-- ============================================================================
-- 2. Cluster Harmony - Blok B (Tipe 60/90)
-- 8 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'B-' || LPAD(i::text, 2, '0'),
    90.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 8) AS i
WHERE b.name = 'Blok B' AND b.property_id = (SELECT id FROM properties WHERE name = 'Cluster Harmony');

-- ============================================================================
-- 3. Cluster Harmony - Blok C (Tipe 80/120)
-- 6 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'C-' || LPAD(i::text, 2, '0'),
    120.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 6) AS i
WHERE b.name = 'Blok C' AND b.property_id = (SELECT id FROM properties WHERE name = 'Cluster Harmony');

-- ============================================================================
-- 4. Green Valley - Blok A (Tipe 36/60)
-- 15 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'GA-' || LPAD(i::text, 2, '0'),
    60.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 15) AS i
WHERE b.name = 'Blok A' AND b.property_id = (SELECT id FROM properties WHERE name = 'Green Valley');

-- ============================================================================
-- 5. Green Valley - Blok B (Tipe 54/84)
-- 10 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'GB-' || LPAD(i::text, 2, '0'),
    84.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 10) AS i
WHERE b.name = 'Blok B' AND b.property_id = (SELECT id FROM properties WHERE name = 'Green Valley');

-- ============================================================================
-- 6. Grand Orchid - Blok D (Tipe 50/78)
-- 12 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'D-' || LPAD(i::text, 2, '0'),
    78.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 12) AS i
WHERE b.name = 'Blok D' AND b.property_id = (SELECT id FROM properties WHERE name = 'Grand Orchid');

-- ============================================================================
-- 7. Grand Orchid - Blok E (Tipe 70/110)
-- 8 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'E-' || LPAD(i::text, 2, '0'),
    110.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 8) AS i
WHERE b.name = 'Blok E' AND b.property_id = (SELECT id FROM properties WHERE name = 'Grand Orchid');

-- ============================================================================
-- 8. Skyline Residences - Lantai 1-15 (Studio)
-- 30 units (2 units per floor)
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'ST-' || LPAD(floor(i/2 + 1)::text, 2, '0') || '-' || CASE WHEN i%2=0 THEN 'A' ELSE 'B' END,
    24.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 30) AS i
WHERE b.name = 'Lantai 1-15' AND b.property_id = (SELECT id FROM properties WHERE name = 'Skyline Residences');

-- ============================================================================
-- 9. Skyline Residences - Lantai 16-30 (2BR)
-- 30 units (2 units per floor)
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    '2BR-' || LPAD(floor(i/2 + 1)::text, 2, '0') || '-' || CASE WHEN i%2=0 THEN 'A' ELSE 'B' END,
    48.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 30) AS i
WHERE b.name = 'Lantai 16-30' AND b.property_id = (SELECT id FROM properties WHERE name = 'Skyline Residences');

-- ============================================================================
-- 10. Skyline Residences - Lantai 31-45 (3BR Penthouse)
-- 10 units (1 unit per floor)
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'PH-' || LPAD(i::text, 2, '0'),
    95.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 10) AS i
WHERE b.name = 'Lantai 31-45' AND b.property_id = (SELECT id FROM properties WHERE name = 'Skyline Residences');

-- ============================================================================
-- 11. Business Park - Blok A (Ruko 3 Lantai)
-- 10 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'A-' || LPAD(i::text, 2, '0'),
    60.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 10) AS i
WHERE b.name = 'Blok A' AND b.property_id = (SELECT id FROM properties WHERE name = 'Business Park');

-- ============================================================================
-- 12. Business Park - Blok B (Ruko 2 Lantai)
-- 10 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'B-' || LPAD(i::text, 2, '0'),
    50.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 10) AS i
WHERE b.name = 'Blok B' AND b.property_id = (SELECT id FROM properties WHERE name = 'Business Park');

-- ============================================================================
-- 13. Townhouse Collection - Menteng (Townhouse)
-- 5 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'M-' || i::text,
    200.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 5) AS i
WHERE b.name = 'Menteng' AND b.property_id = (SELECT id FROM properties WHERE name = 'Townhouse Collection');

-- ============================================================================
-- 14. Townhouse Collection - Kemang (Townhouse)
-- 5 units
-- ============================================================================
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'K-' || i::text,
    150.00,
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 5) AS i
WHERE b.name = 'Kemang' AND b.property_id = (SELECT id FROM properties WHERE name = 'Townhouse Collection');

-- ============================================================================
-- C. SEED UNITS (Jumlah Sedikit)
-- ============================================================================

-- 1. Unit Mutiara Residence - Blok Sapphire (Sales 2) - 5 Unit
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'S-' || LPAD(i::text, 2, '0'),
    60.00, -- Tipe kecil
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 5) AS i
WHERE b.name = 'Blok Sapphire' AND b.property_id = (SELECT id FROM properties WHERE name = 'Mutiara Residence');

-- 2. Unit Mutiara Residence - Blok Ruby (Sales 2) - 4 Unit
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'R-' || LPAD(i::text, 2, '0'),
    72.00, -- Tipe sedang
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 4) AS i
WHERE b.name = 'Blok Ruby' AND b.property_id = (SELECT id FROM properties WHERE name = 'Mutiara Residence');

-- 3. Unit The Peak Villa - Area Pine (Sales 3) - 3 Unit
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'VP-' || LPAD(i::text, 2, '0'),
    250.00, -- Villa besar
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 3) AS i
WHERE b.name = 'Area Pine' AND b.property_id = (SELECT id FROM properties WHERE name = 'The Peak Villa');

-- 4. Unit The Peak Villa - Area Oak (Sales 3) - 3 Unit
INSERT INTO units (block_id, name, land_area, status)
SELECT 
    b.id,
    'VO-' || LPAD(i::text, 2, '0'),
    300.00, -- Villa sangat besar
    'available'
FROM blocks b
CROSS JOIN generate_series(1, 3) AS i
WHERE b.name = 'Area Oak' AND b.property_id = (SELECT id FROM properties WHERE name = 'The Peak Villa');

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
-- GROUP BY p.name, b.name
-- ORDER BY p.name, b.name;