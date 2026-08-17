# API Design - Leads

---

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Leads Management |
| **Version** | 1.1 |
| **Last Updated** | 2026-07-02 |
| **Related Docs** | [BRD](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f) |

---

## 2. Page Overview

The **Leads Module** consists of two main views:

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
| `status` | string | No | - | Filter by stage: `new`, `contacted`, `surveyed`, `negotiating`, `closed`, `cancelled` |
| `search` | string | No | - | Search by name or phone number |
| `start_date` | string (ISO date) | No | 1 year ago | Filter leads created after this date |
| `end_date` | string (ISO date) | No | today | Filter leads created before this date |
| `property_id` | UUID | No | - | Filter by property ID |
| `source` | string | No | - | Filter by source: `landing_page`, `whatsapp`, `manual` |
| `sort_by` | string | No | `created_at` | Sort field: `created_at`, `name`, `status`, `next_follow_up_at` |
| `sort_order` | string | No | `desc` | Sort order: `asc`, `desc` |

**Request Example**:

```
GET /api/v1/leads?page=1&limit=50&status=new&search=budi&start_date=2025-01-12&end_date=2026-01-12&source=landing_page&sort_by=created_at&sort_order=desc
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
        "property": {
          "id": "e2696123-cf18-44f7-ba63-481896c08d31",
          "name": "Brassia"
        },
        "created_at": "2026-06-28T05:41:44.687Z",
        "updated_at": "2026-07-01T05:43:59.004Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 300,
      "pages": 15
    }
  }
}
```

**Data Mapping**:

| **Response Field** | **Database Table** | **Database Column** | **Mapping & Transformation Logic** |
| --- | --- | --- | --- |
| **`leads`** |  |  | *Array of lead items mapped from query results* |
| `leads[].id` | `leads` | `id` | Direct mapping. |
| `leads[].name` | `leads` | `name` | Direct mapping. |
| `leads[].phone` | `leads` | `phone` | Direct mapping. |
| `leads[].status` | `leads` | `status` | Direct mapping (Enum / String). |
| `leads[].source` | `leads` | `source` | Direct mapping (Enum / String). |
| `leads[].property` | — | — | Object wrapper. `null`/`undefined` jika `property_id` kosong. |
| `leads[].property.id` | `properties` | `id` | Diambil via `LEFT JOIN` menggunakan `l.property_id = p.id`. |
| `leads[].property.name` | `properties` | `name` | Diambil via `LEFT JOIN` menggunakan `l.property_id = p.id`. |
| `leads[].created_at` | `leads` | `created_at` | Direct mapping (Timestamp ISO). |
| `leads[].updated_at` | `leads` | `updated_at` | Direct mapping (Timestamp ISO). |
| **`pagination`** | — | — | *Object untuk kontrol halaman data* |
| `pagination.page` | — | — | Berasal dari query parameter input (default: `1`). |
| `pagination.limit` | — | — | Berasal dari query parameter input (default: `50`). |
| `pagination.total` | — | — | Hasil agregasi dari query `SELECT COUNT(DISTINCT l.id)`. |
| `pagination.pages` | — | — | Kalkulasi matematika: `Math.ceil(total / limit)`. |

**Database Query**:

```sql
SELECT
    l.id,
    l.name,
    l.phone,
    l.email,
    l.status,
    l.source,
    l.property_id,
    l.property_price,
    l.budget_range,
    l.down_payment_percentage,
    l.interest_rate,
    l.loan_term_years,
    l.estimated_monthly_payment,
    l.assigned_to,
    u.full_name as assigned_to_name,
    l.next_follow_up_at,
    l.created_at,
    l.updated_at,
    p.id as property_detail_id,
    p.name as property_name,
    p.property_type,
    p.price as property_detail_price,
    p.city
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LEFT JOIN properties p ON l.property_id = p.id
WHERE l.assigned_to = $1                              -- Wajib: Filter User ID
    AND l.created_at >= $2                            -- Wajib: Start Date (Default: 1 tahun lalu)
    AND l.created_at <= $3                            -- Wajib: End Date (Default: Hari ini)
    AND l.status = $4                                 -- Opsional: Jika status diisi
    AND (l.name ILIKE $5 OR l.phone ILIKE $6)         -- Opsional: Jika search diisi (Format: %keyword%)
    AND l.property_id = $7                            -- Opsional: Jika property_id diisi
    AND l.source = $8                                 -- Opsional: Jika source diisi
ORDER BY l.updated_at DESC                            -- Dinamis di kode (Kolom & Order digabung langsung)
LIMIT $9 OFFSET $10                                   -- Dinamis berdasarkan limit dan offset pagination
```

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
      "property_id": "e2696123-cf18-44f7-ba63-481896c08d31",
      "budget_range": {
        "min": 500000000,
        "max": 1500000000
      },
      "kpr_simulation": {
        "property_price": "510000000.00",
        "down_payment_percentage": "27.00",
        "down_payment": 137700000,
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
      "property": {
        "id": "e2696123-cf18-44f7-ba63-481896c08d31",
        "name": "Brassia",
        "property_type": "Rumah",
        "price": null,
        "city": null,
        "province": null
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
        "message_type": "outgoing",
        "content": "Halo, ada info terbaru...",
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
        "created_at": "2026-07-01T05:43:59.004Z",
        "updated_at": "2026-07-01T05:43:59.004Z"
      }
    ]
  }
}
```

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
| **lead.budget_range** | `leads` | `budget_range` | JSONB field |
| **lead.kpr_simulation** | `leads` | `property_price`, `down_payment_percentage`, `interest_rate`, `loan_term_years`, `estimated_monthly_payment` | Aggregated into object, `down_payment` calculated dynamically in code. |
| **lead.assigned_to** | `leads` | `assigned_to` | Direct mapping |
| **lead.assigned_to_name** | `users` | `full_name` | JOIN from `users` via `assigned_to` |
| **lead.notes** | `leads` | `notes` | Direct mapping (nullable) |
| **lead.property** | `properties` | *Multiple Columns* | JOIN via `property_id`. Fields: `id` (via `property_id_detail`), `name` (via `property_name`), `property_type`, `price` (via `property_price_detail`), `city`, `province`. |
| **activities[]** | `lead_activities` | *Multiple Columns* | SELECT WHERE `lead_id = $1` JOIN `users.full_name` AS `user_name` ORDER BY `created_at DESC` |
| **whatsapp_messages[]** | `whatsapp_messages` | *Multiple Columns* | SELECT WHERE `lead_id = $1` ORDER BY `sent_at DESC`. Mapped fields: `id`, `lead_id`, `message_type`, `content`, `sent_at`, `created_at`. |
| **reminders[]** | `reminder_schedules` | *Multiple Columns* | SELECT WHERE `lead_id = $1 AND is_completed = false` ORDER BY `remind_at ASC` |

**Database Query**:

```sql
-- 1. Main Lead Detail Query (With Properties and Users JOIN)
-- Menyesuaikan dengan alias kolom dan filter security berdasarkan assigned_to ($2)
SELECT
    l.*,
    u.full_name as assigned_to_name,
    p.id as property_id_detail,
    p.name as property_name,
    p.property_type,
    p.price as property_price_detail,
    p.city,
    p.province
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LEFT JOIN properties p ON l.property_id = p.id
WHERE l.id = $1 AND l.assigned_to = $2;

-- 2. Activities Query
-- Mengambil riwayat aktivitas leads beserta nama user yang melakukan aksi
SELECT la.*, u.full_name as user_name
FROM lead_activities la
LEFT JOIN users u ON la.user_id = u.id
WHERE la.lead_id = $1
ORDER BY la.created_at DESC;

-- 3. WhatsApp Messages Query
-- Mengambil riwayat pesan WA (mencakup kolom message_type dan content sesuai mapping code)
SELECT id, lead_id, message_type, content, sent_at, created_at
FROM whatsapp_messages
WHERE lead_id = $1
ORDER BY sent_at DESC;

-- 4. Reminders Query
-- Mengambil jadwal pengingat yang belum selesai (is_completed = false)
SELECT id, user_id, lead_id, remind_at, message, is_completed, created_at, updated_at
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
  "property_id": "e2696123-cf18-44f7-ba63-481896c08d31",
  "budget_range": {
    "min": 1300000000,
    "max": 1800000000
  },
  "source": "manual",
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
| **name** | string | **Yes** | leads | name | Max 100 chars, cannot be empty/whitespace. |
| **phone** | string | **Yes** | leads | phone | 10-20 digits, numeric only format. |
| **email** | string | No | leads | email | Valid email format if provided. |
| **nik** | string | No | leads | nik | Must be exactly 16 digits if provided. |
| **npwp** | string | No | leads | npwp | Must be 15-20 digits if provided. |
| **source** | enum | No | leads | source | Values: `landing_page`, `whatsapp`, `manual`, `visit`.
*(Note: Code defaults to `visit` if empty)* |
| **property_id** | UUID | No | leads | property_id | Must exist in `properties` table. |
| **budget_range** | object | No | leads | budget_range | JSONB object containing `{"min": number, "max": number}` |
| **status** | enum | No | leads | status | Values: `new`, `contacted`, `surveyed`, `negotiating`, `closed`, `cancelled` *(Default: `new`)* |
| **notes** | string | No | leads | notes | Free text. |
| **kpr_simulation** | object | No | - | - | Parent object for KPR data. |
| **kpr_simulation.property_price** | number | No* | leads | property_price | Required if `kpr_simulation` present. Numeric $> 0$. |
| **kpr_simulation.down_payment_percentage** | number | No* | leads | down_payment_percentage | Required if `kpr_simulation` present. Value range: `10 - 50`. |
| **kpr_simulation.interest_rate** | number | No* | leads | interest_rate | Required if `kpr_simulation` present. Numeric $> 0$. |
| **kpr_simulation.loan_term_years** | number | No* | leads | loan_term_years | Required if `kpr_simulation` present. Allowed values: `5, 10, 15, 20, 25`. |
| **reminder** | object | No | - | - | Parent object for scheduler data. |
| **reminder.remind_at** | datetime | No | reminder_schedules | remind_at | ISO Datetime string. Must be a future date. |
| **reminder.message** | string | No | reminder_schedules | message | Free text. |
| **reminder.is_completed** | boolean | No | reminder_schedules | is_completed | Boolean flag *(Default: `false`)*. |

**Response**:

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
      "source": "visit",
      "property_id": "e2696123-cf18-44f7-ba63-481896c08d31",
      "property_price": "1500000000.00",
      "budget_range": {
        "max": 1800000000,
        "min": 1300000000
      },
      "assigned_to": "48e8514d-1ff0-46e7-8581-9831f11adb11",
      "next_follow_up_at": null,
      "created_at": "2026-07-01T06:33:32.075Z",
      "updated_at": "2026-07-01T06:33:32.075Z",
      "property": {
        "id": "e2696123-cf18-44f7-ba63-481896c08d31",
        "name": "Brassia",
        "property_type": "Rumah",
        "price": null,
        "city": null
      },
      "down_payment_percentage": "20.00",
      "interest_rate": "11.00",
      "loan_term_years": 20,
      "estimated_monthly_payment": "12386261.00"
    }
  }
}
```

**Database Impact - INSERT Operations**:

1. **Insert into `leads` table**:

```sql
INSERT INTO leads (
    id, assigned_to, name, nik, npwp, phone, email, source,
    property_id, budget_range, status, notes,
    property_price, down_payment_percentage, interest_rate, loan_term_years,
    estimated_monthly_payment
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
)
RETURNING *;
```

1. **Insert into `reminder_schedules` table** (if reminder provided):

```sql
INSERT INTO reminder_schedules (id, user_id, lead_id, remind_at, message, is_completed)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5);
```

1. **Insert into `lead_activities` table** (audit trail):

```sql
INSERT INTO lead_activities (
    id, 
    lead_id, 
    user_id, 
    activity_type, 
    new_status, 
    notes
) VALUES (
    gen_random_uuid(), 
    $1, 
    $2, 
    $3, 
    $4, 
    $5
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
  "property_id": "4332ad3a-27c7-498e-b355-d9db7921f782",
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
| **name** | string | No | `leads.name` | Opsional untuk pembaruan parsial. |
| **phone** | string | No | `leads.phone` | Validasi: 10-20 digit angka. |
| **email** | string | No | `leads.email` | Validasi: format email valid. |
| **nik** | string | No | `leads.nik` | Validasi: wajib 16 digit. |
| **npwp** | string | No | `leads.npwp` | Validasi: wajib 15-20 digit. |
| **source** | string | No | `leads.source` | Contoh: "Facebook Ads", "WhatsApp", dll. |
| **property_id** | UUID | No | `leads.property_id` | Harus eksis di tabel `properties`. Bisa dikirim `null` untuk mengosongkan nilai. |
| **budget_range** | object | No | `leads.budget_range` | Format JSONB: `{"min": number, "max": number}`. |
| **status** | string | No | `leads.status` | Jika berubah dari status lama, otomatis memicu *Activity Log*. |
| **notes** | string | No | `leads.notes` | Catatan tambahan internal. |
| **last_followed_up_at** | datetime | No | `leads.last_followed_up_at` | Waktu interaksi terakhir. |
| **next_follow_up_at** | datetime | No | `leads.next_follow_up_at` | Waktu jadwal follow up berikutnya. |
| **kpr_simulation** | object | No | - | Objek pembungkus data simulasi KPR. |
| kpr_simulation.
property_price | number | No* | `leads.property_price` | *Wajib jika `kpr_simulation` diisi. Nilai harus > 0. |
| kpr_simulation.
down_payment_percentage | number | No* | `leads.down_payment_percentage` | *Wajib jika `kpr_simulation` diisi. Rentang nilai: 1 - 100. |
| kpr_simulation.
interest_rate | number | No* | `leads.interest_rate` | *Wajib jika `kpr_simulation` diisi. Nilai harus > 0. |
| kpr_simulation.
loan_term_years | number | No* | `leads.loan_term_years` | *Wajib jika `kpr_simulation` diisi. Pilihan nilai: `5, 10, 15, 20, 25`. |
| **reminder** | object | No | - | Objek pembungkus data pengingat (*reminder*). |
| **reminder.id** | UUID | No | `reminder_schedules.id` | Jika diisi / ada nilainya: Update data *reminder* lama.
Jika kosong/`""`/`null`: Insert data *reminder* baru. |
| **reminder.remind_at** | datetime | No | `reminder_schedules.remind_at` | Waktu pengingat aktif. |
| **reminder.message** | string | No | `reminder_schedules.message` | Isi pesan pengingat. |
| **reminder.is_completed** | boolean | No | `reminder_schedules.is_completed` | Status penyelesaian *reminder*. Default: `false`. |

*If any kpr_simulation field is provided, all required KPR fields are processed

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
    property_id = CASE             
      WHEN $8::uuid IS NULL THEN NULL
      ELSE COALESCE($8::uuid, property_id)
    END,
    budget_range = COALESCE($9, budget_range),
    status = COALESCE($10, status),
    notes = COALESCE($11, notes),
    last_followed_up_at = COALESCE($12, last_followed_up_at),
    next_follow_up_at = COALESCE($13, next_follow_up_at),
    property_price = COALESCE($14, property_price),
    down_payment_percentage = COALESCE($15, down_payment_percentage),
    interest_rate = COALESCE($16, interest_rate),
    loan_term_years = COALESCE($17, loan_term_years),
    estimated_monthly_payment = COALESCE($18, estimated_monthly_payment),
    updated_at = NOW()
WHERE id = $1
RETURNING *;
```

1. **Update `reminder_schedules` table** (jika reminder disediakan):

**Jika [reminder.id](http://reminder.id) disediakan (update reminder yang ada)**:

```sql
UPDATE reminder_schedules SET
    remind_at = COALESCE($2, remind_at),
    message = COALESCE($3, message),
    is_completed = COALESCE($4, is_completed)
WHERE id = $1
AND lead_id = $5;
```

**Jika [reminder.id](http://reminder.id) null (insert reminder baru)**:

```sql
INSERT INTO reminder_schedules (
    id, user_id, lead_id, remind_at, message, is_completed
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5
);
```

1. **Insert activity log if status changed**:

```sql
-- Executed ONLY IF dto.status is provided AND the increment is different from the current status in the database
INSERT INTO lead_activities (
    id, lead_id, user_id, activity_type, old_status, new_status, notes
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6
);
```

**Response**:

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
      "property_id": "4332ad3a-27c7-498e-b355-d9db7921f782",
      "property_price": "1180000000.00",
      "budget_range": {
        "max": 1500000000,
        "min": 500000000
      },
      "assigned_to": "785e80d7-8def-42fb-9776-78c6f0c4d59e",
      "assigned_to_name": "Admin User",
      "next_follow_up_at": "2026-07-05T04:27:36.804Z",
      "last_followed_up_at": "2026-04-05T23:14:18.025Z",
      "created_at": "2026-05-30T01:37:16.146Z",
      "updated_at": "2026-07-01T17:32:19.604Z",
      "property": {
        "id": "4332ad3a-27c7-498e-b355-d9db7921f782",
        "name": "Brassia",
        "property_type": "Rumah",
        "price": null,
        "city": null
      },
      "down_payment_percentage": "16.00",
      "interest_rate": "8.00",
      "loan_term_years": 25,
      "estimated_monthly_payment": "7650242.00"
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
  "activity_type": "status_change" || "note_added" || "call" || "whatsapp" || "lead_created";
  "old_status": 'new' || 'contacted' || 'surveyed' || 'negotiating' || 'closed' || 'cancelled';
  "new_status": 'new' || 'contacted' || 'surveyed' || 'negotiating' || 'closed' || 'cancelled';;
  "notes":"This lead is intresting";
  "metadata": { // Metadata dynamic value
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
| `old_status` | string | No | `lead_activities` | `old_status` | Previous status (for status_change) |
| `new_status` | string | No | `lead_activities` | `new_status` | New status (for status_change) |
| `notes` | string | No | `lead_activities` | `notes` | Activity notes |
| `metadata` | object | No | `lead_activities` | `metadata` | JSONB for additional data |

**Database Impact - INSERT Operation**:

```sql
INSERT INTO lead_activities (id, lead_id, user_id, activity_type, old_status, new_status, notes, metadata)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
RETURNING *
```

---

### 3.6 GET /api/v1/properties - Get Properties List (for Filter Dropdown)

**Purpose**: Get list of properties for filter dropdown

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `assigned_to` | UUID | No | Filter by assigned sales (defaults to current user) |

**Response**:

```json
{
    "success": true,
    "data": {
        "properties": [
            {
                "id": "4332ad3a-27c7-498e-b355-d9db7921f782",
                "name": "Brassia",
                "property_type": "Rumah",
                "created_at": "2026-06-30T14:33:15.179Z"
            },
            {
                "id": "7d43c396-a098-424e-9e4e-cf4ee0742d3e",
                "name": "Derrora",
                "property_type": "Rumah 2 Lantai",
                "created_at": "2026-06-30T14:33:29.301Z"
            }
        ]
    }
}
```

---

## 4. Status Values

| Value | Label (ID) | Label (EN) | Color |
| --- | --- | --- | --- |
| `new` | Baru Masuk | New | Gray (#6B7280) |
| `contacted` | Dikontak | Contacted | Blue (#3B82F6) |
| `surveyed` | Survey | Surveyed | Purple (#8B5CF6) |
| `negotiating` | Negosiasi | Negotiating | Orange (#F59E0B) |
| `closed` | Closing | Closed | Green (#10B981) |
| `cancelled` | Batal | Cancelled | Red (#EF4444) |

---

## 8. Related Documents

- [BRD - Sales Force Automation System](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f)
- [FSD - Sales Force Automation System](https://www.notion.so/FSD-Sales-Force-Automation-System-2e4b2c42720c818093ffc3728d4807a9)
- [ERD - Sales Force Automation System](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954)
- [UISD - Dashboard Penjualan](https://www.notion.so/UI-Specification-Dashboard-Penjualan-Personal-CRM-2e5b2c42720c8194b8b1c3ab372365fe)

---

*Document Version: 1.1 | Last Updated: 2026-07-02*