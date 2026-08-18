-- Migration: 004_seed_leads
-- Description: Seed initial leads for development/testing
-- Created: 2026-07-02
-- Database: PostgreSQL 15+

-- ============================================================================
-- Seed Leads
-- Purpose: Create sample leads assigned to actual users and properties
-- Note: Uses dynamic data from users and properties tables
-- ============================================================================

-- ============================================================================
-- 1. Generate 300 Leads with Random Data
-- assigned_to: Randomly picked from actual users (hanya admin di kasus ini)
-- unit_id: Randomly picked from actual available units
-- ============================================================================

INSERT INTO leads (
    assigned_to, unit_id, name, nik, npwp, phone, email, source, 
    budget_range, property_price, down_payment, down_payment_percentage, 
    interest_rate, loan_term_years, estimated_monthly_payment, status, 
    notes, last_followed_up_at, next_follow_up_at, created_at, updated_at
)
SELECT 
    -- assigned_to: Ambil random dari users (hanya admin di kasus ini)
    (SELECT id FROM users 
     WHERE role_id IN (SELECT id FROM roles WHERE name IN ('Admin'))
     ORDER BY random() 
     LIMIT 1),
     
    -- unit_id: Ambil random dari units yang available
    (SELECT id FROM units 
     WHERE status = 'available' 
     ORDER BY random() 
     LIMIT 1),
     
    'Lead Customer ' || i,
    
    -- Generator NIK (16 digit) - aman dari scientific notation
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 16)),
    
    -- Generator NPWP (15 digit) - aman dari scientific notation
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 15)),
    
    -- Phone number
    '08' || LPAD(floor(random() * 9000000000 + 1000000000)::TEXT, 10, '0'),
    
    -- Email
    'lead_user_' || i || '@example.com',
    
    -- Source
    (ARRAY['Visit', 'Instagram', 'Website', 'Facebook Ads', 'Agent Referral', 'TikTok', 'WhatsApp', 'OLX'])[floor(random() * 8 + 1)],
    
    -- Budget Range (JSONB)
    jsonb_build_object(
        'min', 500000000, 
        'max', 2000000000
    ),
    
    -- Property Price
    (500000000 + (floor(random() * 200) * 10000000))::NUMERIC(15,2),
    
    -- Down Payment (will be calculated)
    0, 
    
    -- Down Payment Percentage
    (10 + floor(random() * 21))::NUMERIC(5,2),
    
    -- Interest Rate (5% - 9%)
    (5.0 + (floor(random() * 9) * 0.5))::NUMERIC(5,2),
    
    -- Loan Term Years - HANYA 5, 10, 15, 20, 25 (sesuai constraint)
    (ARRAY[5, 10, 15, 20, 25])[floor(random() * 5 + 1)],
    
    -- Estimated Monthly Payment (will be calculated)
    0,
    
    -- Status
    (ARRAY['new', 'new', 'new', 'contacted', 'contacted', 'surveyed', 'surveyed', 'negotiating', 'booked', 'closed', 'cancelled'])[floor(random() * 11 + 1)],
    
    -- Notes (varied)
    (ARRAY[
        'Tertarik dengan tipe unit cluster baru. Perlu follow up segera via WhatsApp.',
        'Sudah melakukan survey lokasi. Membandingkan dengan developer lain.',
        'Meminta informasi lebih lanjut mengenai skema pembayaran KPR.',
        'Bertanya mengenai promo cashback dan bonus furniture.',
        'Sedang menjual rumah lama, estimasi 2 bulan lagi bisa proses.',
        'Suka dengan lokasi, tapi budget masih kurang. Cari unit yang lebih kecil.',
        'Ingin tahu mengenai proses KPR melalui bank partner.',
        'Sudah fill form di website, menunggu callback.',
        'Datang ke marketing gallery bersama keluarga.',
        'Referred by existing customer. High potential.',
        'Cocok dengan tipe 2 lantai. Minta penawaran harga terbaik.',
        'Butuh waktu pertimbangan bersama pasangan.',
        'Tertarik untuk investasi, tanya mengenai potensi capital gain.',
        'Booking fee sudah siap, tunggu persetujuan dari istri.',
        'Komunikasi aktif via email, prefer bahasa Inggris.'
    ])[floor(random() * 15 + 1)],
    
    -- Last Followed Up At (beberapa hari sebelum created_at)
    CASE 
        WHEN random() > 0.4 THEN waktu_acak - (random() * 30 || ' days')::INTERVAL 
        ELSE NULL 
    END,
    
    -- Next Follow Up At (beberapa hari setelah created_at)
    CASE 
        WHEN random() > 0.5 THEN waktu_acak + (random() * 14 || ' days')::INTERVAL 
        ELSE NULL 
    END,
    
    -- Created At
    waktu_acak,
    
    -- Updated At
    waktu_acak + (random() * 2 || ' hours')::INTERVAL
FROM (
    SELECT i, 
           -- DYNAMAIC: 2 years
           (CURRENT_TIMESTAMP - INTERVAL '2 years') + random() * INTERVAL '2 years' AS waktu_acak
    FROM generate_series(1, 300) s(i)
) sub;

-- ============================================================================
-- 2. Update Down Payment and Monthly Payment Calculations
-- ============================================================================
UPDATE leads SET 
    down_payment = ROUND((property_price * down_payment_percentage) / 100, 2),
    estimated_monthly_payment = ROUND(
        CASE 
            WHEN loan_term_years > 0 AND interest_rate > 0 AND property_price > 0 
            THEN (
                (property_price - (property_price * down_payment_percentage / 100)) * 
                (interest_rate / 100 / 12) * 
                POWER(1 + (interest_rate / 100 / 12), loan_term_years * 12) / 
                (POWER(1 + (interest_rate / 100 / 12), loan_term_years * 12) - 1)
            )
            ELSE 0 
        END, 
    2
);

-- ============================================================================
-- 3. Create Some Specific Leads for Testing Edge Cases
-- ============================================================================

-- Lead dengan status 'new' tanpa follow up
INSERT INTO leads (
    assigned_to, unit_id, name, nik, npwp, phone, email, source, 
    budget_range, property_price, down_payment, down_payment_percentage, 
    interest_rate, loan_term_years, estimated_monthly_payment, status, 
    notes, last_followed_up_at, next_follow_up_at, created_at, updated_at
)
SELECT 
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    (SELECT id FROM units WHERE status = 'available' LIMIT 1),
    'Ahmad Fauzi',
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 16)),
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 15)),
    '081234567890',
    'ahmad.fauzi@email.com',
    'Website',
    jsonb_build_object('min', 800000000, 'max', 1200000000),
    950000000.00,
    190000000.00,
    20.00,
    7.00,
    20,
    6175000.00,
    'new',
    'Baru submit form di website. Belum ada kontak.',
    NULL,
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM leads WHERE name = 'Ahmad Fauzi'
);

-- Lead dengan status 'closed' (berhasil closing)
INSERT INTO leads (
    assigned_to, unit_id, name, nik, npwp, phone, email, source, 
    budget_range, property_price, down_payment, down_payment_percentage, 
    interest_rate, loan_term_years, estimated_monthly_payment, status, 
    notes, last_followed_up_at, next_follow_up_at, created_at, updated_at
)
SELECT 
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    (SELECT id FROM units WHERE status = 'available' LIMIT 1),
    'Siti Rahayu',
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 16)),
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 15)),
    '082345678901',
    'siti.rahayu@email.com',
    'Agent Referral',
    jsonb_build_object('min', 1000000000, 'max', 2000000000),
    1500000000.00,
    300000000.00,
    20.00,
    6.50,
    25,
    8400000.00,
    'closed',
    'Berhasil closing! Booking fee sudah dibayar. KPR sedang diproses di Bank BCA.',
    NOW() - INTERVAL '5 days',
    NULL,
    NOW() - INTERVAL '30 days',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM leads WHERE name = 'Siti Rahayu'
);

-- Lead dengan status 'cancelled'
INSERT INTO leads (
    assigned_to, unit_id, name, nik, npwp, phone, email, source, 
    budget_range, property_price, down_payment, down_payment_percentage, 
    interest_rate, loan_term_years, estimated_monthly_payment, status, 
    notes, last_followed_up_at, next_follow_up_at, created_at, updated_at
)
SELECT 
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    (SELECT id FROM units WHERE status = 'available' LIMIT 1),
    'Budi Santoso',
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 16)),
    (SELECT string_agg(floor(random() * 10)::text, '') FROM generate_series(1, 15)),
    '083456789012',
    'budi.santoso@email.com',
    'Facebook Ads',
    jsonb_build_object('min', 500000000, 'max', 800000000),
    700000000.00,
    0,
    15.00,
    7.50,
    15,
    0,
    'cancelled',
    'Cancel karena membeli di developer lain. Harga lebih murah.',
    NOW() - INTERVAL '10 days',
    NULL,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (
    SELECT 1 FROM leads WHERE name = 'Budi Santoso'
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Status distribution
-- SELECT status, COUNT(*) as total FROM leads GROUP BY status ORDER BY status;

-- Leads per assigned user
-- SELECT u.email, COUNT(l.id) as total_leads 
-- FROM leads l JOIN users u ON l.assigned_to = u.id 
-- GROUP BY u.email ORDER BY total_leads DESC;

-- Leads per unit
-- SELECT u.name, COUNT(l.id) as total_leads 
-- FROM leads l JOIN units u ON l.unit_id = u.id 
-- GROUP BY u.name ORDER BY total_leads DESC;

-- Source distribution
-- SELECT source, COUNT(*) as total FROM leads GROUP BY source ORDER BY total DESC;