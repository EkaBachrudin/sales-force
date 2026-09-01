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

### Changelog from v1.1 → v2.0

| Change | Reason |
| --- | --- |
| Replaced `property_id` with `unit_id` across all endpoints | ERD: `leads` relates to `units`, not directly to `properties` |
| Changed `property` object to `unit` (nested `block` + `property`) in response | Aligned with the `leads → units → blocks → properties` relationship |
| Added `booked` status to all lead status enums | ERD: `leads.status` CHECK constraint includes `booked` |
| Updated WA fields: `message_type` → `direction`, `content` → `message_text`, added `user_id`, `message_id`, `status` | Aligned with ERD `whatsapp_messages` columns |
| Changed `source` from strict enum to free text (max 50 chars) | ERD: `source VARCHAR(50)` without CHECK constraint, DEFAULT `'Visit'` |
| Added `down_payment` to create and update responses | ERD: `down_payment NUMERIC(15,2)` column available in `leads` table |
| Removed `property_type` from all responses | ERD: `properties` table does not have a `property_type` column |
| Removed `updated_at` from `reminders` response | ERD: `reminder_schedules` table does not have an `updated_at` column |
| Added `user_id`, `message_id`, `status` columns to `whatsapp_messages` response | Aligned with ERD `whatsapp_messages` schema |
| Updated SQL queries for all endpoints | Adjusted join chain `leads → units → blocks → properties` |
| Simplified endpoint 3.6 (Properties Dropdown) | Removed `property_type`, added `city` |
| Added `DELETE /api/v1/leads/:id` endpoint | Permanent lead deletion with related data |
| Added `GET /api/v1/leads/export` endpoint | Export leads to Excel (.xlsx) |

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
| `statuses` | string (comma-separated) | No | - | Filter by multiple statuses, e.g. `new,contacted,surveyed,negotiating`. Each value must be one of: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` |
| `search` | string | No | - | Search by name or phone number |
| `start_date` | string (ISO date) | No | 1 year ago | Filter leads created after this date |
| `end_date` | string (ISO date) | No | today | Filter leads before this date |
| `property_id` | UUID | No | - | Filter by property ID (resolved via `unit → block → property` join chain) |
| `source` | string | No | - | Filter by source (free text match) |
| `sort_by` | string | No | `created_at` | Sort field: `created_at`, `name`, `status`, `next_follow_up_at` |
| `sort_order` | string | No | `desc` | Sort order: `asc`, `desc` |

### 3.1.1 Authorization/Visibility Rules (RBAC)

Data visibility on this endpoint (list, detail, and export) is determined by the logged-in user's role (read from JWT `req.user.role`):

| Role | Scope | Database Filter |
| --- | --- | --- |
| `Admin` | All leads across the system (all roles) | No `assigned_to` filter |
| `Supervisor` | All leads across the system (all roles) | No `assigned_to` filter |
| `Sales` | Only leads owned by the user | `l.assigned_to` = current user ID |

**SQL Condition**:

```sql
WHERE (l.assigned_to = $1 OR $2::boolean)   -- $2 = true if role Admin/Supervisor
  ...
```

- `$1` = current user ID (from JWT `sub`)
- `$2` = boolean: `true` for `Admin`/`Supervisor` roles (`assigned_to` filter is ignored → all leads), `false` for `Sales` role (only leads owned by that user)

> **Note**: This RBAC applies to all three retrieval endpoints: `GET /api/v1/leads`, `GET /api/v1/leads/:id`, and `GET /api/v1/leads/export`. Write operations (`POST`, `PUT`, `DELETE`) still perform `assigned_to` ownership validation.

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

> **Note**: `unit` is `null` if the lead has not been assigned to any unit (`unit_id` IS NULL).
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
| `leads[].unit` | — | — | Object wrapper. `null` if `unit_id` is empty |
| `leads[].unit.id` | `units` | `id` | Retrieved via `LEFT JOIN leads → units` using `l.unit_id = u.id` |
| `leads[].unit.name` | `units` | `name` | Retrieved via `LEFT JOIN leads → units` |
| `leads[].unit.block_name` | `blocks` | `name` | Retrieved via `LEFT JOIN units → blocks` using `u.block_id = b.id` |
| `leads[].unit.property_name` | `properties` | `name` | Retrieved via `LEFT JOIN blocks → properties` using `b.property_id = p.id` |
| `leads[].unit.property_id` | `properties` | `id` | Retrieved via join chain `leads → units → blocks → properties` |
| `leads[].created_at` | `leads` | `created_at` | Direct mapping (Timestamp ISO) |
| `leads[].updated_at` | `leads` | `updated_at` | Direct mapping (Timestamp ISO) |
| **`pagination`** | — | — | *Object for pagination control* |
| `pagination.page` | — | — | Derived from input query parameter (default: `1`) |
| `pagination.limit` | — | — | Derived from input query parameter (default: `50`) |
| `pagination.total` | — | — | Result of `SELECT COUNT(DISTINCT l.id)` aggregate query |
| `pagination.pages` | — | — | Calculated: `Math.ceil(total / limit)` |

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
WHERE (l.assigned_to = $1 OR $2::boolean)             -- RBAC: $1 = User ID from JWT; $2 = true (Admin/Supervisor) => all leads, false (Sales) => own leads
    AND l.created_at >= $3                            -- Required: Start Date (Default: 1 year ago)
    AND l.created_at <= $4                            -- Required: End Date (Default: Today)
    AND ($5::varchar(50) IS NULL OR l.status = $5)   -- Optional: single status
    -- Optional: multiple statuses (param `statuses`):
    -- AND l.status IN ($n, $n+1, ...)               -- example: 'new','contacted','surveyed','negotiating'
    AND ($6::text IS NULL OR l.name ILIKE '%' || $6 || '%' OR l.phone ILIKE '%' || $6 || '%')  -- Optional: if search is provided
    AND ($7::uuid IS NULL OR p.id = $7)              -- Optional: if property_id is provided (filter via join chain)
    AND ($8::text IS NULL OR l.source ILIKE '%' || $8 || '%')  -- Optional: if source is provided
ORDER BY
    CASE WHEN $9 = 'created_at' THEN l.created_at END,
    CASE WHEN $9 = 'name' THEN l.name END,
    CASE WHEN $9 = 'status' THEN l.status END,
    CASE WHEN $9 = 'next_follow_up_at' THEN l.next_follow_up_at END
    $10 ASCNULLS LAST                                -- $10 = 'ASC' or 'DESC'
LIMIT $11 OFFSET $12
```

> **Note**: The `property_id` filter is resolved through the join chain `leads → units → blocks → properties`. If `property_id` is provided, only leads whose unit belongs to that property will appear. If a lead does not have a unit (`unit_id` IS NULL), it will **not** appear when the `property_id` filter is active.
> 
> **Note**: `statuses` accepts a comma-separated list of status values (e.g., `new,contacted,surveyed,negotiating`); leads with statuses outside this list will be excluded from results. Invalid values are ignored. `statuses` and `status` are mutually exclusive — if `statuses` is provided, `status` is ignored.
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

> **Note**: `unit` is `null` if the lead has not been assigned to any unit. `kpr_simulation` is still displayed even without a unit (since KPR fields are stored directly in the `leads` table).
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
| **lead.kpr_simulation** | `leads` | *Multiple Columns* | Aggregated into object from columns: `property_price`, `down_payment`, `down_payment_percentage`, `interest_rate`, `loan_term_years`, `estimated_monthly_payment` |
| **lead.assigned_to** | `leads` | `assigned_to` | Direct mapping |
| **lead.assigned_to_name** | `users` | `full_name` | JOIN from `users` via `assigned_to` |
| **lead.notes** | `leads` | `notes` | Direct mapping (nullable) |
| **lead.unit** | `units` + `blocks` + `properties` | *Multiple Columns* | JOIN via `unit_id → units.id → blocks.id → properties.id`. `null` if `unit_id` IS NULL |
| **lead.unit.id** | `units` | `id` | Direct via JOIN |
| **lead.unit.name** | `units` | `name` | Direct via JOIN |
| **lead.unit.land_area** | `units` | `land_area` | Direct via JOIN |
| **lead.unit.status** | `units` | `status` | Direct via JOIN (unit status: available/reserved/booked/sold) |
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
-- Security filter: assigned_to ($2) from JWT with RBAC ($3 = boolean: Admin/Supervisor bypass)
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
WHERE l.id = $1 AND (l.assigned_to = $2 OR $3::boolean);  -- $3 = true (Admin/Supervisor) => all leads, false (Sales) => own leads

-- 2. Activities Query
SELECT la.*, u.full_name AS user_name
FROM lead_activities la
LEFT JOIN users u ON la.user_id = u.id
WHERE la.lead_id = $1
ORDER BY la.created_at DESC;

-- 3. WhatsApp Messages Query
-- Aligned with ERD columns: direction, message_text, message_id, status
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
-- reminder_schedules table does NOT have an updated_at column (per ERD)
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
| **name** | string | **Yes** | `leads` | `name` | Max 100 chars, must not be empty/whitespace only |
| **phone** | string | **Yes** | `leads` | `phone` | 10-20 digits, numeric only |
| **email** | string | No | `leads` | `email` | Valid email format if provided |
| **nik** | string | No | `leads` | `nik` | Must be exactly 16 digits if provided |
| **npwp** | string | No | `leads` | `npwp` | Must be 15-20 digits if provided |
| **source** | string | No | `leads` | `source` | Free text, max 50 chars. Default: `'Visit'` |
| **unit_id** | UUID | No | `leads` | `unit_id` | Must exist in `units` table and the unit must belong to the logged-in user's property (`assigned_to` match). Unit must not have `sold` status |
| **budget_range** | object | No | `leads` | `budget_range` | JSONB object: `{"min": number, "max": number}` |
| **status** | enum | No | `leads` | `status` | Values: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled`. Default: `new` |
| **notes** | string | No | `leads` | `notes` | Free text |
| **kpr_simulation** | object | No | — | — | Parent object for KPR data |
| `kpr_simulation.property_price` | number | No* | `leads` | `property_price` | Required if `kpr_simulation` is provided. Numeric > 0 |
| `kpr_simulation.down_payment_percentage` | number | No* | `leads` | `down_payment_percentage` | Required if `kpr_simulation` is provided. Range: 1 - 100 |
| `kpr_simulation.interest_rate` | number | No* | `leads` | `interest_rate` | Required if `kpr_simulation` is provided. Numeric > 0 |
| `kpr_simulation.loan_term_years` | number | No* | `leads` | `loan_term_years` | Required if `kpr_simulation` is provided. Values: `5, 10, 15, 20, 25` |
| **reminder** | object | No | — | — | Parent object for reminder data |
| `reminder.remind_at` | datetime | No | `reminder_schedules` | `remind_at` | ISO Datetime string. Must be a future date |
| `reminder.message` | string | No | `reminder_schedules` | `message` | Free text |
| `reminder.is_completed` | boolean | No | `reminder_schedules` | `is_completed` | Default: `false` |

> **Business Rule — unit_id**: If `unit_id` is provided, the system must validate that the unit belongs to a property owned by the logged-in user. Validation query: `SELECT u.id FROM units u JOIN blocks b ON u.block_id = b.id JOIN properties p ON b.property_id = p.id WHERE u.id = $1 AND p.assigned_to = $2`. If `unit_id` is provided and the lead status is not `cancelled`, a DB trigger will automatically update the unit status (see [Unit Status Auto-Update](about:blank#unit-status-auto-update-reference-via-db-trigger)).
> 

> **Down payment calculation**: If `kpr_simulation` is provided, `down_payment` is calculated on the backend: `property_price * down_payment_percentage / 100` and stored in the `leads.down_payment` column.
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
    $1,                  -- assigned_to (from JWT)
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
    $13,                 -- down_payment (calculated: price * percentage / 100)
    $14,                 -- down_payment_percentage
    $15,                 -- interest_rate
    $16,                 -- loan_term_years
    $17                  -- estimated_monthly_payment
)
RETURNING *;
```

1. **Insert into `reminder_schedules` table** (if reminder is provided):

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
| **name** | string | No | `leads.name` | Optional for partial updates |
| **phone** | string | No | `leads.phone` | Validation: 10-20 numeric digits |
| **email** | string | No | `leads.email` | Validation: valid email format |
| **nik** | string | No | `leads.nik` | Validation: must be exactly 16 digits if provided |
| **npwp** | string | No | `leads.npwp` | Validation: must be 15-20 digits if provided |
| **source** | string | No | `leads.source` | Free text, max 50 chars |
| **unit_id** | UUID | No | `leads.unit_id` | Must exist in `units` table and belong to the user's property. If this field is **not sent** (omitted), `unit_id` retains its existing value. Send `null` to unassign a unit from the lead. If the unit changes, a DB trigger will update both the old and new unit statuses |
| **budget_range** | object | No | `leads.budget_range` | JSONB format: `{"min": number, "max": number}` |
| **status** | string | No | `leads.status` | If changed from the previous status, automatically triggers an Activity Log entry |
| **notes** | string | No | `leads.notes` | Additional internal notes |
| **last_followed_up_at** | datetime | No | `leads.last_followed_up_at` | Last interaction timestamp |
| **next_follow_up_at** | datetime | No | `leads.next_follow_up_at` | Scheduled follow-up time |
| **kpr_simulation** | object | No | — | Wrapper object for KPR simulation data |
| `kpr_simulation.property_price` | number | No* | `leads.property_price` | *Required if `kpr_simulation` is provided. Value > 0 |
| `kpr_simulation.down_payment_percentage` | number | No* | `leads.down_payment_percentage` | *Required if `kpr_simulation` is provided. Range: 1 - 100 |
| `kpr_simulation.interest_rate` | number | No* | `leads.interest_rate` | *Required if `kpr_simulation` is provided. Value > 0 |
| `kpr_simulation.loan_term_years` | number | No* | `leads.loan_term_years` | *Required if `kpr_simulation` is provided. Values: `5, 10, 15, 20, 25` |
| **reminder** | object | No | — | Wrapper object for reminder data |
| `reminder.id` | UUID | No | `reminder_schedules.id` | If provided: update existing reminder. If empty/`""`/`null`: insert new reminder |
| `reminder.remind_at` | datetime | No | `reminder_schedules.remind_at` | Reminder trigger time |
| `reminder.message` | string | No | `reminder_schedules.message` | Reminder message content |
| `reminder.is_completed` | boolean | No | `reminder_schedules.is_completed` | Default: `false` |

> **Business Rule — unit_id change**: If `unit_id` is changed from unit A to unit B:
1. The DB trigger evaluates the lead status against unit A (if no other active leads remain, unit A reverts to `available`)
2. The DB trigger evaluates the lead status against unit B (unit B status updates according to the lead status)
3. Validation: unit B must not have `sold` status
4. Validation: unit B must not already have a lead with `booked` status
5. Business Rule: If the lead status changes to `booked`, all other leads on that unit will be unassigned (the unit is exclusively claimed by the `booked` lead)
> 

> **Down payment calculation**: Same as create, `down_payment` is recalculated if `kpr_simulation` is provided.
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

> **Note on `$8` (unit_id)**: The value of `$8` is calculated on the application side, not sent directly from the request:
> - `unit_id` not sent (omitted) → `$8` = existing `unit_id` (unchanged)
> - `unit_id` is a string value → `$8` = new unit
> - `unit_id` = `null` → `$8` = `NULL` (unassigns unit)

1. **Update/Insert `reminder_schedules`** (if reminder is provided):

**If `reminder.id` is provided (update):**

```sql
UPDATE reminder_schedules SET
    remind_at = COALESCE($2, remind_at),
    message = COALESCE($3, message),
    is_completed = COALESCE($4, is_completed)
WHERE id = $1
  AND lead_id = $5;
```

**If `reminder.id` is null/empty (new insert):**

```sql
INSERT INTO reminder_schedules (
    id, user_id, lead_id, remind_at, message, is_completed
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5
);
```

1. **Insert activity log if status changed** (executed ONLY when `status` is changed):

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

> **Note**: This is a simplified version of the `GET /api/v1/properties` endpoint (from API Design Properties V2), stripped down for the filter dropdown on the Leads page. Pagination is excluded since the number of properties per user is typically limited.
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
- **Worksheet**: Single sheet named "Leads"
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
WHERE (l.assigned_to = $1 OR $2::boolean)             -- RBAC: $1 = User ID from JWT; $2 = true (Admin/Supervisor) => all leads, false (Sales) => own leads
    AND l.created_at >= $3                            -- Start Date (Default: 1 year ago)
    AND l.created_at <= $4                            -- End Date (Default: Today)
    AND ($5::varchar(50) IS NULL OR l.status = $5)   -- Optional: Status filter
    AND ($6::text IS NULL OR l.name ILIKE '%' || $6 || '%' OR l.phone ILIKE '%' || $6 || '%')  -- Optional: Search
    AND ($7::uuid IS NULL OR p.id = $7)              -- Optional: Property filter
    AND ($8::text IS NULL OR l.source ILIKE '%' || $8 || '%')  -- Optional: Source filter
ORDER BY l.created_at DESC;
```

**Security Considerations**:

- Visibility follows the same RBAC as `GET /api/v1/leads`: Admin/Supervisor export ALL leads; Sales export only their own leads (`assigned_to` = current user)
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
| `available` | Unit available for sale |
| `reserved` | Unit being processed / under negotiation |
| `booked` | Unit has been paid a booking fee |
| `sold` | Unit has been sold via contract |

### Unit Status Auto-Update Reference (via DB Trigger)

```
Lead Status          │  Unit Status   │  Reason
─────────────────────┼────────────────┼──────────────────────────────────
new                  │  reserved      │  Initial interest, mark unit
contacted            │  reserved      │  Initial communication
surveyed             │  reserved      │  Location has been visited
negotiating          │  reserved      │  Still under negotiation, not yet paid
booked               │  booked        │  Booking fee paid
closed               │  sold          │  Contract completed
cancelled            │  available*    │  Returns to available (if no other active leads)
```

### 4.3 WhatsApp Message Direction

| Value | Description |
| --- | --- |
| `incoming` | Message from lead |
| `outgoing` | Message from sales |

### 4.4 WhatsApp Message Status

| Value | Description |
| --- | --- |
| `sent` | Message sent to server |
| `delivered` | Message delivered to device |
| `read` | Message has been read |
| `failed` | Failed to send |

### 4.5 Activity Type

| Value | Description |
| --- | --- |
| `status_change` | Lead status change |
| `note_added` | Note added |
| `call` | Phone call |
| `whatsapp` | WhatsApp activity |

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
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | No valid token provided |
| `FORBIDDEN` | 403 | Lead does not belong to user (assigned_to mismatch) |
| `NOT_FOUND` | 404 | Lead not found |
| `UNIT_NOT_FOUND` | 404 | Unit not found |
| `UNIT_SOLD` | 409 | Unit is already sold, cannot be assigned to lead |
| `UNIT_BOOKED` | 409 | Unit already has a lead with `booked` status |
| `UNIT_OWNERSHIP_MISMATCH` | 403 | Unit belongs to a property not owned by the user |

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

**Join Chain for Lead + Unit Info**:

```
leads.unit_id → units.id → units.block_id → blocks.id → blocks.property_id → properties.id
```

---

## 7. API Summary Table

| # | Method | Endpoint | Purpose |
| --- | --- | --- | --- |
| 1 | `GET` | `/api/v1/leads` | List leads with pagination & filters |
| 2 | `GET` | `/api/v1/leads/:id` | Lead detail + activities, WA messages, reminders |
| 3 | `POST` | `/api/v1/leads` | Create new lead (optional KPR & reminder) |
| 4 | `PUT` | `/api/v1/leads/:id` | Update lead (optional KPR & reminder) |
| 5 | `POST` | `/api/v1/leads/:id/activities` | Add activity log / note |
| 6 | `GET` | `/api/v1/properties` | List properties for filter dropdown (simplified) |
| 7 | `DELETE` | `/api/v1/leads/:id` | Permanently delete lead with related data |
| 8 | `GET` | `/api/v1/leads/export` | Export leads to Excel file (.xlsx) |

---

## 8. Related Documents

- [BRD - Sales Force Automation System](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f)
- [FSD - Sales Force Automation System](https://www.notion.so/FSD-Sales-Force-Automation-System-2e4b2c42720c818093ffc3728d4807a9)
- [ERD - Sales Force Automation System](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954)
- [API Design - Properties V2](https://www.notion.so/API-Design-Properties-V2-2e4b2c42720c818093ffc3728d4807a9)
- [UISD - Dashboard Penjualan](https://www.notion.so/UI-Specification-Dashboard-Penjualan-Personal-CRM-2e5b2c42720c8194b8b1c3ab372365fe)

---

*Document Version: 2.0 | Last Updated: 2026-07-14*
