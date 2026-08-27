-- Migration: 003_seed_properties
-- Description: Seed initial properties (clusters) for development/testing
-- Created: 2026-07-12
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Properties (Clusters)
-- Purpose: Create main property clusters
-- Note: Properties represent the overall cluster, individual units are in blocks/units tables
-- ============================================================================

-- ============================================================================
-- 1. Cluster Harmony (Tangerang Selatan)
-- Type: Residential Cluster
-- ============================================================================
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Cluster Harmony',
    'Tangerang Selatan',
    15000.00,
    'Jl. Cluster Harmony, Bumi Serpong Damai',
    'Cluster hunian eksklusif dengan 3 tipe unit (45/72, 60/90, 80/120). Dilengkapi fasilitas clubhouse, kolam renang, dan taman bermain anak. Lokasi strategis dekat BSD City.',
    '/assets/siteplans/cluster-harmony.png',
    true
);

-- ============================================================================
-- 2. Green Valley (Depok)
-- Type: Residential Cluster
-- ============================================================================
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Green Valley',
    'Depok',
    8000.00,
    'Jl. Green Valley, Margonda',
    'Cluster hunian asri dengan 2 tipe unit (36/60, 54/84). Dekat stasiun KRL dan pusat perbelanjaan. Cocok untuk keluarga muda.',
    '/assets/siteplans/green-valley.png',
    true
);

-- ============================================================================
-- 3. Grand Orchid (Bekasi)
-- Type: Residential Cluster
-- ============================================================================
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Grand Orchid',
    'Bekasi',
    12000.00,
    'Jl. Grand Orchid Raya, Jatiwaringin',
    'Cluster hunian modern dengan 2 tipe unit (50/78, 70/110). Akses mudah ke tol Jakarta-Cikampek dan dekat LRT.',
    '/assets/siteplans/grand-orchid.png',
    true
);

-- ============================================================================
-- 4. Skyline Residences (Jakarta Selatan)
-- Type: Apartment Complex
-- ============================================================================
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Skyline Residences',
    'Jakarta Selatan',
    3000.00,
    'Jl. Sudirman No. 100',
    'Apartemen premium dengan 3 tipe unit (Studio, 2BR, 3BR Penthouse). Lokasi strategis di CBD dengan pemandangan kota memukau. Fully furnished.',
    '/assets/siteplans/skyline-residences.png',
    true
);

-- ============================================================================
-- 5. Business Park (Tangerang)
-- Type: Commercial Complex
-- ============================================================================
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Business Park',
    'Tangerang',
    5000.00,
    'Jl. Business Park Raya, Gading Serpong',
    'Kawasan komersial premium dengan ruko 2-3 lantai. Cocok untuk kantor, retail, atau F&B. Traffic tinggi dan akses mudah.',
    '/assets/siteplans/business-park.png',
    true
);

-- ============================================================================
-- 6. Townhouse Collection (Jakarta)
-- Type: Premium Townhouse
-- ============================================================================
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Townhouse Collection',
    'Jakarta',
    4000.00,
    'Jl. Menteng Raya & Jl. Kemang Raya',
    'Kumpulan townhouse premium di lokasi strategis (Menteng & Kemang). Fully furnished dengan material premium. Ideal untuk expat dan keluarga modern.',
    '/assets/siteplans/townhouse-collection.png',
    true
);

-- ============================================================================
-- Seeder Properties untuk Sales 2 dan Sales 3
-- ============================================================================

-- ============================================================================
-- A. SEED PROPERTIES
-- ============================================================================

-- 1. Property untuk Sales 2: Mutiara Residence (Bekasi)
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Mutiara Residence',
    'Bekasi',
    10000.00,
    'Jl. Mutiara Raya, Tambun Selatan',
    'Perumahan minimalis modern khusus untuk keluarga muda. Bebas banjir dan dekat dengan akses tol baru.',
    '/assets/siteplans/mutiara-residence.png',
    true
);

-- 2. Property untuk Sales 3: The Peak Villa (Bogor)
INSERT INTO properties (assigned_to, name, city, land_area, address, description, siteplan_assets, is_active)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'The Peak Villa',
    'Bogor',
    20000.00,
    'Jl. Puncak Pas, Cisarua',
    'Villa eksklusif dengan pemandangan pegunungan. Udara sejuk, cocok untuk rumah peristirahatan akhir pekan.',
    '/assets/siteplans/the-peak-villa.png',
    true
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT id, name, city, land_area, is_active FROM properties ORDER BY name;