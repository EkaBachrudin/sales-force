-- ============================================================================
-- Insert 1000 dummy leads dengan data random
-- Tanggal antara minggu ini dan minggu lalu
-- ============================================================================

INSERT INTO leads (
    assigned_to,
    property_id,
    name,
    nik,
    npwp,
    phone,
    email,
    source,
    budget_range,
    property_price,
    down_payment,
    down_payment_percentage,
    interest_rate,
    loan_term_years,
    estimated_monthly_payment,
    status,
    notes,
    last_followed_up_at,
    next_follow_up_at,
    created_at,
    updated_at
)
SELECT
    -- assigned_to: 70% memiliki assigned_to, 30% null
    CASE
        WHEN RANDOM() < 0.7 THEN (SELECT id FROM users ORDER BY RANDOM() LIMIT 1)
        ELSE NULL
    END,
    -- property_id: sesuai request, antara 3 UUID yang diberikan atau null
    CASE
        WHEN RANDOM() < 0.25 THEN '01c85fce-ebb4-46f0-8a7f-d8eaf0beeee1'::UUID
        WHEN RANDOM() < 0.50 THEN '06fd3317-1248-420a-be63-c2ce57ee8533'::UUID
        WHEN RANDOM() < 0.75 THEN 'eeae954a-885c-42d5-9421-6d1a38f64f3d'::UUID
        ELSE NULL
    END,
    -- name: kombinasi nama depan dan belakang Indonesia
    (ARRAY['Budi', 'Ahmad', 'Dewi', 'Siti', 'Agus', 'Rina', 'Eko', 'Maya', 'Rizky', 'Putri',
            'Andi', 'Wulan', 'Dedi', 'Sari', 'Hendra', 'Lestari', 'Fajar', 'Indah', 'Bayu', 'Rina'])[1 + (RANDOM() * 19)::INT] ||
    ' ' ||
    (ARRAY['Santoso', 'Wijaya', 'Putra', 'Putri', 'Kusuma', 'Saputra', 'Hidayat', 'Rahayu',
            'Nugroho', 'Pratama', 'Wibowo', 'Setiawan', 'Gunawan', 'Suryadi', 'Permata',
            'Maulana', 'Rahman', 'Hidayat', 'Firmansyah', 'Utami'])[1 + (RANDOM() * 19)::INT],
    -- nik: 16 digit random (60% null)
    CASE
        WHEN RANDOM() < 0.4 THEN LPAD((RANDOM() * 10000000000000000)::BIGINT::TEXT, 16, '0')
        ELSE NULL
    END,
    -- npwp: 15-20 digit random (70% null)
    CASE
        WHEN RANDOM() < 0.3 THEN LPAD((RANDOM() * 1000000000000000000)::BIGINT::TEXT, 15 + (RANDOM() * 5)::INT, '0')
        ELSE NULL
    END,
    -- phone: 10-20 digit
    '08' || LPAD((RANDOM() * 10000000000)::BIGINT::TEXT, 10 + (RANDOM() * 8)::INT, '0'),
    -- email: 80% memiliki email (case random)
    CASE
        WHEN RANDOM() < 0.8 THEN
            LOWER((ARRAY['budi', 'ahmad', 'dewi', 'siti', 'agus', 'rina', 'eko', 'maya', 'rizky', 'putri'])[1 + (RANDOM() * 9)::INT]) ||
            '.' ||
            LOWER((ARRAY['santoso', 'wijaya', 'putra', 'putri', 'kusuma', 'saputra', 'hidayat', 'rahayu', 'nugroho', 'pratama'])[1 + (RANDOM() * 9)::INT]) ||
            (ARRAY['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com'])[1 + (RANDOM() * 3)::INT]
        ELSE NULL
    END,
    -- source
    (ARRAY['visit', 'referral', 'tiktok', 'instagram', 'whatsapp', 'other'])[1 + (RANDOM() * 5)::INT],
    -- budget_range: JSONB (60% null)
    CASE
        WHEN RANDOM() < 0.4 THEN
            jsonb_build_object(
                'min', (500000000 + (RANDOM() * 2000000000))::NUMERIC,
                'max', (1000000000 + (RANDOM() * 3000000000))::NUMERIC,
                'currency', 'IDR'
            )
        ELSE NULL
    END,
    -- property_price: (70% null)
    CASE
        WHEN RANDOM() < 0.3 THEN (500000000 + (RANDOM() * 3000000000))::NUMERIC(15, 2)
        ELSE NULL
    END,
    -- down_payment: (70% null)
    CASE
        WHEN RANDOM() < 0.3 THEN (100000000 + (RANDOM() * 500000000))::NUMERIC(15, 2)
        ELSE NULL
    END,
    -- down_payment_percentage: (70% null, 1-100)
    CASE
        WHEN RANDOM() < 0.3 THEN (10 + (RANDOM() * 40))::NUMERIC(5, 2)
        ELSE NULL
    END,
    -- interest_rate: (60% null, default 5.5, range 3-15)
    CASE
        WHEN RANDOM() < 0.4 THEN (3 + (RANDOM() * 12))::NUMERIC(5, 2)
        ELSE NULL
    END,
    -- loan_term_years: (60% null, 5/10/15/20/25)
    CASE
        WHEN RANDOM() < 0.4 THEN (ARRAY[5, 10, 15, 20, 25])[1 + (RANDOM() * 4)::INT]
        ELSE NULL
    END,
    -- estimated_monthly_payment: (70% null)
    CASE
        WHEN RANDOM() < 0.3 THEN (3000000 + (RANDOM() * 25000000))::NUMERIC(15, 2)
        ELSE NULL
    END,
    -- status: weighted distribution
    CASE
        WHEN RANDOM() < 0.35 THEN 'new'
        WHEN RANDOM() < 0.60 THEN 'contacted'
        WHEN RANDOM() < 0.75 THEN 'surveyed'
        WHEN RANDOM() < 0.90 THEN 'negotiating'
        WHEN RANDOM() < 0.97 THEN 'closed'
        ELSE 'cancelled'
    END,
    -- notes: (50% null)
    CASE
        WHEN RANDOM() < 0.5 THEN
            (ARRAY['Potensial banget', 'Perlu follow up lagi', 'Minat tapi budget kurang',
                    'Sudah kirim brosur via WA', 'Janji survey minggu depan', 'Masih ragu-ragu',
                    'Tanya kembali bulan depan', 'Butuh konsultasi lebih lanjut', 'Sudah visit show unit',
                    'Sedang bandingkan dengan properti lain', 'Calon pembeli serius',
                    'Menunggu persetujuan dari pasangan', 'Budget sudah cocok'])[1 + (RANDOM() * 12)::INT]
        ELSE NULL
    END,
    -- last_followed_up_at: (60% null, antara 2 minggu lalu sampai sekarang)
    CASE
        WHEN RANDOM() < 0.4 THEN NOW() - (RANDOM() * INTERVAL '14 days')
        ELSE NULL
    END,
    -- next_follow_up_at: (70% null, antara sekarang sampai 2 minggu ke depan)
    CASE
        WHEN RANDOM() < 0.3 THEN NOW() + (RANDOM() * INTERVAL '14 days')
        ELSE NULL
    END,
    -- created_at: antara 2 minggu lalu sampai sekarang
    NOW() - (RANDOM() * INTERVAL '14 days'),
    -- updated_at: antara created_at sampai sekarang
    NOW() - (RANDOM() * INTERVAL '7 days')
FROM generate_series(1, 1000);
