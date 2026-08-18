# API Design - Kanban V2

# API Design - Kanban V2

---

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Pipeline Kanban Board |
| **Version** | 2.0 |
| **Last Updated** | 2026-07-20 |
| **Related Docs** | [BRD](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f) | [ERD](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954) | [API Design - Properties V2](https://www.notion.so/API-Design-Properties-V2-2e4b2c42720c8194b8b1c3ab372365fe) |

---

## 2. Page Overview

The **Pipeline Kanban Board** is the core feature of the CRM Dashboard that enables sales to visualize and manage leads through different stages of the sales process.

### 2.1 Route & Access

- **Route**: `/dashboard/pipeline`
- **Authentication**: Required (JWT token via httpOnly cookie)
- **Authorization**: Sales users can only view their own assigned leads

### 2.2 Key Features

- Horizontal scrollable kanban board with 7 stages
- Drag & drop lead management between stages
- Real-time lead count per stage
- Lead detail slide-over panel
- Optimistic UI updates for smooth UX

---

## 3. API Design

### 3.1 GET /api/v1/pipeline - Get Pipeline Data

**Purpose**: Retrieve all leads grouped by pipeline stage for kanban board rendering

**Method**: `GET`

**Authentication**: Required (Bearer token via httpOnly cookie)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `page` | number | No | 1 | Page number for each stage (starts from 1) |
| `limit` | number | No | 20 | Max leads per stage (max 50) |
| `search` | string | No | - | Search by lead name (case-insensitive) |

**Request Example**:

```
GET /api/v1/pipeline?page=1&limit=10
GET /api/v1/pipeline?page=1&limit=20&search=ahmad

Authorization: Bearer <jwt_token>
Cookie: auth_token=<httpOnly_cookie>
```

**Response Structure**:

```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "id": "new",
        "name": "Baru Masuk",
        "name_en": "New",
        "order": 1,
        "color": "#6B7280",
        "lead_count": 107,
        "leads": [
          {
            "id": "ae135258-c2fd-49bb-83ae-b6f3e11f6b57",
            "name": "Ahmad Fauzi",
            "unit_name": "A-1",
            "block_name": "Block Anggrek",
            "property_name": "Cluster Harmony",
            "next_follow_up_at": "2026-05-27T12:57:12.415Z",
            "created_at": "2026-07-02T09:01:57.094Z",
            "updated_at": "2026-07-02T09:01:57.094Z"
          }
        ]
      }
    ],
    "meta": {
      "total_leads": 303,
      "stages_summary": {
        "new": 107,
        "contacted": 59,
        "surveyed": 59,
        "negotiating": 18,
        "booked": 12,
        "closed": 29,
        "cancelled": 31
      }
    }
  }
}
```

**Data Mapping**:

| Response Field | Database Table | Database Column | Mapping Logic |
| --- | --- | --- | --- |
| `stages[].id` | - | - | Hardcoded enum values (`new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled`) |
| `stages[].name` | - | - | Static labels (Indonesian) |
| `stages[].name_en` | - | - | Static labels (English) |
| `stages[].color` | - | - | Static hex colors |
| `stages[].order` | - | - | Static order 1-7 |
| `stages[].lead_count` | `leads` | `COUNT(*)` | COUNT filtered by `status` AND `assigned_to` = current_user (ditambah filter `search` jika ada) |
| `stages[].leads[].id` | `leads` | `id` | Direct mapping |
| `stages[].leads[].name` | `leads` | `name` | Direct mapping |
| `stages[].leads[].unit_name` | `units` | `name` | LEFT JOIN dari `units` via `unit_id`, return `undefined` jika null |
| `stages[].leads[].block_name` | `blocks` | `name` | LEFT JOIN dari `blocks` via `units.block_id`, return `undefined` jika null |
| `stages[].leads[].property_name` | `properties` | `name` | LEFT JOIN dari `properties` via `blocks.property_id`, return `undefined` jika null |
| `stages[].leads[].next_follow_up_at` | `leads` | `next_follow_up_at` | Direct mapping, return `undefined` jika null |
| `stages[].leads[].created_at` | `leads` | `created_at` | Direct mapping |
| `stages[].leads[].updated_at` | `leads` | `updated_at` | Direct mapping |

**Database Query**:

```sql
SELECT
    l.id,
    l.name,
    l.next_follow_up_at,
    l.created_at,
    l.updated_at,
    u.name AS unit_name,
    b.name AS block_name,
    p.name AS property_name
FROM leads l
LEFT JOIN units u ON l.unit_id = u.id
LEFT JOIN blocks b ON u.block_id = b.id
LEFT JOIN properties p ON b.property_id = p.id
WHERE l.status = $1                         -- 'new', 'contacted', 'surveyed', 'negotiating', 'booked', 'closed', 'cancelled'
  AND l.assigned_to = $2                    -- current user ID
  AND ($3::text IS NULL OR l.name ILIKE '%' || $3 || '%')  -- optional search
ORDER BY l.updated_at DESC
LIMIT $4 OFFSET $5;
```

---

### 3.2 PUT /api/v1/leads/:id/status - Update Lead Status (Drag & Drop)

**Purpose**: Update lead status when dragging between kanban columns

**Method**: `PUT`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Lead ID to update |

**Request Body**:

```json
{
  "status": "contacted",
  "reason": "Customer responded to WhatsApp"
}
```

**Request Payload Fields**:

| Field | Type | Required | Database Table | Database Column | Validation |
| --- | --- | --- | --- | --- | --- |
| `status` | enum | Yes | `leads` | `status` | Must be: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` |
| `reason` | string | No* | `lead_activities` | `notes` | Required when status=`cancelled` |
- Required when moving to “cancelled” stage

**Validation Rules**:
- `status`: Wajib, harus salah satu dari 7 nilai enum yang valid
- `reason`: Wajib hanya jika `status` = `cancelled`. Untuk status lain, field ini opsional dan akan diabaikan
- Lead harus ada dan `assigned_to` = current user
- Jika lead memiliki `unit_id`, perubahan status akan memicu DB trigger yang mengubah status unit secara otomatis (lihat [Unit Status Auto-Update Reference](about:blank#42-unit-status-auto-update-via-db-trigger))

**Database Impact - UPDATE Operations**:

1. **Update `leads` table**:

```sql
UPDATE leads
SET
    status = $2,
    updated_at = NOW()
WHERE id = $1 AND assigned_to = $3
RETURNING *;
```

1. **Insert activity log (audit trail)**:

```sql
INSERT INTO lead_activities (id, lead_id, user_id, activity_type, old_status, new_status, notes)
VALUES (gen_random_uuid(), $1, $2, 'status_change', $3, $4, $5)
RETURNING *;
```

1. **Handle `cancelled` status**: If status is `cancelled`, additionally require cancellation reason:

```sql
-- The reason field is stored in lead_activities.notes
-- This is handled at application layer validation
-- $5 berisi reason jika status='cancelled', atau NULL untuk status lain
-- Untuk status non-cancelled, notes diisi: 'Status changed from {old_status} to {new_status}'
```

1. **Unit status auto-update**: Handled by database trigger — no additional application-level query needed.

**Response Structure**:

```json
{
  "success": true,
  "message": "Lead status updated successfully",
  "data": {
    "lead": {
      "id": "ae135258-c2fd-49bb-83ae-b6f3e11f6b57",
      "name": "Ahmad Fauzi",
      "phone": "081234567890",
      "email": "ahmad.fauzi@email.com",
      "status": "contacted",
      "source": "Visit",
      "unit_id": "e5f6a7b8-c9d0-1234-efab-567890123456",
      "property_price": "950000000.00",
      "budget_range": {
        "min": 800000000,
        "max": 1200000000
      },
      "down_payment_percentage": "20.00",
      "interest_rate": "7.00",
      "loan_term_years": 20,
      "estimated_monthly_payment": "6175000.00",
      "assigned_to": "14d4efb7-16a1-41cc-b4a8-609a669abdea",
      "next_follow_up_at": "2026-01-15T14:00:00Z",
      "created_at": "2026-07-02T09:01:57.094Z",
      "updated_at": "2026-07-02T09:16:38.852Z",
      "unit": {
        "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
        "name": "A-1",
        "land_area": "72.00",
        "status": "reserved",
        "block": {
          "id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
          "name": "Block Anggrek"
        },
        "property": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "Cluster Harmony",
          "city": "Tangerang Selatan"
        }
      }
    },
    "activity": {
      "id": "50e310e7-835f-4f7b-8b73-943acfb0844e",
      "lead_id": "ae135258-c2fd-49bb-83ae-b6f3e11f6b57",
      "user_id": "14d4efb7-16a1-41cc-b4a8-609a669abdea",
      "activity_type": "status_change",
      "old_status": "new",
      "new_status": "contacted",
      "notes": "Status changed from new to contacted",
      "created_at": "2026-07-02T09:16:38.852Z"
    }
  }
}
```

**Response Structure - Lead tanpa unit (unit_id = NULL)**:

```json
{
  "success": true,
  "message": "Lead status updated successfully",
  "data": {
    "lead": {
      "id": "ae135258-c2fd-49bb-83ae-b6f3e11f6b57",
      "name": "Ahmad Fauzi",
      "phone": "081234567890",
      "email": "ahmad.fauzi@email.com",
      "status": "contacted",
      "source": "Visit",
      "unit_id": null,
      "property_price": null,
      "budget_range": null,
      "down_payment_percentage": null,
      "interest_rate": "5.50",
      "loan_term_years": 15,
      "estimated_monthly_payment": null,
      "assigned_to": "14d4efb7-16a1-41cc-b4a8-609a669abdea",
      "next_follow_up_at": null,
      "created_at": "2026-07-02T09:01:57.094Z",
      "updated_at": "2026-07-02T09:16:38.852Z",
      "unit": null
    },
    "activity": {
      "id": "50e310e7-835f-4f7b-8b73-943acfb0844e",
      "lead_id": "ae135258-c2fd-49bb-83ae-b6f3e11f6b57",
      "user_id": "14d4efb7-16a1-41cc-b4a8-609a669abdea",
      "activity_type": "status_change",
      "old_status": "new",
      "new_status": "contacted",
      "notes": "Status changed from new to contacted",
      "created_at": "2026-07-02T09:16:38.852Z"
    }
  }
}
```

**Data Mapping - lead.unit**:

| Response Field | Database Table | Database Column | Mapping Logic |
| --- | --- | --- | --- |
| `unit.id` | `units` | `id` | Direct via `leads.unit_id` |
| `unit.name` | `units` | `name` | Direct |
| `unit.land_area` | `units` | `land_area` | Direct, `null` jika tidak ada |
| `unit.status` | `units` | `status` | Direct — status setelah trigger berjalan |
| `unit.block.id` | `blocks` | `id` | JOIN via `units.block_id` |
| `unit.block.name` | `blocks` | `name` | Direct |
| `unit.property.id` | `properties` | `id` | JOIN via `blocks.property_id` |
| `unit.property.name` | `properties` | `name` | Direct |
| `unit.property.city` | `properties` | `city` | Direct |

**Database Query - Full lead detail for response**:

```sql
SELECT
    l.*,
    u.id AS unit_id,
    u.name AS unit_name,
    u.land_area AS unit_land_area,
    u.status AS unit_status,
    b.id AS block_id,
    b.name AS block_name,
    p.id AS property_id,
    p.name AS property_name,
    p.city AS property_city
FROM leads l
LEFT JOIN units u ON l.unit_id = u.id
LEFT JOIN blocks b ON u.block_id = b.id
LEFT JOIN properties p ON b.property_id = p.id
WHERE l.id = $1 AND l.assigned_to = $2;
```

---

### 3.3 GET /api/v1/pipeline/metrics - Get Pipeline Metrics

**Purpose**: Retrieve summary metrics for pipeline overview (cards at top of dashboard)

**Method**: `GET`

**Authentication**: Required

**Response Structure**:

```json
{
  "success": true,
  "data": {
    "total_leads": 247,
    "this_month": 12,
    "surveyed": 45,
    "booked": 8,
    "closed": 8,
    "conversion_rate": 3.24,
    "avg_time_to_close": 18.5
  }
}
```

**Data Mapping**:

| Response Field | Database Table | Database Column | Mapping Logic |
| --- | --- | --- | --- |
| `total_leads` | `leads` | `COUNT(*)` | COUNT WHERE `assigned_to` = current_user |
| `this_month` | `leads` | `COUNT(*)` | COUNT WHERE `assigned_to` = current_user AND `created_at` >= start_of_month |
| `surveyed` | `leads` | `COUNT(*)` | COUNT WHERE `assigned_to` = current_user AND `status` = ‘surveyed’ |
| `booked` | `leads` | `COUNT(*)` | COUNT WHERE `assigned_to` = current_user AND `status` = ‘booked’ |
| `closed` | `leads` | `COUNT(*)` | COUNT WHERE `assigned_to` = current_user AND `status` = ‘closed’ |
| `conversion_rate` | `leads` | Calculated | `(closed / total_leads) * 100` |
| `avg_time_to_close` | `leads` | Calculated | AVG days between `created_at` and `updated_at` for `status` = ‘closed’ |

**Database Query**:

```sql
-- Main metrics query
WITH metrics AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
        COUNT(*) FILTER (WHERE status = 'surveyed') as surveyed_count,
        COUNT(*) FILTER (WHERE status = 'booked') as booked_count,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as this_month_count,
        COUNT(*) as total_count,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) FILTER (WHERE status = 'closed') as avg_days_to_close
    FROM leads
    WHERE assigned_to = $1
)
SELECT
    total_count as total_leads,
    this_month_count as this_month,
    surveyed_count as surveyed,
    booked_count as booked,
    closed_count as closed,
    CASE
        WHEN total_count > 0 THEN ROUND((closed_count::NUMERIC / total_count::NUMERIC) * 100, 2)
        ELSE 0
    END as conversion_rate,
    COALESCE(ROUND(avg_days_to_close::NUMERIC, 1), 0) as avg_time_to_close
FROM metrics;
```

> **Note**: `EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400` digunakan menggantikan `EXTRACT(DAY FROM ...)` karena `EXTRACT(DAY)` hanya mengambil komponen hari dari interval (contoh: interval ‘35 days’ menghasilkan `5`, bukan `35`), sedangkan `EPOCH` menghasilkan total detik yang dibagi 86400 untuk mendapatkan total hari yang akurat.
> 

---

## 4. Pipeline Stage Configuration

### 4.1 Stage Definitions

| ID | Name (ID) | Name (EN) | Color | Order |
| --- | --- | --- | --- | --- |
| `new` | Baru Masuk | New | #6B7280 (Gray) | 1 |
| `contacted` | Dikontak | Contacted | #3B82F6 (Blue) | 2 |
| `surveyed` | Survey | Surveyed | #8B5CF6 (Purple) | 3 |
| `negotiating` | Negosiasi | Negotiating | #F59E0B (Orange) | 4 |
| `booked` | Booking Fee | Booked | #06B6D4 (Cyan) | 5 |
| `closed` | Closing | Closed | #10B981 (Green) | 6 |
| `cancelled` | Batal | Cancelled | #EF4444 (Red) | 7 |

### 4.2 Stage Transition Rules

**Valid Transitions**:

- Any stage → Any stage (flexible workflow)
- **Special case**: Moving to `cancelled` requires a reason

**Invalid Transitions**:

- None (all transitions allowed for flexibility)

### 4.3 Unit Status Auto-Update (via DB Trigger)

Setiap kali status lead berubah, database trigger otomatis mengubah status unit yang terkait:

| Lead Status | Unit Status | Alasan |
| --- | --- | --- |
| `new` | `reserved` | Minat awal, tandai unit |
| `contacted` | `reserved` | Komunikasi awal |
| `surveyed` | `reserved` | Sudah lihat lokasi |
| `negotiating` | `reserved` | Masih negosiasi, belum bayar |
| `booked` | `booked` | Sudah bayar booking fee |
| `closed` | `sold` | Akad selesai |
| `cancelled` | `available` | Kembali tersedia |

> **Note untuk Frontend**: Setelah drag & drop, unit status di response `lead.unit.status` sudah mencerminkan nilai terbaru (setelah trigger berjalan). Gunakan nilai ini untuk update state jika frontend juga menampilkan status unit.
> 

---

## 5. Error Response Format

Mengikuti standar error response yang sama dengan [API Design - Properties V2](https://www.notion.so/API-Design-Properties-V2-2e4b2c42720c8194b8b1c3ab372365fe):

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description | Trigger |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request validation gagal | `status` bukan enum valid, `reason` kosong saat status=`cancelled` |
| `UNAUTHORIZED` | 401 | Tidak ada token valid | Semua endpoint |
| `FORBIDDEN` | 403 | Lead bukan milik user (assigned_to ≠ current user) | PUT status, GET pipeline |
| `NOT_FOUND` | 404 | Lead tidak ditemukan | PUT status |
| `INVALID_STATUS_TRANSITION` | 422 | Transisi status tidak valid (jika di masa depan dibatasi) | PUT status |

**Error Response Examples**:

```json
// Reason wajib saat cancel
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "reason": ["Reason is required when moving lead to cancelled status"]
    }
  }
}
```

```json
// Invalid status value
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "status": ["Status must be one of: new, contacted, surveyed, negotiating, booked, closed, cancelled"]
    }
  }
}
```

```json
// Lead not found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Lead not found",
    "details": {}
  }
}
```

```json
// Lead belongs to another user
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify this lead",
    "details": {}
  }
}
```

---

## 6. API Summary Table

| # | Method | Endpoint | Purpose |
| --- | --- | --- | --- |
| 1 | `GET` | `/api/v1/pipeline` | Get all leads grouped by pipeline stage (kanban board) |
| 2 | `PUT` | `/api/v1/leads/:id/status` | Update lead status (drag & drop) |
| 3 | `GET` | `/api/v1/pipeline/metrics` | Get pipeline summary metrics |

---

## 7. Related Documents

- [BRD - Sales Force Automation System](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f)
- [FSD - Sales Force Automation System](https://www.notion.so/FSD-Sales-Force-Automation-System-2e4b2c42720c818093ffc3728d4807a9)
- [ERD - Sales Force Automation System](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954)
- [UISD - Dashboard Penjualan](https://www.notion.so/UI-Specification-Dashboard-Penjualan-Personal-CRM-2e5b2c42720c8194b8b1c3ab372365fe)
- [API Design - Leads](https://www.notion.so/API-Design-Leads-2e6b2c42720c81049249fe6f831ec771)
- [API Design - Properties V2](https://www.notion.so/API-Design-Properties-V2-2e4b2c42720c8194b8b1c3ab372365fe)

---

*Document Version: 2.0 | Last Updated: 2026-07-20*