# API Design - Dashboard Matrix & Upcoming Reminders V2

# API Design - Dashboard Matrix & Upcoming Reminders V2

---

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Dashboard Management |
| **Version** | 2.0 |
| **Last Updated** | 2026-07-13 |
| **Related Docs** | ERD - Dashboard Management, API Design - Properties V2 |
| **Base URL** | `/api/v1` |

---

## 2. Dashboard Matrix API

### 2.1 Get Dashboard Overview Metrics

**Endpoint:** `/api/v1/dashboard/overview`**Method:** `GET`**Fungsi Utama:** Mengambil 4 metrik utama dashboard untuk user yang sedang login

**Contoh Response:**

```json
{
    "success": true,
    "data": {
        "total_leads": {
            "value": 247,
            "trend_value": 12,
            "trend_label": "+12",
            "trend_period": "this_week"
        },
        "new_leads_this_month": {
            "value": 45,
            "trend_value": 12,
            "trend_label": "+12%",
            "trend_percentage": true
        },
        "surveyed": {
            "value": 28,
            "trend_value": 3,
            "trend_label": "+3"
        },
        "closed": {
            "value": 8,
            "trend_value": 2,
            "trend_label": "+2"
        }
    }
}
```

**Data Mapping:**

| Response Field | DB Table | DB Column | Mapping Logic |
| --- | --- | --- | --- |
| `total_leads.value` | `leads` | - | `COUNT(*) WHERE assigned_to = {user_id} AND status != 'cancelled'` |
| `total_leads.trend_value` | `leads` | - | `COUNT(*) WHERE assigned_to = {user_id} AND created_at >= DATE_TRUNC('week', NOW())` |
| `new_leads_this_month.value` | `leads` | - | `COUNT(*) WHERE assigned_to = {user_id} AND created_at >= DATE_TRUNC('month', NOW())` |
| `new_leads_this_month.trend_percentage` | - | - | Calculation: `(current_month - prev_month) / prev_month * 100` |
| `surveyed.value` | `leads` | `status` | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'surveyed'` |
| `surveyed.trend_value` | `leads` | `status`, `created_at` | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'surveyed' AND created_at >= DATE_TRUNC('week', NOW())` |
| `closed.value` | `leads` | `status` | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'closed'` |
| `closed.trend_value` | `leads` | `status`, `created_at` | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'closed' AND created_at >= DATE_TRUNC('week', NOW())` |

**Database Query:**

```sql
-- Total Leads (non-cancelled)
SELECT COUNT(*) AS total_leads
FROM leads
WHERE assigned_to = $1 AND status != 'cancelled';

-- New Leads This Week (for trend_value of total_leads)
SELECT COUNT(*) AS new_this_week
FROM leads
WHERE assigned_to = $1
  AND created_at >= DATE_TRUNC('week', NOW());

-- New Leads This Month vs Last Month (for value + percentage)
SELECT
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) AS this_month,
    COUNT(*) FILTER (
        WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          AND created_at < DATE_TRUNC('month', NOW())
    ) AS last_month
FROM leads
WHERE assigned_to = $1;

-- Surveyed
SELECT COUNT(*) AS surveyed
FROM leads
WHERE assigned_to = $1 AND status = 'surveyed';

-- Surveyed This Week (for trend_value)
SELECT COUNT(*) AS surveyed_this_week
FROM leads
WHERE assigned_to = $1
  AND status = 'surveyed'
  AND created_at >= DATE_TRUNC('week', NOW());

-- Closed
SELECT COUNT(*) AS closed
FROM leads
WHERE assigned_to = $1 AND status = 'closed';

-- Closed This Week (for trend_value)
SELECT COUNT(*) AS closed_this_week
FROM leads
WHERE assigned_to = $1
  AND status = 'closed'
  AND created_at >= DATE_TRUNC('week', NOW());
```

> **Note:** Seluruh query difilter oleh `assigned_to = $1` yang diambil dari JWT token, konsisten dengan pattern keamanan di API Design - Properties V2.
> 

---

## 3. Upcoming Reminders API

### 3.1 Get Upcoming Reminders

**Endpoint:** `/api/v1/reminders/upcoming`**Method:** `GET`**Fungsi Utama:** Mengambil daftar reminder yang akan datang untuk user yang sedang login

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `limit` | integer | No | `3` | Max items returned |
| `hours_ahead` | integer | No | `24` | Filter reminders within X hours from now |

**Contoh Response:**

```json
{
    "success": true,
    "data": {
        "reminders": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "remind_at": "2026-01-12T10:14:00+07:00",
                "remind_at_formatted": "Today, 10:14 AM",
                "message": "Follow up regarding KPR calculation",
                "is_completed": false,
                "created_at": "2026-01-11T08:00:00+07:00",
                "lead": {
                    "id": "660e8400-e29b-41d4-a716-446655440001",
                    "name": "Budi Santoso",
                    "phone": "0812-3456-7890",
                    "email": "budi@example.com",
                    "status": "negotiating",
                    "property_price": 500000000,
                    "unit": {
                        "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
                        "name": "A-1",
                        "land_area": 72.00,
                        "status": "reserved",
                        "block": {
                            "id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
                            "name": "Block Anggrek",
                            "property": {
                                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                                "name": "Grand Permata Residence",
                                "city": "Jakarta"
                            }
                        }
                    }
                }
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440003",
                "remind_at": "2026-01-13T14:00:00+07:00",
                "remind_at_formatted": "Tomorrow, 2:00 PM",
                "message": "Site visit confirmation",
                "is_completed": false,
                "created_at": "2026-01-12T09:00:00+07:00",
                "lead": {
                    "id": "660e8400-e29b-41d4-a716-446655440004",
                    "name": "Dewi Lestari",
                    "phone": "0813-4567-8901",
                    "email": "dewi@example.com",
                    "status": "new",
                    "property_price": 750000000,
                    "unit": {
                        "id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
                        "name": "B-3",
                        "land_area": 90.00,
                        "status": "reserved",
                        "block": {
                            "id": "c2d3e4f5-a6b7-8901-cdef-123456789012",
                            "name": "Block Mawar",
                            "property": {
                                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                                "name": "Grand Permata Residence",
                                "city": "Jakarta"
                            }
                        }
                    }
                }
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440006",
                "remind_at": "2026-01-13T16:30:00+07:00",
                "remind_at_formatted": "Tomorrow, 4:30 PM",
                "message": "Send payment schedule",
                "is_completed": false,
                "created_at": "2026-01-12T10:00:00+07:00",
                "lead": {
                    "id": "660e8400-e29b-41d4-a716-446655440007",
                    "name": "Ahmad Wijaya",
                    "phone": "0811-2345-6789",
                    "email": null,
                    "status": "surveyed",
                    "property_price": 1200000000,
                    "unit": null
                }
            }
        ],
        "meta": {
            "total": 3,
            "limit": 3,
            "hours_ahead": 24
        }
    }
}
```

> **Note:** Pada contoh ketiga, `unit` bernilai `null` karena lead belum di-assign ke unit mana pun (`leads.unit_id` IS NULL). Ini sesuai ERD dimana `unit_id` pada `leads` bersifat NULLABLE.
> 

**Data Mapping:**

| Response Field | DB Table | DB Column | Mapping Logic |
| --- | --- | --- | --- |
| `id` | `reminder_schedules` | `id` | Direct |
| `remind_at` | `reminder_schedules` | `remind_at` | Direct |
| `remind_at_formatted` | - | - | Format string dari `remind_at` (backend/frontend logic) |
| `message` | `reminder_schedules` | `message` | Direct |
| `is_completed` | `reminder_schedules` | `is_completed` | Direct |
| `created_at` | `reminder_schedules` | `created_at` | Direct |
| `lead.id` | `leads` | `id` | Direct dari JOIN |
| `lead.name` | `leads` | `name` | Direct dari JOIN |
| `lead.phone` | `leads` | `phone` | Direct dari JOIN |
| `lead.email` | `leads` | `email` | Direct dari JOIN (nullable) |
| `lead.status` | `leads` | `status` | Direct dari JOIN |
| `lead.property_price` | `leads` | `property_price` | Direct dari JOIN (nullable) |
| `lead.unit.id` | `units` | `id` | JOIN via `leads.unit_id = units.id` |
| `lead.unit.name` | `units` | `name` | Direct dari JOIN |
| `lead.unit.land_area` | `units` | `land_area` | Direct dari JOIN (nullable) |
| `lead.unit.status` | `units` | `status` | Direct dari JOIN |
| `lead.unit.block.id` | `blocks` | `id` | JOIN via `units.block_id = blocks.id` |
| `lead.unit.block.name` | `blocks` | `name` | Direct dari JOIN |
| `lead.unit.block.property.id` | `properties` | `id` | JOIN via `blocks.property_id = properties.id` |
| `lead.unit.block.property.name` | `properties` | `name` | Direct dari JOIN |
| `lead.unit.block.property.city` | `properties` | `city` | Direct dari JOIN |

**Database Query:**

```sql
SELECT
    rs.id,
    rs.remind_at,
    rs.message,
    rs.is_completed,
    rs.created_at,
    l.id AS lead_id,
    l.name AS lead_name,
    l.phone AS lead_phone,
    l.email AS lead_email,
    l.status AS lead_status,
    l.property_price,
    u.id AS unit_id,
    u.name AS unit_name,
    u.land_area AS unit_land_area,
    u.status AS unit_status,
    b.id AS block_id,
    b.name AS block_name,
    p.id AS property_id,
    p.name AS property_name,
    p.city AS property_city
FROM reminder_schedules rs
INNER JOIN leads l ON rs.lead_id = l.id
LEFT JOIN units u ON l.unit_id = u.id
LEFT JOIN blocks b ON u.block_id = b.id
LEFT JOIN properties p ON b.property_id = p.id
WHERE rs.user_id = $1
  AND rs.remind_at BETWEEN NOW() AND (NOW() + ($2 || ' hours')::INTERVAL)
  AND rs.is_completed = false
ORDER BY rs.remind_at ASC
LIMIT $3;

-- Count total for meta
SELECT COUNT(*)
FROM reminder_schedules
WHERE user_id = $1
  AND remind_at BETWEEN NOW() AND (NOW() + ($2 || ' hours')::INTERVAL)
  AND is_completed = false;
```

> **Perubahan dari versi sebelumnya:** Query parameter `hours_ahead` sekarang benar-benar digunakan dalam query (sebelumnya di contoh response meta menunjukkan `168` tapi di SQL hardcode `1 week`). Join chain diubah dari `leads → properties` (langsung) menjadi `leads → units → blocks → properties` sesuai ERD. Kolom `price` dan `property_type` dihapus karena tidak ada di tabel `properties` (ERD), diganti dengan `property_price` dari tabel `leads` dan chain `unit → block → property`.
> 

---

## 4. Create Reminder API

### 4.1 Create New Reminder

**Endpoint:** `/api/v1/reminders`**Method:** `POST`**Content-Type:** `application/json`**Fungsi Utama:** Membuat reminder baru untuk follow-up lead

**Request Body:**

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `lead_id` | UUID | Yes | `reminder_schedules.lead_id` | Must exist in `leads`, `assigned_to` = user yang login |
| `remind_at` | ISO 8601 timestamp | Yes | `reminder_schedules.remind_at` | Must be future time |
| `message` | string | No | `reminder_schedules.message` | Text, nullable |

**Example Request Body:**

```json
{
    "lead_id": "660e8400-e29b-41d4-a716-446655440000",
    "remind_at": "2026-01-15T10:00:00+07:00",
    "message": "Follow up setelah site visit"
}
```

**Success Response** `201`:

```json
{
    "success": true,
    "data": {
        "reminder": {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "user_id": "440e8400-e29b-41d4-a716-446655440000",
            "lead_id": "660e8400-e29b-41d4-a716-446655440000",
            "remind_at": "2026-01-15T10:00:00+07:00",
            "message": "Follow up setelah site visit",
            "is_completed": false,
            "created_at": "2026-01-12T08:00:00+07:00"
        }
    }
}
```

**Database Impact — INSERT:**

```sql
INSERT INTO reminder_schedules (
    id,
    user_id,
    lead_id,
    remind_at,
    message,
    is_completed,
    created_at
) VALUES (
    gen_random_uuid(),
    $1, -- user_id dari JWT token
    $2, -- lead_id dari request body
    $3, -- remind_at dari request body
    $4, -- message dari request body
    false,
    NOW()
) RETURNING *
```

> **Perubahan dari versi sebelumnya:** Menggunakan `gen_random_uuid()` (konsisten dengan Properties V2) menggantikan `uuid_generate_v4()`. Menghapus `updated_at` dari response karena kolom tersebut tidak ada di tabel `reminder_schedules` (ERD). Response di-wrap dalam objek `reminder` (konsisten dengan pattern Properties V2 yang meng-wrap data dalam objek bernama sesuai entitas).
> 

**Validation Logic:**

1. Cek apakah `lead_id` ada dan `assigned_to` = user yang sedang login
2. Cek apakah `remind_at` > NOW()
3. Cek apakah tidak ada reminder duplikat untuk lead yang sama pada waktu yang sama

---

## 5. Update Reminder API

### 5.1 Complete/Update Reminder

**Endpoint:** `/api/v1/reminders/:id`**Method:** `PUT`**Content-Type:** `application/json`**Fungsi Utama:** Update status reminder atau edit jadwal reminder

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Reminder ID |

**Request Body:**

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `is_completed` | boolean | No | `reminder_schedules.is_completed` | `true` / `false` |
| `remind_at` | ISO 8601 timestamp | No | `reminder_schedules.remind_at` | Must be future time |
| `message` | string | No | `reminder_schedules.message` | Text, nullable |

**Example Request Body (Complete Reminder):**

```json
{
    "is_completed": true
}
```

**Example Request Body (Reschedule Reminder):**

```json
{
    "remind_at": "2026-01-16T14:00:00+07:00",
    "message": "Reschedule - client meminta waktu yang lebih fleksibel"
}
```

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "reminder": {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "user_id": "440e8400-e29b-41d4-a716-446655440000",
            "lead_id": "660e8400-e29b-41d4-a716-446655440000",
            "remind_at": "2026-01-16T14:00:00+07:00",
            "message": "Reschedule - client meminta waktu yang lebih fleksibel",
            "is_completed": false,
            "created_at": "2026-01-12T08:00:00+07:00"
        }
    }
}
```

**Database Impact — UPDATE:**

```sql
UPDATE reminder_schedules
SET is_completed = COALESCE($1, is_completed),
    remind_at = COALESCE($2, remind_at),
    message = COALESCE($3, message)
WHERE id = $4
  AND user_id = $5
RETURNING *
```

> **Perubahan dari versi sebelumnya:** Menghapus `updated_at` dari response dan SQL karena kolom tersebut tidak ada di tabel `reminder_schedules` berdasarkan ERD. Response di-wrap dalam objek `reminder`. Menggunakan pattern `COALESCE` untuk partial update (konsisten dengan Properties V2).
> 

**Validation Logic:**

1. Cek apakah reminder dengan ID tersebut ada dan milik user yang sedang login (`user_id` dari JWT)
2. Jika update `remind_at`, pastikan waktu baru > NOW()
3. Minimal 1 field harus dikirim

---

## 6. Delete Reminder API

### 6.1 Delete Reminder

**Endpoint:** `/api/v1/reminders/:id`**Method:** `DELETE`**Fungsi Utama:** Hapus reminder yang tidak diperlukan

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Reminder ID |

**Success Response** `200`:

```json
{
    "success": true,
    "message": "Reminder deleted successfully"
}
```

**Database Impact — DELETE:**

```sql
DELETE FROM reminder_schedules
WHERE id = $1
  AND user_id = $2
RETURNING id;
```

> **Perubahan dari versi sebelumnya:** Response diubah dari nested `data` object menjadi flat `message` string (konsisten dengan pattern DELETE di Properties V2). Jika tidak ada row yang terhapus, return `NOT_FOUND`.
> 

---

## 7. Error Response Format

**Standard Error Response:**

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": {
            "remind_at": ["remind_at must be in the future"],
            "lead_id": ["Lead not found or not assigned to you"]
        }
    }
}
```

**Error Codes:**

| Code | HTTP Status | Description | Applicable To |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request validation gagal | Semua endpoint |
| `UNAUTHORIZED` | 401 | Tidak ada token valid | Semua endpoint |
| `FORBIDDEN` | 403 | Resource bukan milik user | GET/PUT/DELETE by ID |
| `NOT_FOUND` | 404 | Resource tidak ditemukan | GET/PUT/DELETE by ID |
| `INTERNAL_ERROR` | 500 | Server error | Semua endpoint |

> **Perubahan dari versi sebelumnya:** HTTP Status untuk `VALIDATION_ERROR` diubah dari `422` menjadi `400` (konsisten dengan Properties V2).
> 

---

## 8. API Summary Table

| # | Method | Endpoint | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| **Dashboard** |  |  |  |  |
| 1 | `GET` | `/api/v1/dashboard/overview` | - | 4 metrik utama dashboard |
| **Reminders** |  |  |  |  |
| 2 | `GET` | `/api/v1/reminders/upcoming` | - | Daftar reminder yang akan datang |
| 3 | `POST` | `/api/v1/reminders` | `application/json` | Buat reminder baru |
| 4 | `PUT` | `/api/v1/reminders/:id` | `application/json` | Update / complete reminder |
| 5 | `DELETE` | `/api/v1/reminders/:id` | - | Hapus reminder |

---

## 9. Database Impact Matrix

| Endpoint | Method | Tables | Operations | Security Filter |
| --- | --- | --- | --- | --- |
| `/dashboard/overview` | GET | `leads` | SELECT (aggregate) | `assigned_to = user_id` |
| `/reminders/upcoming` | GET | `reminder_schedules`, `leads`, `units`, `blocks`, `properties` | SELECT with JOIN (4 tables) | `reminder_schedules.user_id = user_id` |
| `/reminders` | POST | `reminder_schedules`, `leads` | INSERT + validation SELECT | `user_id` dari JWT, validasi `leads.assigned_to` |
| `/reminders/:id` | PUT | `reminder_schedules` | UPDATE | `user_id = user_id` |
| `/reminders/:id` | DELETE | `reminder_schedules` | DELETE | `user_id = user_id` |

---

## 10. Changelog — Dari Versi 1.0 ke 2.0

| # | Area | Perubahan | Alasan |
| --- | --- | --- | --- |
| 1 | **Response structure — Reminders** | `lead.property` diganti menjadi `lead.unit.block.property` (nested chain) | ERD: leads berelasi ke `units`, bukan langsung ke `properties` |
| 2 | **Response fields — Reminders** | Menghapus `property_type` dan `price` dari response | ERD: tabel `properties` tidak memiliki kolom `property_type` maupun `price` |
| 3 | **Response fields — Reminders** | Menambahkan `lead.status` dan `lead.property_price` | ERD: `leads` memiliki kolom `status` dan `property_price` yang relevan untuk ditampilkan |
| 4 | **Response fields — Reminders** | Menambahkan `lead.unit.land_area`, `lead.unit.status`, `lead.unit.block.name`, `lead.unit.block.property.city` | Memberikan konteks lengkap sesuai hierarki ERD |
| 5 | **Response fields — Reminders** | `lead.unit` dapat bernilai `null` | ERD: `leads.unit_id` bersifat NULLABLE (lead belum tentu punya unit) |
| 6 | **Response structure — Create/Update** | Menghapus `updated_at` dari response | ERD: tabel `reminder_schedules` tidak memiliki kolom `updated_at` |
| 7 | **Response structure — Create/Update** | Data di-wrap dalam objek `reminder` (bukan langsung di `data`) | Konsistensi dengan pattern Properties V2 (`data.property`, `data.block`, `data.unit`) |
| 8 | **Response structure — Delete** | Dari `{ "data": { "id": "...", "deleted": true } }` menjadi `{ "message": "Reminder deleted successfully" }` | Konsistensi dengan pattern DELETE di Properties V2 |
| 9 | **SQL — Insert** | `uuid_generate_v4()` → `gen_random_uuid()` | Konsistensi dengan Properties V2 |
| 10 | **SQL — Update** | Menghapus `SET updated_at = NOW()` | ERD: tabel `reminder_schedules` tidak memiliki kolom `updated_at` |
| 11 | **SQL — Upcoming Reminders** | Join chain dari `leads → properties` menjadi `leads → units → blocks → properties` | Sesuai relasi ERD |
| 12 | **SQL — Upcoming Reminders** | Parameter `hours_ahead` digunakan secara dinamis dalam query (bukan hardcode `1 week`) | Koreksi bug: parameter didefinisikan tapi tidak digunakan di SQL |
| 13 | **Error Code** | `VALIDATION_ERROR` HTTP Status dari `422` → `400` | Konsistensi dengan Properties V2 |
| 14 | **Document metadata** | Penambahan Document Overview table, API Summary Table, Database Impact Matrix, Changelog | Konsistensi format dengan Properties V2 |

---

## 11. Related Documents

- ERD - Dashboard Management
- API Design - Properties V2
- API Design - Authentication & Session Management
- API Design - Leads
- API Design - Users & Roles

---

*Document Version: 2.0 | Last Updated: 2026-07-13*