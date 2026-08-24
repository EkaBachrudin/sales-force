-- Migration: 007_seed_brassia_garden_property
-- Description: Seed Brassia Garden property in Bekasi
-- Created: 2026-07-22
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Properties - Brassia Garden (Bekasi)
-- Type: Residential Cluster
-- ============================================================================

-- ============================================================================
-- Brassia Garden (Bekasi)
-- Total Units: 52 units across 4 blocks (A: 15, B: 10, C: 16, D: 11)
-- Total Land Area: 4,564 m² (calculated from individual unit areas)
-- ============================================================================
INSERT INTO properties (assigned_to, name, city, land_area, address, description, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'sales@example.com'),
    'Brassia Garden',
    'Bekasi',
    4564.00,
    'Jl. Brassia Garden Raya, Bekasi',
    'Cluster hunian modern dengan 4 blok (A, B, C, D) dan total 52 unit. Berbagai tipe luas tanah dari 82-133 m². Lokasi strategis di Bekasi dengan akses mudah ke tol dan fasilitas umum.',
    true
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT id, name, city, land_area, is_active FROM properties WHERE name = 'Brassia Garden';