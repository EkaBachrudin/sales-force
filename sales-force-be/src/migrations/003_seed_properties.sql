-- Migration: 003_seed_properties
-- Description: Seed initial properties for development/testing
-- Created: 2026-07-02
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Properties
-- Purpose: Create sample properties for testing
-- Note: Properties are assigned to existing users in database
-- ============================================================================

-- ============================================================================
-- 1. Residential - Cluster Harmony (Tangerang)
-- ============================================================================

INSERT INTO properties (assigned_to, name, property_type, address, city, province, price, land_area, building_area, bedrooms, bathrooms, car_ports, certificate, description, status)
VALUES 
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Cluster Harmony Tipe 45/72',
    'Rumah',
    'Jl. Cluster Harmony Blok A No. 1, Bumi Serpong Damai',
    'Tangerang Selatan',
    'Banten',
    850000000.00,
    72.00,
    45.00,
    2,
    1,
    1,
    'HGB',
    'Rumah minimalis modern di cluster eksklusif dengan keamanan 24 jam, clubhouse, dan taman bermain anak. Lokasi strategis dekat dengan BSD City.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Cluster Harmony Tipe 60/90',
    'Rumah',
    'Jl. Cluster Harmony Blok B No. 5, Bumi Serpong Damai',
    'Tangerang Selatan',
    'Banten',
    1250000000.00,
    90.00,
    60.00,
    3,
    2,
    1,
    'HGB',
    'Rumah 2 lantai dengan desain modern tropis. Dilengkapi carport, taman depan dan belakang. Akses mudah ke tol JORR 2.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Cluster Harmony Tipe 80/120',
    'Rumah',
    'Jl. Cluster Harmony Blok C No. 10, Bumi Serpong Damai',
    'Tangerang Selatan',
    'Banten',
    1850000000.00,
    120.00,
    80.00,
    3,
    2,
    2,
    'SHM',
    'Rumah premium 2 lantai dengan rooftop garden. Semi furnished, smart home system, dan private pool option.',
    'available'
),

-- ============================================================================
-- 2. Residential - Green Valley (Depok)
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Green Valley Tipe 36/60',
    'Rumah',
    'Jl. Green Valley No. 15, Margonda',
    'Depok',
    'Jawa Barat',
    550000000.00,
    60.00,
    36.00,
    2,
    1,
    1,
    'HGB',
    'Rumah starter family dengan harga terjangkau. Dekat dengan stasiun KRL dan pusat perbelanjaan.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Green Valley Tipe 54/84',
    'Rumah',
    'Jl. Green Valley No. 22, Margonda',
    'Depok',
    'Jawa Barat',
    780000000.00,
    84.00,
    54.00,
    2,
    1,
    1,
    'HGB',
    'Rumah modern dengan taman luas. Ideal untuk keluarga kecil yang menginginkan lingkungan asri.',
    'available'
),

-- ============================================================================
-- 3. Residential - Grand Orchid (Bekasi)
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Grand Orchid Tipe 50/78',
    'Rumah',
    'Jl. Grand Orchid Raya Blok D No. 3, Jatiwaringin',
    'Bekasi',
    'Jawa Barat',
    920000000.00,
    78.00,
    50.00,
    2,
    1,
    1,
    'HGB',
    'Rumah di kawasan berkembang pesat. Dekat dengan akses tol Jakarta-Cikampek dan LRT.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Grand Orchid Tipe 70/110',
    'Rumah',
    'Jl. Grand Orchid Raya Blok E No. 8, Jatiwaringin',
    'Bekasi',
    'Jawa Barat',
    1450000000.00,
    110.00,
    70.00,
    3,
    2,
    2,
    'SHM',
    'Rumah mewah 2 lantai dengan desain kontemporer. Fully furnished kitchen set dan AC di setiap ruangan.',
    'available'
),

-- ============================================================================
-- 4. Apartment - Skyline Residences (Jakarta)
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Skyline Residences Studio Unit',
    'Apartemen',
    'Jl. Sudirman No. 100, Lantai 25 Unit 2501',
    'Jakarta Selatan',
    'DKI Jakarta',
    650000000.00,
    NULL,
    24.00,
    NULL,
    1,
    NULL,
    'Lainnya',
    'Studio apartment dengan pemandangan kota yang memukau. Fully furnished dengan interior modern minimalis.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Skyline Residences 2BR Unit',
    'Apartemen',
    'Jl. Sudirman No. 100, Lantai 30 Unit 3005',
    'Jakarta Selatan',
    'DKI Jakarta',
    1250000000.00,
    NULL,
    48.00,
    2,
    1,
    NULL,
    'Lainnya',
    'Apartemen 2 kamar dengan balkon luas. Semi furnished, include kitchen set dan AC.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Skyline Residences 3BR Penthouse',
    'Apartemen',
    'Jl. Sudirman No. 100, Lantai 45 Unit 4501',
    'Jakarta Selatan',
    'DKI Jakarta',
    3500000000.00,
    NULL,
    95.00,
    3,
    2,
    NULL,
    'Lainnya',
    'Penthouse eksklusif dengan private lift access, rooftop garden, dan infinity pool view.',
    'available'
),

-- ============================================================================
-- 5. Ruko - Business Park (Tangerang)
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Business Park Ruko 3 Lantai A1',
    'Ruko',
    'Jl. Business Park Raya Blok A No. 1, Gading Serpong',
    'Tangerang',
    'Banten',
    2800000000.00,
    60.00,
    180.00,
    NULL,
    3,
    2,
    'HGB',
    'Ruko strategis 3 lantai di kawasan bisnis premium. Cocok untuk kantor, retail, atau F&B.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Business Park Ruko 2 Lantai B5',
    'Ruko',
    'Jl. Business Park Raya Blok B No. 5, Gading Serpong',
    'Tangerang',
    'Banten',
    1900000000.00,
    50.00,
    100.00,
    NULL,
    2,
    1,
    'HGB',
    'Ruko 2 lantai dengan lokasi di pinggir jalan utama. Traffic tinggi, cocok untuk usaha.',
    'available'
),

-- ============================================================================
-- 6. Tanah - Investment Plots
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Kavling Investasi Jonggol 200m2',
    'Tanah',
    'Jl. Raya Jonggol KM 25, Desa Singasari',
    'Bogor',
    'Jawa Barat',
    350000000.00,
    200.00,
    NULL,
    NULL,
    NULL,
    NULL,
    'SHM',
    'Tanah kavling strategis dekat rencana akses tol Jonggol. Potensi kenaikan harga tinggi.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Kavling Premium Cisauk 150m2',
    'Tanah',
    'Jl. Cisauk Raya, Kec. Cisauk',
    'Tangerang Selatan',
    'Banten',
    1200000000.00,
    150.00,
    NULL,
    NULL,
    NULL,
    NULL,
    'SHM',
    'Kavling premium di kawasan yang sedang berkembang. Dekat dengan stasiun dan kampus.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Lahan Komersial Cikarang 500m2',
    'Tanah',
    'Jl. Industri Cikarang Barat, Desa Sukaresmi',
    'Bekasi',
    'Jawa Barat',
    4500000000.00,
    500.00,
    NULL,
    NULL,
    NULL,
    NULL,
    'SHM',
    'Lahan komersial cocok untuk gudang atau pabrik. Akses langsung ke jalan utama dan dekat gerbang tol.',
    'available'
),

-- ============================================================================
-- 7. Rumah Townhouse (Jakarta)
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Townhouse Menteng Residence',
    'Rumah',
    'Jl. Menteng Raya No. 55, Menteng',
    'Jakarta Pusat',
    'DKI Jakarta',
    8500000000.00,
    200.00,
    350.00,
    4,
    4,
    2,
    'SHM',
    'Townhouse eksklusif di jantung kota Jakarta. Fully furnished dengan material premium. Private garden dan security 24 jam.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Townhouse Kemang Signature',
    'Rumah',
    'Jl. Kemang Raya No. 88, Kemang',
    'Jakarta Selatan',
    'DKI Jakarta',
    6200000000.00,
    150.00,
    280.00,
    3,
    3,
    2,
    'SHM',
    'Townhouse modern di kawasan Kemang yang trendy. Ideal untuk expat atau keluarga modern.',
    'available'
),

-- ============================================================================
-- 8. Additional Properties for Variety
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Rumah Villa Puncak 2 Lantai',
    'Rumah',
    'Jl. Raya Puncak KM 75, Cisarua',
    'Bogor',
    'Jawa Barat',
    2200000000.00,
    300.00,
    150.00,
    3,
    2,
    2,
    'SHM',
    'Villa cantik dengan view pegunungan. Cocok untuk tempat tinggal atau disewakan untuk wisata.',
    'available'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Apartemen Sudirman Park 1BR',
    'Apartemen',
    'Jl. Jend. Sudirman Kav. 25-26, Lantai 18 Unit 1803',
    'Jakarta Pusat',
    'DKI Jakarta',
    980000000.00,
    NULL,
    33.00,
    1,
    1,
    NULL,
    'Lainnya',
    'Unit bagus dengan city view. Fully furnished, siap huni. Dekat dengan MRT Dukuh Atas.',
    'available'
),

-- ============================================================================
-- 9. Some Sold/Reserved Properties for Realistic Data
-- ============================================================================
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Cluster Harmony Tipe 45/72 - SOLD',
    'Rumah',
    'Jl. Cluster Harmony Blok A No. 2, Bumi Serpong Damai',
    'Tangerang Selatan',
    'Banten',
    870000000.00,
    72.00,
    45.00,
    2,
    1,
    1,
    'HGB',
    'Rumah minimalis modern - sudah terjual.',
    'sold'
),
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Skyline Residences Studio - RESERVED',
    'Apartemen',
    'Jl. Sudirman No. 100, Lantai 22 Unit 2203',
    'Jakarta Selatan',
    'DKI Jakarta',
    680000000.00,
    NULL,
    26.00,
    NULL,
    1,
    NULL,
    'Lainnya',
    'Studio apartment - sedang dalam proses reservasi.',
    'reserved'
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT property_type, COUNT(*) as total, 
--        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
--        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
--        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved
-- FROM properties GROUP BY property_type ORDER BY property_type;