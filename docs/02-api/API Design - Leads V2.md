# API Design - Leads V2

# API Design - Leads V2

---

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Leads Management |
| **Version** | 2.0 |
| **Last Updated** | 2026-08-18 |
| **Related Docs** | [BRD](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f), [ERD](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954), [API Design - Properties V2](https://www.notion.so/API-Design-Properties-V2-2e4b2c42720c818093ffc3728d4807a9) |

### Changelog dari v1.1 → v2.0

| Perubahan | Alasan |
| --- | --- |
| Mengganti `property_id` → `unit_id` di seluruh endpoint | ERD: `leads` berelasi ke `units`, bukan `properties` secara langsung |
| Mengganti objek `property` → `unit` (nested `block` + `property`) di response | Sesuai relasi `leads → units → blocks → properties` |
| Menambahkan status `booked` ke semua enum status lead | ERD: `leads.status` CHECK constraint mencakup `booked` |
| Mengubah field WA: `message_type`→`direction`, `content`→`message_text`, menambahkan `user_id`, `message_id`, `status` | Sesuai kolom ERD `whatsapp_messages` |
| Mengubah `source` dari enum ketat → free text (max 50 chars) | ERD: `source VARCHAR(50)` tanpa CHECK constraint, DEFAULT `'Visit'` |
| Menambahkan `down_payment` ke response create & update | ERD: kolom `down_payment NUMERIC(15,2)` tersedia di tabel `leads` |
| Menghapus `property_type` dari seluruh response | ERD: tabel `properties` tidak memiliki kolom `property_type` |
| Menghapus `updated_at` dari response `reminders` | ERD: tabel `reminder_schedules` tidak memiliki kolom `updated_at` |
| Menambahkan kolom `user_id`, `message_id`, `status` ke response `whatsapp_messages` | Sesuai skema ERD `whatsapp_messages` |
| Mengubah SQL query semua endpoint | Menyesuaikan join chain `leads → units → blocks → properties` |
| Menyederhanakan endpoint 3.6 (Properties Dropdown) | Menghapus `property_type`, menambahkan `city` |
| Menambahkan endpoint `DELETE /api/v1/leads/:id` | Fungsi hapus lead permanen beserta data terkait |
| Menambahkan endpoint `GET /api/v1/leads/export` | Fungsi export leads ke file Excel (.xlsx) |

---

## 2. Page Overview

### 2.1 Leads List View

- **Route**: `/dashboard/leads`
- **Purpose**: Display all leads in a paginated table format with filtering capabilities
- **Features**:
    - Pagination (max 50 rows per page)
    - Filters: Stages, Name/Phone search, Date Range (default 1 year), Property, Source
- **UI Component**: Data table with sortable columns

### 2.2 Lead Detail View

- **Route**: `/dashboard/leads/:id`
- **Purpose**: View and edit individual lead details
- **Features**:
    - Lead information display
    - KPR simulation results
    - Activity timeline
    - Notes management
    - Status change
    - Edit mode
- **UI Component**: Slide-over panel / full-page view

---

## 3. API Design

### 3.1 GET /api/v1/leads - List Leads with Pagination & Filters

**Purpose**: Retrieve paginated list of leads with filtering capabilities

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `page` | number | No | 1 | Page number (starts from 1) |
| `limit` | number | No | 50 | Max rows per page (max 50) |
| `status` | string | No | - | Filter by stage: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` |
| `statuses` | string (comma-separated) | No | - | Filter by multiple statuses, e.g. `new,contacted,surveyed,negotiating`. Setiap nilai harus salah satu dari: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` |
| `search` | string | No | - | Search by name or phone number |
| `start_date` | string (ISO date) | No | 1 year ago | Filter leads created after this date |
| `end_date` | string (ISO date) | No | today | Filter leads before this date |
| `property_id` | UUID | No | - | Filter by property ID (resolved via `unit → block → property` join chain) |
| `source` | string | No | - | Filter by source (free text match) |
| `sort_by` | string | No | `created_at` | Sort field: `created_at`, `name`, `status`, `next_follow_up_at` |
| `sort_order` | string | No | `desc` | Sort order: `asc`, `desc` |

### 3.1.1 Authorization/Visibility Rules (RBAC)

Data visibility pada endpoint ini (list, detail, dan export) ditentukan oleh role user yang sedang login (dibaca dari JWT `req.user.role`):

| Role | Scope | Database Filter |
| --- | --- | --- |
| `Admin` | Semua leads di seluruh sistem (semua roles) | Tanpa filter `assigned_to` |
| `Supervisor` | Semua leads di seluruh sistem (semua roles) | Tanpa filter `assigned_to` |
| `Sales` | Hanya leads milik sendiri | `l.assigned_to` = current user ID |

**SQL Condition**:

```sql
WHERE (l.assigned_to = $1 OR $2::boolean)   -- $2 = true jika role Admin/Supervisor
  ...
```

- `$1` = current user ID (dari JWT `sub`)
- `$2` = boolean: `true` untuk role `Admin`/`Supervisor` (filter `assigned_to` diabaikan → semua leads), `false` untuk role `Sales` (hanya leads milik user tersebut)

> **Note**: RBAC ini berlaku untuk ketiga endpoint retrieval: `GET /api/v1/leads`, `GET /api/v1/leads/:id`, dan `GET /api/v1/leads/export`. Write operations (`POST`, `PUT`, `DELETE`) tetap melakukan validasi `assigned_to` ownership.

---

**Request Example**:

```
GET /api/v1/leads?page=1&limit=50&status=new&search=budi&start_date=2025-01-12&end_date=2026-01-12&source=landing_page&property_id=e2696123-cf18-44f7-ba63-481896c08d31&sort_by=created_at&sort_order=desc
GET /api/v1/leads?page=1&limit=200&start_date=2000-01-01&end_date=2026-08-18&statuses=new,contacted,surveyed,negotiating
```

**Response Structure**:

```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "806dc9c8-9983-4148-ae27-cf76768732a8",
        "name": "Lead Customer 182",
        "phone": "081565117728",
        "status": "contacted",
        "source": "Visit",
        "unit": {
          "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
          "name": "A-1",
          "block_name": "Block Anggrek",
          "property_name": "Grand Permata Residence",
          "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        },
        "created_at": "2026-06-28T05:41:44.687Z",
        "updated_at": "2026-07-01T05:43:59.004Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 300,
      "pages": 6
    }
  }
}
```

> **Note**: `unit` bernilai `null` jika lead belum di-assign ke unit manapun (`unit_id` IS NULL).
> 

**Data Mapping**:

| **Response Field** | **Database Table** | **Database Column** | **Mapping & Transformation Logic** |
| --- | --- | --- | --- |
| **`leads`** |  |  | *Array of lead items mapped from query results* |
| `leads[].id` | `leads` | `id` | Direct mapping |
| `leads[].name` | `leads` | `name` | Direct mapping |
| `leads[].phone` | `leads` | `phone` | Direct mapping |
| `leads[].status` | `leads` | `status` | Direct mapping |
| `leads[].source` | `leads` | `source` | Direct mapping |
| `leads[].unit` | — | — | Object wrapper. `null` jika `unit_id` kosong |
| `leads[].unit.id` | `units` | `id` | Diambil via `LEFT JOIN leads → units` menggunakan `l.unit_id = u.id` |
| `leads[].unit.name` | `units` | `name` | Diambil via `LEFT JOIN leads → units` |
| `leads[].unit.block_name` | `blocks` | `name` | Diambil via `LEFT JOIN units → blocks` menggunakan `u.block_id = b.id` |
| `leads[].unit.property_name` | `properties` | `name` | Diambil via `LEFT JOIN blocks → properties` menggunakan `b.property_id = p.id` |
| `leads[].unit.property_id` | `properties` | `id` | Diambil via join chain `leads → units → blocks → properties` |
| `leads[].created_at` | `leads` | `created_at` | Direct mapping (Timestamp ISO) |
| `leads[].updated_at` | `leads` | `updated_at` | Direct mapping (Timestamp ISO) |
| **`pagination`** | — | — | *Object untuk kontrol halaman data* |
| `pagination.page` | — | — | Berasal dari query parameter input (default: `1`) |
| `pagination.limit` | — | — | Berasal dari query parameter input (default: `50`) |
| `pagination.total` | — | — | Hasil agregasi dari query `SELECT COUNT(DISTINCT l.id)` |
| `pagination.pages` | — | — | Kalkulasi matematika: `Math.ceil(total / limit)` |

**Database Query**:

```sql
SELECT
    l.id,
    l.name,
    l.phone,
    l.status,
    l.source,
    l.unit_id,
    l.created_at,
    l.updated_at,
    u.id AS unit_id_detail,
    u.name AS unit_name,
    b.name AS block_name,
    p.id AS property_id,
    p.name AS property_name
FROM leads l
LEFT JOIN users usr ON l.assigned_to = usr.id
LEFT JOIN units u ON l.unit_id = u.id
LEFT JOIN blocks b ON u.block_id = b.id
LEFT JOIN properties p ON b.property_id = p.id
WHERE (l.assigned_to = $1 OR $2::boolean)             -- RBAC: $1 = User ID dari JWT; $2 = true (Admin/Supervisor) => semua leads, false (Sales) => lead sendiri
    AND l.created_at >= $3                            -- Wajib: Start Date (Default: 1 tahun lalu)
    AND l.created_at <= $4                            -- Wajib: End Date (Default: Hari ini)
    AND ($5::varchar(50) IS NULL OR l.status = $5)   -- Opsional: single status
    -- Opsional: multiple statuses (param `statuses`):
    -- AND l.status IN ($n, $n+1, ...)               -- contoh: 'new','contacted','surveyed','negotiating'
    AND ($6::text IS NULL OR l.name ILIKE '%' || $6 || '%' OR l.phone ILIKE '%' || $6 || '%')  -- Opsional: Jika search diisi
    AND ($7::uuid IS NULL OR p.id = $7)              -- Opsional: Jika property_id diisi (filter via join chain)
    AND ($8::text IS NULL OR l.source ILIKE '%' || $8 || '%')  -- Opsional: Jika source diisi
ORDER BY
    CASE WHEN $9 = 'created_at' THEN l.created_at END,
    CASE WHEN $9 = 'name' THEN l.name END,
    CASE WHEN $9 = 'status' THEN l.status END,
    CASE WHEN $9 = 'next_follow_up_at' THEN l.next_follow_up_at END
    $10 ASCNULLS LAST                                -- $10 = 'ASC' atau 'DESC'
LIMIT $11 OFFSET $12
```

> **Note**: `property_id` filter di-resolve melalui join chain `leads → units → blocks → properties`. Jika `property_id` diberikan, hanya lead yang unit-nya berada di property tersebut yang akan muncul. Jika lead tidak punya unit (`unit_id` IS NULL), lead tersebut **tidak** akan muncul saat filter `property_id` aktif.
> 
> **Note**: `statuses` menerima daftar status comma-separated (mis. `new,contacted,surveyed,negotiating`); lead dengan status di luar daftar akan di-exclude dari hasil. Nilai yang tidak valid diabaikan. `statuses` dan `status` bersifat mutual exclusive — jika `statuses` diberikan, `status` diabaikan.
> 

---

### 3.2 GET /api/v1/leads/:id - Get Lead Detail

**Purpose**: Retrieve complete lead information including activities, messages, and reminders

**Method**: `GET`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Lead ID |

**Response Structure**:

```json
{
  "success": true,
  "data": {
    "lead": {
      "id": "806dc9c8-9983-4148-ae27-cf76768732a8",
      "name": "Lead Customer 182",
      "nik": "2709590805374907",
      "npwp": "749356652828969",
      "phone": "081565117728",
      "email": "lead_user_182@example.com",
      "status": "contacted",
      "source": "Visit",
      "unit_id": "e5f6a7b8-c9d0-1234-efab-567890123456",
      "budget_range": {
        "min": 500000000,
        "max": 1500000000
      },
      "kpr_simulation": {
        "property_price": "510000000.00",
        "down_payment_percentage": "27.00",
        "down_payment": "137700000.00",
        "interest_rate": "5.50",
        "loan_term_years": 25,
        "estimated_monthly_payment": "2286248.00"
      },
      "notes": "Tertarik dengan tipe unit cluster baru. Perlu follow up segera via WhatsApp.",
      "assigned_to": "48e8514d-1ff0-46e7-8581-9831f11adb11",
      "assigned_to_name": "Admin User",
      "last_followed_up_at": null,
      "next_follow_up_at": null,
      "created_at": "2026-06-28T05:41:44.687Z",
      "updated_at": "2026-07-01T05:43:59.004Z",
      "unit": {
        "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
        "name": "A-1",
        "land_area": 72.00,
        "status": "reserved",
        "block": {
          "id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
          "name": "Block Anggrek"
        },
        "property": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "Grand Permata Residence",
          "city": "Jakarta"
        }
      }
    },
    "activities": [
      {
        "id": "act-id-1",
        "lead_id": "806dc9c8-9983-4148-ae27-cf76768732a8",
        "user_id": "48e8514d-1ff0-46e7-8581-9831f11adb11",
        "user_name": "Admin User",
        "activity_type": "status_change",
        "old_status": "new",
        "new_status": "contacted",
        "notes": "Called customer",
        "metadata": null,
        "created_at": "2026-07-01T05:43:59.004Z"
      }
    ],
    "whatsapp_messages": [
      {
        "id": "wa-id-1",
        "lead_id": "806dc9c8-9983-4148-ae27-cf76768732a8",
        "user_id": "48e8514d-1ff0-46e7-8581-9831f11adb11",
        "direction": "outgoing",
        "message_text": "Halo, ada info terbaru...",
        "message_id": null,
        "status": "delivered",
        "sent_at": "2026-07-01T05:43:59.004Z",
        "created_at": "2026-07-01T05:43:59.004Z"
      }
    ],
    "reminders": [
      {
        "id": "b39f14cd-2a01-4c9d-a7f9-1a3beff36ab9",
        "user_id": "48e8514d-1ff0-46e7-8581-9831f11adb11",
        "lead_id": "806dc9c8-9983-4148-ae27-cf76768732a8",
        "remind_at": "2026-07-06T05:43:00.000Z",
        "message": "Follow Up!!",
        "is_completed": false,
        "created_at": "2026-07-01T05:43:59.004Z"
      }
    ]
  }
}
```

> **Note**: `unit` bernilai `null` jika lead belum di-assign ke unit manapun. `kpr_simulation` tetap tampil meskipun tidak ada unit (karena KPR fields tersimpan langsung di tabel `leads`).
> 

**Data Mapping**:

| **Response Field** | **Database Table** | **Database Column** | **Mapping Logic** |
| --- | --- | --- | --- |
| **lead.id** | `leads` | `id` | Direct mapping |
| **lead.name** | `leads` | `name` | Direct mapping |
| **lead.nik** | `leads` | `nik` | Direct mapping (nullable) |
| **lead.npwp** | `leads` | `npwp` | Direct mapping (nullable) |
| **lead.phone** | `leads` | `phone` | Direct mapping |
| **lead.email** | `leads` | `email` | Direct mapping (nullable) |
| **lead.status** | `leads` | `status` | Direct mapping |
| **lead.source** | `leads` | `source` | Direct mapping |
| **lead.unit_id** | `leads` | `unit_id` | Direct mapping (nullable) |
| **lead.budget_range** | `leads` | `budget_range` | JSONB field |
| **lead.kpr_simulation** | `leads` | *Multiple Columns* | Aggregated into object dari kolom: `property_price`, `down_payment`, `down_payment_percentage`, `interest_rate`, `loan_term_years`, `estimated_monthly_payment` |
| **lead.assigned_to** | `leads` | `assigned_to` | Direct mapping |
| **lead.assigned_to_name** | `users` | `full_name` | JOIN dari `users` via `assigned_to` |
| **lead.notes** | `leads` | `notes` | Direct mapping (nullable) |
| **lead.unit** | `units` + `blocks` + `properties` | *Multiple Columns* | JOIN via `unit_id → units.id → blocks.id → properties.id`. `null` jika `unit_id` IS NULL |
| **lead.unit.id** | `units` | `id` | Direct via JOIN |
| **lead.unit.name** | `units` | `name` | Direct via JOIN |
| **lead.unit.land_area** | `units` | `land_area` | Direct via JOIN |
| **lead.unit.status** | `units` | `status` | Direct via JOIN (status unit: available/reserved/booked/sold) |
| **lead.unit.block.id** | `blocks` | `id` | JOIN via `units.block_id = blocks.id` |
| **lead.unit.block.name** | `blocks` | `name` | JOIN via `units.block_id = blocks.id` |
| **lead.unit.property.id** | `properties` | `id` | JOIN via `blocks.property_id = properties.id` |
| **lead.unit.property.name** | `properties` | `name` | JOIN via `blocks.property_id = properties.id` |
| **lead.unit.property.city** | `properties` | `city` | JOIN via `blocks.property_id = properties.id` |
| **activities[]** | `lead_activities` | *Multiple Columns* | SELECT WHERE `lead_id = $1` JOIN `users.full_name` AS `user_name` ORDER BY `created_at DESC` |
| **whatsapp_messages[]** | `whatsapp_messages` | *Multiple Columns* | SELECT WHERE `lead_id = $1` ORDER BY `sent_at DESC` |
| **reminders[]** | `reminder_schedules` | *Multiple Columns* | SELECT WHERE `lead_id = $1 AND is_completed = false` ORDER BY `remind_at ASC` |

**Database Query**:

```sql
-- 1. Main Lead Detail Query
-- Join chain: leads → users, leads → units → blocks → properties
-- Filter security: assigned_to ($2) dari JWT dengan RBAC ($3 = boolean: Admin/Supervisor bypass)
SELECT
    l.*,
    u.full_name AS assigned_to_name,
    un.id AS unit_detail_id,
    un.name AS unit_name,
    un.land_area AS unit_land_area,
    un.status AS unit_status,
    b.id AS block_id,
    b.name AS block_name,
    p.id AS property_detail_id,
    p.name AS property_name,
    p.city AS property_city
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LEFT JOIN units un ON l.unit_id = un.id
LEFT JOIN blocks b ON un.block_id = b.id
LEFT JOIN properties p ON b.property_id = p.id
WHERE l.id = $1 AND (l.assigned_to = $2 OR $3::boolean);  -- $3 = true (Admin/Supervisor) => semua leads, false (Sales) => lead sendiri

-- 2. Activities Query
SELECT la.*, u.full_name AS user_name
FROM lead_activities la
LEFT JOIN users u ON la.user_id = u.id
WHERE la.lead_id = $1
ORDER BY la.created_at DESC;

-- 3. WhatsApp Messages Query
-- Sesuai kolom ERD: direction, message_text, message_id, status
SELECT
    wm.id,
    wm.lead_id,
    wm.user_id,
    wm.direction,
    wm.message_text,
    wm.message_id,
    wm.status,
    wm.sent_at,
    wm.created_at
FROM whatsapp_messages wm
WHERE wm.lead_id = $1
ORDER BY wm.sent_at DESC;

-- 4. Reminders Query
-- Tabel reminder_schedules TIDAK memiliki kolom updated_at (sesuai ERD)
SELECT
    id,
    user_id,
    lead_id,
    remind_at,
    message,
    is_completed,
    created_at
FROM reminder_schedules
WHERE lead_id = $1 AND is_completed = false
ORDER BY remind_at ASC;
```

---

### 3.3 POST /api/v1/leads - Create New Lead

**Purpose**: Create a new lead with optional KPR simulation and reminder

**Method**: `POST`

**Request Body**:

```json
{
  "name": "Eka Bachrudin Nursa",
  "phone": "081234567890",
  "email": "eka@example.com",
  "nik": "0896000000000000",
  "npwp": "089600000000000",
  "unit_id": "e5f6a7b8-c9d0-1234-efab-567890123456",
  "budget_range": {
    "min": 1300000000,
    "max": 1800000000
  },
  "source": "WhatsApp",
  "status": "new",
  "notes": "Tertarik dengan rumah yang akan dijual",
  "kpr_simulation": {
    "property_price": 1500000000,
    "down_payment_percentage": 20,
    "interest_rate": 11,
    "loan_term_years": 20
  },
  "reminder": {
    "remind_at": "2026-07-07T13:33:00Z",
    "message": "Remind untuk tahap survey",
    "is_completed": false
  }
}
```

**Request Payload Fields**:

| **Field** | **Type** | **Required** | **Database Table** | **Database Column** | **Validation & Rules** |
| --- | --- | --- | --- | --- | --- |
| **name** | string | **Yes** | `leads` | `name` | Max 100 chars, tidak boleh kosong/whitespace saja |
| **phone** | string | **Yes** | `leads` | `phone` | 10-20 digit, numeric only |
| **email** | string | No | `leads` | `email` | Format email valid jika diisi |
| **nik** | string | No | `leads` | `nik` | Harus tepat 16 digit jika diisi |
| **npwp** | string | No | `leads` | `npwp` | Harus 15-20 digit jika diisi |
| **source** | string | No | `leads` | `source` | Free text, max 50 chars. Default: `'Visit'` |
| **unit_id** | UUID | No | `leads` | `unit_id` | Harus eksis di tabel `units` dan unit harus berada di property milik user yang login (`assigned_to` match). Unit tidak boleh berstatus `sold` |
| **budget_range** | object | No | `leads` | `budget_range` | JSONB object: `{"min": number, "max": number}` |
| **status** | enum | No | `leads` | `status` | Values: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled`. Default: `new` |
| **notes** | string | No | `leads` | `notes` | Free text |
| **kpr_simulation** | object | No | — | — | Parent object untuk data KPR |
| `kpr_simulation.property_price` | number | No* | `leads` | `property_price` | Wajib jika `kpr_simulation` diisi. Numeric > 0 |
| `kpr_simulation.down_payment_percentage` | number | No* | `leads` | `down_payment_percentage` | Wajib jika `kpr_simulation` diisi. Range: 1 - 100 |
| `kpr_simulation.interest_rate` | number | No* | `leads` | `interest_rate` | Wajib jika `kpr_simulation` diisi. Numeric > 0 |
| `kpr_simulation.loan_term_years` | number | No* | `leads` | `loan_term_years` | Wajib jika `kpr_simulation` diisi. Values: `5, 10, 15, 20, 25` |
| **reminder** | object | No | — | — | Parent object untuk data pengingat |
| `reminder.remind_at` | datetime | No | `reminder_schedules` | `remind_at` | ISO Datetime string. Harus tanggal di masa depan |
| `reminder.message` | string | No | `reminder_schedules` | `message` | Free text |
| `reminder.is_completed` | boolean | No | `reminder_schedules` | `is_completed` | Default: `false` |

> **Business Rule — unit_id**: Jika `unit_id` diberikan, sistem harus memvalidasi bahwa unit tersebut berada di property yang dimiliki oleh user yang login. Query validasi: `SELECT u.id FROM units u JOIN blocks b ON u.block_id = b.id JOIN properties p ON b.property_id = p.id WHERE u.id = $1 AND p.assigned_to = $2`. Jika `unit_id` diberikan dan status lead bukan `cancelled`, trigger DB akan otomatis mengubah status unit (lihat [Unit Status Auto-Update](about:blank#unit-status-auto-update-reference-via-db-trigger)).
> 

> **Kalkulasi down_payment**: Jika `kpr_simulation` disediakan, `down_payment` dihitung di backend: `property_price * down_payment_percentage / 100` dan disimpan ke kolom `leads.down_payment`.
> 

**Response** `201`:

```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "lead": {
      "id": "226d933f-49d7-442d-9edb-032b345ce810",
      "name": "Eka Bachrudin Nursa",
      "phone": "081234567890",
      "email": "eka@example.com",
      "status": "new",
      "source": "WhatsApp",
      "unit_id": "e5f6a7b8-c9d0-1234-efab-567890123456",
      "budget_range": {
        "min": 1300000000,
        "max": 1800000000
      },
      "assigned_to": "48e8514d-1ff0-46e7-8581-9831f11adb11",
      "next_follow_up_at": null,
      "created_at": "2026-07-01T06:33:32.075Z",
      "updated_at": "2026-07-01T06:33:32.075Z",
      "kpr_simulation": {
        "property_price": "1500000000.00",
        "down_payment_percentage": "20.00",
        "down_payment": "300000000.00",
        "interest_rate": "11.00",
        "loan_term_years": 20,
        "estimated_monthly_payment": "12386261.00"
      },
      "unit": {
        "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
        "name": "A-1",
        "land_area": 72.00,
        "status": "reserved",
        "block": {
          "id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
          "name": "Block Anggrek"
        },
        "property": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "Grand Permata Residence",
          "city": "Jakarta"
        }
      }
    }
  }
}
```

**Database Impact - INSERT Operations**:

1. **Insert into `leads` table**:

```sql
INSERT INTO leads (
    id,
    assigned_to,
    unit_id,
    name,
    nik,
    npwp,
    phone,
    email,
    source,
    budget_range,
    status,
    notes,
    property_price,
    down_payment,
    down_payment_percentage,
    interest_rate,
    loan_term_years,
    estimated_monthly_payment
) VALUES (
    gen_random_uuid(),   -- id
    $1,                  -- assigned_to (dari JWT)
    $2,                  -- unit_id
    $3,                  -- name
    $4,                  -- nik
    $5,                  -- npwp
    $6,                  -- phone
    $7,                  -- email
    COALESCE($8, 'Visit'),-- source (default 'Visit')
    $9,                  -- budget_range (JSONB)
    COALESCE($10, 'new'),-- status (default 'new')
    $11,                 -- notes
    $12,                 -- property_price
    $13,                 -- down_payment (dihitung: price * percentage / 100)
    $14,                 -- down_payment_percentage
    $15,                 -- interest_rate
    $16,                 -- loan_term_years
    $17                  -- estimated_monthly_payment
)
RETURNING *;
```

1. **Insert into `reminder_schedules` table** (jika reminder disediakan):

```sql
INSERT INTO reminder_schedules (
    id, user_id, lead_id, remind_at, message, is_completed
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5
);
```

1. **Insert into `lead_activities` table** (audit trail):

```sql
INSERT INTO lead_activities (
    id, lead_id, user_id, activity_type, new_status, notes
) VALUES (
    gen_random_uuid(), $1, $2, 'lead_created', $3, $4
);
```

---

### 3.4 PUT /api/v1/leads/:id - Update Lead

**Purpose**: Update existing lead information

**Method**: `PUT`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Lead ID to update |

**Request Body**:

```json
{
  "name": "Eka Bachrudin",
  "phone": "081333108295",
  "email": "lead_user_194@example.com",
  "nik": "8423450220618139",
  "npwp": "081827324017569",
  "source": "Facebook Ads",
  "budget_range": {
    "min": 500000000,
    "max": 1500000000
  },
  "notes": "Tertarik dengan tipe unit cluster baru. Perlu follow up segera via WhatsApp.",
  "status": "surveyed",
  "unit_id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
  "kpr_simulation": {
    "property_price": 1180000000,
    "down_payment_percentage": 16,
    "interest_rate": 8,
    "loan_term_years": 25
  },
  "reminder": {
    "id": "",
    "remind_at": "2026-07-06T17:32:00.000Z",
    "message": "Jangan lupa followup",
    "is_completed": false
  }
}
```

**Request Payload Fields**:

| **Field** | **Type** | **Required** | **Database Column** | **Notes** |
| --- | --- | --- | --- | --- |
| **name** | string | No | `leads.name` | Opsional untuk pembaruan parsial |
| **phone** | string | No | `leads.phone` | Validasi: 10-20 digit angka |
| **email** | string | No | `leads.email` | Validasi: format email valid |
| **nik** | string | No | `leads.nik` | Validasi: wajib 16 digit jika diisi |
| **npwp** | string | No | `leads.npwp` | Validasi: wajib 15-20 digit jika diisi |
| **source** | string | No | `leads.source` | Free text, max 50 chars |
| **unit_id** | UUID | No | `leads.unit_id` | Harus eksis di tabel `units` dan berada di property milik user. Jika field ini **tidak dikirim** (omitted), `unit_id` tetap dipertahankan (existing value dipertahankan). Kirim `null` untuk melepas assign unit dari lead. Jika unit diubah, trigger DB akan mengupdate status unit lama dan baru |
| **budget_range** | object | No | `leads.budget_range` | Format JSONB: `{"min": number, "max": number}` |
| **status** | string | No | `leads.status` | Jika berubah dari status lama, otomatis memicu Activity Log |
| **notes** | string | No | `leads.notes` | Catatan tambahan internal |
| **last_followed_up_at** | datetime | No | `leads.last_followed_up_at` | Waktu interaksi terakhir |
| **next_follow_up_at** | datetime | No | `leads.next_follow_up_at` | Waktu jadwal follow up berikutnya |
| **kpr_simulation** | object | No | — | Objek pembungkus data simulasi KPR |
| `kpr_simulation.property_price` | number | No* | `leads.property_price` | *Wajib jika `kpr_simulation` diisi. Nilai > 0 |
| `kpr_simulation.down_payment_percentage` | number | No* | `leads.down_payment_percentage` | *Wajib jika `kpr_simulation` diisi. Range: 1 - 100 |
| `kpr_simulation.interest_rate` | number | No* | `leads.interest_rate` | *Wajib jika `kpr_simulation` diisi. Nilai > 0 |
| `kpr_simulation.loan_term_years` | number | No* | `leads.loan_term_years` | *Wajib jika `kpr_simulation` diisi. Values: `5, 10, 15, 20, 25` |
| **reminder** | object | No | — | Objek pembungkus data pengingat |
| `reminder.id` | UUID | No | `reminder_schedules.id` | Jika diisi: update reminder lama. Jika kosong/`""`/`null`: insert reminder baru |
| `reminder.remind_at` | datetime | No | `reminder_schedules.remind_at` | Waktu pengingat aktif |
| `reminder.message` | string | No | `reminder_schedules.message` | Isi pesan pengingat |
| `reminder.is_completed` | boolean | No | `reminder_schedules.is_completed` | Default: `false` |

> **Business Rule — unit_id change**: Jika `unit_id` diubah dari unit A ke unit B:
1. Trigger DB akan mengevaluasi status lead terhadap unit A (jika tidak ada lead aktif lain, unit A kembali `available`)
2. Trigger DB akan mengevaluasi status lead terhadap unit B (unit B berubah sesuai status lead)
3. Validasi: unit B tidak boleh berstatus `sold`
4. Validasi: unit B tidak boleh sudah memiliki lead berstatus `booked`
5. Business Rule: Jika status lead berubah menjadi `booked`, semua lead lain di unit tersebut akan di-unassign (unit diklaim eksklusif oleh lead `booked`)
> 

> **Kalkulasi down_payment**: Sama seperti create, `down_payment` dihitung ulang jika `kpr_simulation` disediakan.
> 

**Database Impact - UPDATE Operations**:

1. **Update `leads` table**:

```sql
UPDATE leads SET
    name = COALESCE($2, name),
    phone = COALESCE($3, phone),
    email = COALESCE($4, email),
    nik = COALESCE($5, nik),
    npwp = COALESCE($6, npwp),
    source = COALESCE($7, source),
    unit_id = $8::uuid,
    budget_range = COALESCE($9, budget_range),
    status = COALESCE($10, status),
    notes = COALESCE($11, notes),
    last_followed_up_at = COALESCE($12, last_followed_up_at),
    next_follow_up_at = COALESCE($13, next_follow_up_at),
    property_price = COALESCE($14, property_price),
    down_payment = COALESCE($15, down_payment),
    down_payment_percentage = COALESCE($16, down_payment_percentage),
    interest_rate = COALESCE($17, interest_rate),
    loan_term_years = COALESCE($18, loan_term_years),
    estimated_monthly_payment = COALESCE($19, estimated_monthly_payment),
    updated_at = NOW()
WHERE id = $1
  AND assigned_to = $20
RETURNING *;
```

> **Catatan `$8` (unit_id)**: Nilai `$8` dihitung di sisi aplikasi, bukan dikirim mentah dari request:
> - `unit_id` tidak dikirim (omitted) → `$8` = `unit_id` existing (tidak berubah)
> - `unit_id` bernilai string → `$8` = unit baru
> - `unit_id` = `null` → `$8` = `NULL` (melepas assign unit)

1. **Update/Insert `reminder_schedules`** (jika reminder disediakan):

**Jika `reminder.id` disediakan (update):**

```sql
UPDATE reminder_schedules SET
    remind_at = COALESCE($2, remind_at),
    message = COALESCE($3, message),
    is_completed = COALESCE($4, is_completed)
WHERE id = $1
  AND lead_id = $5;
```

**Jika `reminder.id` null/empty (insert baru):**

```sql
INSERT INTO reminder_schedules (
    id, user_id, lead_id, remind_at, message, is_completed
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5
);
```

1. **Insert activity log if status changed** (dijalankan HANYA jika `status` diubah):

```sql
INSERT INTO lead_activities (
    id, lead_id, user_id, activity_type, old_status, new_status, notes
) VALUES (
    gen_random_uuid(), $1, $2, 'status_change', $3, $4, $5
);
```

**Response** `200`:

```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": {
    "lead": {
      "id": "196524be-3e18-4816-9c52-71365df38af6",
      "name": "Eka Bachrudin",
      "phone": "081333108295",
      "email": "lead_user_194@example.com",
      "status": "surveyed",
      "source": "Facebook Ads",
      "unit_id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
      "budget_range": {
        "min": 500000000,
        "max": 1500000000
      },
      "assigned_to": "785e80d7-8def-42fb-9776-78c6f0c4d59e",
      "assigned_to_name": "Admin User",
      "next_follow_up_at": "2026-07-05T04:27:36.804Z",
      "last_followed_up_at": "2026-04-05T23:14:18.025Z",
      "created_at": "2026-05-30T01:37:16.146Z",
      "updated_at": "2026-07-01T17:32:19.604Z",
      "kpr_simulation": {
        "property_price": "1180000000.00",
        "down_payment_percentage": "16.00",
        "down_payment": "188800000.00",
        "interest_rate": "8.00",
        "loan_term_years": 25,
        "estimated_monthly_payment": "7650242.00"
      },
      "unit": {
        "id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
        "name": "A-2",
        "land_area": 90.00,
        "status": "reserved",
        "block": {
          "id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
          "name": "Block Anggrek"
        },
        "property": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "Grand Permata Residence",
          "city": "Jakarta"
        }
      }
    }
  }
}
```

---

### 3.5 POST /api/v1/leads/:id/activities - Add Activity/Note

**Purpose**: Add activity log or note to lead

**Method**: `POST`

**Request Body**:

```json
{
  "activity_type": "status_change",
  "old_status": "new",
  "new_status": "contacted",
  "notes": "Called customer",
  "metadata": {
    "source_campaign": "Summer_Sale",
    "is_first_time_buyer": true,
    "funnel_score": 85
  }
}
```

**Request Payload Fields**:

| Field | Type | Required | Database Table | Database Column | Values |
| --- | --- | --- | --- | --- | --- |
| `activity_type` | enum | Yes | `lead_activities` | `activity_type` | `status_change`, `note_added`, `call`, `whatsapp` |
| `old_status` | string | No | `lead_activities` | `old_status` | `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` |
| `new_status` | string | No | `lead_activities` | `new_status` | `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` |
| `notes` | string | No | `lead_activities` | `notes` | Activity notes |
| `metadata` | object | No | `lead_activities` | `metadata` | JSONB for additional data |

**Database Impact - INSERT Operation**:

```sql
INSERT INTO lead_activities (
    id, lead_id, user_id, activity_type, old_status, new_status, notes, metadata
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7
)
RETURNING *
```

---

### 3.6 GET /api/v1/properties - Get Properties List (for Filter Dropdown)

**Purpose**: Get list of properties owned by the logged-in user for use in the leads filter dropdown

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `assigned_to` | UUID | No | Filter by assigned sales (defaults to current user from JWT) |

**Response** `200`:

```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Grand Permata Residence",
        "city": "Jakarta"
      },
      {
        "id": "7d43c396-a098-424e-9e4e-cf4ee0742d3e",
        "name": "Derrora",
        "city": "Tangerang"
      }
    ]
  }
}
```

**Data Mapping**:

| Response Field | DB Table | DB Column | Mapping Logic |
| --- | --- | --- | --- |
| `id` | `properties` | `id` | Direct |
| `name` | `properties` | `name` | Direct |
| `city` | `properties` | `city` | Direct |

**Database Query**:

```sql
SELECT id, name, city
FROM properties
WHERE assigned_to = $1
  AND is_active = true
ORDER BY name ASC;
```

> **Note**: Endpoint ini adalah versi sederhana dari `GET /api/v1/properties` (dari API Design Properties V2), dikurangi untuk kebutuhan dropdown filter di halaman Leads. Tidak termasuk pagination karena jumlah property per user umumnya terbatas.
> 

---

### 3.6 DELETE /api/v1/leads/:id - Delete Lead

**Purpose**: Permanently delete a lead and all related records (activities, WhatsApp messages, reminders)

**Method**: `DELETE`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Lead ID to delete |

**Response** `200`:

```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Database Impact - DELETE Operations**:

> ⚠️ **Warning**: This is a permanent deletion operation. All related data will be permanently removed from the database.
> 
1. **Transaction-based deletion** for data integrity:
    - Delete lead activities
    - Delete WhatsApp messages
    - Delete reminder schedules
    - Delete the lead record itself
2. **Security validation**: Lead must exist and belong to the authenticated user (`assigned_to` match)
3. **Foreign key constraints**: Related records are deleted first to maintain referential integrity

---

### 3.7 GET /api/v1/leads/export - Export Leads to Excel

**Purpose**: Export leads to Excel file with the same filtering capabilities as the list endpoint

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | string | No | - | Filter by stage: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` |
| `search` | string | No | - | Search by name or phone number |
| `start_date` | string (ISO date) | No | 1 year ago | Filter leads created after this date |
| `end_date` | string (ISO date) | No | today | Filter leads before this date |
| `property_id` | UUID | No | - | Filter by property ID (resolved via `unit → block → property` join chain) |
| `source` | string | No | - | Filter by source (free text match) |

**Request Example**:

```
GET /api/v1/leads/export?status=new&search=budi&start_date=2025-01-12&end_date=2026-01-12&source=landing_page&property_id=e2696123-cf18-44f7-ba63-481896c08d31
```

**Response**:

- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="leads-export-YYYY-MM-DD.xlsx"`
- **Body**: Binary Excel file (.xlsx format)

**Excel File Specifications**:

- **Format**: .xlsx (Excel 2007+)
- **Worksheet**: Single sheet named “Leads”
- **Header Styling**: Blue background (#4472C4), bold white text, centered alignment
- **Cell Styling**: Borders on all cells, auto-fitted column widths
- **Data Order**: Sorted by `created_at DESC` (newest first)

**Key Excel Columns**:

| Column | Description | Data Source |
| --- | --- | --- |
| **Name** | Lead customer name | `leads.name` |
| **Phone** | Phone number | `leads.phone` |
| **Email** | Email address | `leads.email` |
| **NIK** | National ID number | `leads.nik` |
| **NPWP** | Tax ID number | `leads.npwp` |
| **Status** | Lead stage | `leads.status` |
| **Source** | Lead source | `leads.source` |
| **Property** | Property name | `properties.name` (via join) |
| **Property Type** | Property type | `properties.property_type` |
| **Budget Range** | Min-max budget | `leads.budget_range` (JSONB) |
| **Property Price** | Property price | `leads.property_price` |
| **Down Payment %** | Down payment percentage | `leads.down_payment_percentage` |
| **Interest Rate %** | KPR interest rate | `leads.interest_rate` |
| **Loan Term (Years)** | Loan duration | `leads.loan_term_years` |
| **Est. Monthly Payment** | Calculated monthly payment | `leads.estimated_monthly_payment` |
| **Notes** | Additional notes | `leads.notes` |

> **Note**: Budget range and monetary values are formatted in Indonesian Rupiah (Rp) with locale-specific formatting.
> 

**Database Query**:

Similar to `GET /api/v1/leads` but includes additional fields for export:

```sql
SELECT
    l.id,
    l.name,
    l.phone,
    l.email,
    l.nik,
    l.npwp,
    l.status,
    l.source,
    l.property_id,
    l.budget_range,
    l.notes,
    l.property_price,
    l.down_payment_percentage,
    l.interest_rate,
    l.loan_term_years,
    l.estimated_monthly_payment,
    l.created_at,
    l.updated_at,
    u.full_name AS assigned_to_name,
    p.name AS property_name,
    p.property_type,
    p.price AS property_price_detail
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LEFT JOIN properties p ON l.property_id = p.id
WHERE (l.assigned_to = $1 OR $2::boolean)             -- RBAC: $1 = User ID dari JWT; $2 = true (Admin/Supervisor) => semua leads, false (Sales) => lead sendiri
    AND l.created_at >= $3                            -- Start Date (Default: 1 tahun lalu)
    AND l.created_at <= $4                            -- End Date (Default: Hari ini)
    AND ($5::varchar(50) IS NULL OR l.status = $5)   -- Optional: Status filter
    AND ($6::text IS NULL OR l.name ILIKE '%' || $6 || '%' OR l.phone ILIKE '%' || $6 || '%')  -- Optional: Search
    AND ($7::uuid IS NULL OR p.id = $7)              -- Optional: Property filter
    AND ($8::text IS NULL OR l.source ILIKE '%' || $8 || '%')  -- Optional: Source filter
ORDER BY l.created_at DESC;
```

**Security Considerations**:

- Visibility mengikuti RBAC yang sama dengan `GET /api/v1/leads`: Admin/Supervisor export SEMUA leads; Sales hanya leads milik sendiri (`assigned_to` = current user)
- Same security model as `GET /api/v1/leads` endpoint
- File download requires valid authentication token

---

## 4. Status Values

### 4.1 Lead Status

| Value | Label (ID) | Label (EN) | Color |
| --- | --- | --- | --- |
| `new` | Baru Masuk | New | Gray (#6B7280) |
| `contacted` | Dikontak | Contacted | Blue (#3B82F6) |
| `surveyed` | Survey | Surveyed | Purple (#8B5CF6) |
| `negotiating` | Negosiasi | Negotiating | Orange (#F59E0B) |
| `booked` | Booking Fee | Booked | Cyan (#06B6D4) |
| `closed` | Closing | Closed | Green (#10B981) |
| `cancelled` | Batal | Cancelled | Red (#EF4444) |

### 4.2 Unit Status (Auto-Update via DB Trigger)

| Value | Description |
| --- | --- |
| `available` | Unit tersedia untuk dijual |
| `reserved` | Unit sedang diproses / dinegosiasi |
| `booked` | Unit sudah dibayar booking fee |
| `sold` | Unit sudah terjual akad |

### Unit Status Auto-Update Reference (via DB Trigger)

```
Lead Status          │  Unit Status   │  Alasan
─────────────────────┼────────────────┼──────────────────────────────────
new                  │  reserved      │  Minat awal, tandai unit
contacted            │  reserved      │  Komunikasi awal
surveyed             │  reserved      │  Sudah lihat lokasi
negotiating          │  reserved      │  Masih negosiasi, belum bayar
booked               │  booked        │  Sudah bayar booking fee
closed               │  sold          │  Akad selesai
cancelled            │  available*    │  Kembali tersedia (jika tidak ada lead aktif lain)
```

### 4.3 WhatsApp Message Direction

| Value | Description |
| --- | --- |
| `incoming` | Pesan dari lead |
| `outgoing` | Pesan dari sales |

### 4.4 WhatsApp Message Status

| Value | Description |
| --- | --- |
| `sent` | Pesan terkirim ke server |
| `delivered` | Pesan diterima di perangkat |
| `read` | Pesan sudah dibaca |
| `failed` | Gagal mengirim |

### 4.5 Activity Type

| Value | Description |
| --- | --- |
| `status_change` | Perubahan status lead |
| `note_added` | Penambahan catatan |
| `call` | Panggilan telepon |
| `whatsapp` | Aktivitas WhatsApp |

---

## 5. Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "phone": ["Phone must be 10-20 digits"]
    }
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request validation gagal |
| `UNAUTHORIZED` | 401 | Tidak ada token valid |
| `FORBIDDEN` | 403 | Lead bukan milik user (assigned_to tidak match) |
| `NOT_FOUND` | 404 | Lead tidak ditemukan |
| `UNIT_NOT_FOUND` | 404 | Unit tidak ditemukan |
| `UNIT_SOLD` | 409 | Unit sudah terjual, tidak bisa di-assign ke lead |
| `UNIT_BOOKED` | 409 | Unit sudah ada lead berstatus `booked` |
| `UNIT_OWNERSHIP_MISMATCH` | 403 | Unit berada di property yang bukan milik user |

---

## 6. Relationship Diagram (Leads Context)

```
┌─────────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────┐
│    users    │     │   units   │     │  blocks   │     │  properties  │
├─────────────┤     ├───────────┤     ├───────────┤     ├──────────────┤
│ id (PK)     │     │ id (PK)   │     │ id (PK)   │     │ id (PK)      │
│ full_name   │     │ block_id──┼──┐  │ property_id┼──┐  │ name         │
│ ...         │     │ name      │  │  │ name      │  │  │ city         │
└──────┬──────┘     │ status    │  │  └───────────┘  │  │ assigned_to──┼──┐
       │            └─────┬─────┘  │                 │  └──────────────┘  │
       │                  │        │                 │                     │
       │            ┌─────┴─────┐  │                 │                     │
       │            │   leads   │  │                 │                     │
       │            ├───────────┤  │                 │                     │
       ├───────────▶│assigned_to│  │                 │                     │
       │            │ unit_id───┼──┘                 │                     │
       │            │ name      │                    │                     │
       │            │ status    │                    │                     │
       │            │ ...       │                    │                     │
       │            └───────────┘                    │                     │
       │                  │                         │                     │
       │            ┌─────┴──────────┐              │                     │
       │            │lead_activities │              │                     │
       │            ├────────────────┤              │                     │
       ├───────────▶│ user_id        │              │                     │
       │            │ lead_id        │              │                     │
       │            └────────────────┘              │                     │
       │                  │                         │                     │
       │            ┌─────┴──────────────┐         │                     │
       │            │ whatsapp_messages  │         │                     │
       │            ├────────────────────┤         │                     │
       ├───────────▶│ user_id            │         │                     │
       │            │ lead_id            │         │                     │
       │            └────────────────────┘         │                     │
       │                  │                         │                     │
       │            ┌─────┴──────────────┐         │                     │
       │            │reminder_schedules  │         │                     │
       │            ├────────────────────┤         │                     │
       ├───────────▶│ user_id            │         │                     │
       │            │ lead_id            │         │                     │
       │            └────────────────────┘         │                     │
       │                                            │                     │
       └────────────────────────────────────────────┘                     │
                                                          ◀──────────────┘
                                                    (properties.assigned_to → users.id)
```

**Join Chain untuk Lead + Unit Info**:

```
leads.unit_id → units.id → units.block_id → blocks.id → blocks.property_id → properties.id
```

---

## 7. API Summary Table

| # | Method | Endpoint | Purpose |
| --- | --- | --- | --- |
| 1 | `GET` | `/api/v1/leads` | List leads dengan pagination & filter |
| 2 | `GET` | `/api/v1/leads/:id` | Detail lead + activities, WA messages, reminders |
| 3 | `POST` | `/api/v1/leads` | Buat lead baru (opsional KPR & reminder) |
| 4 | `PUT` | `/api/v1/leads/:id` | Update lead (opsional KPR & reminder) |
| 5 | `POST` | `/api/v1/leads/:id/activities` | Tambah activity log / note |
| 6 | `GET` | `/api/v1/properties` | List properties untuk dropdown filter (simplified) |
| 7 | `DELETE` | `/api/v1/leads/:id` | Hapus lead secara permanen beserta data terkait |
| 8 | `GET` | `/api/v1/leads/export` | Export leads ke file Excel (.xlsx) |

---

## 8. Related Documents

- [BRD - Sales Force Automation System](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f)
- [FSD - Sales Force Automation System](https://www.notion.so/FSD-Sales-Force-Automation-System-2e4b2c42720c818093ffc3728d4807a9)
- [ERD - Sales Force Automation System](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954)
- [API Design - Properties V2](https://www.notion.so/API-Design-Properties-V2-2e4b2c42720c818093ffc3728d4807a9)
- [UISD - Dashboard Penjualan](https://www.notion.so/UI-Specification-Dashboard-Penjualan-Personal-CRM-2e5b2c42720c8194b8b1c3ab372365fe)

---

*Document Version: 2.0 | Last Updated: 2026-07-14*