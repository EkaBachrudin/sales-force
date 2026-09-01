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

### 1.1 Data Visibility / Authorization Rules (RBAC)

Data returned by the retrieval endpoints (`GET /api/v1/dashboard/overview` and `GET /api/v1/reminders/upcoming`) is determined by the logged-in user's role (read from JWT `req.user.role`):

| Role | Dashboard Overview (`/dashboard/overview`) | Upcoming Reminders (`/reminders/upcoming`) |
| --- | --- | --- |
| `Admin` | Aggregate metrics from **ALL leads** across the entire system | Fetches **ALL upcoming reminders** from all users |
| `Supervisor` | Aggregate metrics from **ALL leads** across the entire system | Fetches **ALL upcoming reminders** from all users |
| `Sales` | Aggregate metrics from own leads only (`assigned_to` = user) | Fetches **own reminders only** (`user_id` = user) |

**SQL Condition:**

```sql
WHERE (assigned_to = $1 OR $2::boolean)   -- $1 = user ID (JWT sub); $2 = true (Admin/Supervisor) => all, false (Sales) => own only
  ...
```

- `$1` = current user ID (from JWT `sub`)
- `$2` = boolean: `true` for `Admin`/`Supervisor` roles (filter bypassed → all data), `false` for `Sales` role (own data only)

> **Note**: This RBAC applies to both retrieval endpoints. Write operations (`POST/PUT/DELETE` reminders) still enforce `user_id` ownership validation for all roles.

---

## 2. Dashboard Matrix API

### 2.1 Get Dashboard Overview Metrics

**Endpoint:** `/api/v1/dashboard/overview`**Method:** `GET`**Purpose:** Fetches the 4 key dashboard metrics for the logged-in user

**Example Response:**

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
| `total_leads.value` | `leads` | - | `COUNT(*) WHERE (assigned_to = {user_id} OR {is_privileged}) AND status != 'cancelled'` |
| `total_leads.trend_value` | `leads` | - | `COUNT(*) WHERE (assigned_to = {user_id} OR {is_privileged}) AND created_at >= DATE_TRUNC('week', NOW())` |
| `new_leads_this_month.value` | `leads` | - | `COUNT(*) WHERE (assigned_to = {user_id} OR {is_privileged}) AND created_at >= DATE_TRUNC('month', NOW())` |
| `new_leads_this_month.trend_percentage` | - | - | Calculation: `(current_month - prev_month) / prev_month * 100` |
| `surveyed.value` | `leads` | `status` | `COUNT(*) WHERE (assigned_to = {user_id} OR {is_privileged}) AND status = 'surveyed'` |
| `surveyed.trend_value` | `leads` | `status`, `created_at` | `COUNT(*) WHERE (assigned_to = {user_id} OR {is_privileged}) AND status = 'surveyed' AND created_at >= DATE_TRUNC('week', NOW())` |
| `closed.value` | `leads` | `status` | `COUNT(*) WHERE (assigned_to = {user_id} OR {is_privileged}) AND status = 'closed'` |
| `closed.trend_value` | `leads` | `status`, `created_at` | `COUNT(*) WHERE (assigned_to = {user_id} OR {is_privileged}) AND status = 'closed' AND created_at >= DATE_TRUNC('week', NOW())` |

**Database Query:**

```sql
-- Total Leads (non-cancelled)
SELECT COUNT(*) AS total_leads
FROM leads
WHERE (assigned_to = $1 OR $2::boolean) AND status != 'cancelled';

-- New Leads This Week (for trend_value of total_leads)
SELECT COUNT(*) AS new_this_week
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND created_at >= DATE_TRUNC('week', NOW());

-- New Leads This Month vs Last Month (for value + percentage)
SELECT
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) AS this_month,
    COUNT(*) FILTER (
        WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          AND created_at < DATE_TRUNC('month', NOW())
    ) AS last_month
FROM leads
WHERE (assigned_to = $1 OR $2::boolean);

-- Surveyed
SELECT COUNT(*) AS surveyed
FROM leads
WHERE (assigned_to = $1 OR $2::boolean) AND status = 'surveyed';

-- Surveyed This Week (for trend_value)
SELECT COUNT(*) AS surveyed_this_week
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND status = 'surveyed'
  AND created_at >= DATE_TRUNC('week', NOW());

-- Closed
SELECT COUNT(*) AS closed
FROM leads
WHERE (assigned_to = $1 OR $2::boolean) AND status = 'closed';

-- Closed This Week (for trend_value)
SELECT COUNT(*) AS closed_this_week
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND status = 'closed'
  AND created_at >= DATE_TRUNC('week', NOW());
```

> **Note:** All queries use RBAC — `$1` = user ID from JWT, `$2` = boolean `isPrivilegedRole` (`true` for Admin/Supervisor → aggregate all leads, `false` for Sales → own leads only). See section 1.1 for details.
> 

---

## 3. Upcoming Reminders API

### 3.1 Get Upcoming Reminders

**Endpoint:** `/api/v1/reminders/upcoming`**Method:** `GET`**Purpose:** Fetches the list of upcoming reminders for the logged-in user

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `limit` | integer | No | `3` | Max items returned |
| `hours_ahead` | integer | No | `24` | Filter reminders within X hours from now |

**Example Response:**

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

> **Note:** In the third example, `unit` is `null` because the lead has not been assigned to any unit (`leads.unit_id` IS NULL). This aligns with the ERD where `unit_id` on `leads` is NULLABLE.
> 

**Data Mapping:**

| Response Field | DB Table | DB Column | Mapping Logic |
| --- | --- | --- | --- |
| `id` | `reminder_schedules` | `id` | Direct |
| `remind_at` | `reminder_schedules` | `remind_at` | Direct |
| `remind_at_formatted` | - | - | Formatted string from `remind_at` (backend/frontend logic) |
| `message` | `reminder_schedules` | `message` | Direct |
| `is_completed` | `reminder_schedules` | `is_completed` | Direct |
| `created_at` | `reminder_schedules` | `created_at` | Direct |
| `lead.id` | `leads` | `id` | Direct from JOIN |
| `lead.name` | `leads` | `name` | Direct from JOIN |
| `lead.phone` | `leads` | `phone` | Direct from JOIN |
| `lead.email` | `leads` | `email` | Direct from JOIN (nullable) |
| `lead.status` | `leads` | `status` | Direct from JOIN |
| `lead.property_price` | `leads` | `property_price` | Direct from JOIN (nullable) |
| `lead.unit.id` | `units` | `id` | JOIN via `leads.unit_id = units.id` |
| `lead.unit.name` | `units` | `name` | Direct from JOIN |
| `lead.unit.land_area` | `units` | `land_area` | Direct from JOIN (nullable) |
| `lead.unit.status` | `units` | `status` | Direct from JOIN |
| `lead.unit.block.id` | `blocks` | `id` | JOIN via `units.block_id = blocks.id` |
| `lead.unit.block.name` | `blocks` | `name` | Direct from JOIN |
| `lead.unit.block.property.id` | `properties` | `id` | JOIN via `blocks.property_id = properties.id` |
| `lead.unit.block.property.name` | `properties` | `name` | Direct from JOIN |
| `lead.unit.block.property.city` | `properties` | `city` | Direct from JOIN |

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
WHERE (rs.user_id = $1 OR $2::boolean)   -- $2 = true (Admin/Supervisor) => all reminders, false (Sales) => own only
  AND rs.remind_at BETWEEN NOW() AND (NOW() + INTERVAL '1 hour' * $3)
  AND rs.is_completed = false
ORDER BY rs.remind_at ASC
LIMIT $4;

-- Count total for meta
SELECT COUNT(*)
FROM reminder_schedules
WHERE (user_id = $1 OR $2::boolean)
  AND remind_at BETWEEN NOW() AND (NOW() + INTERVAL '1 hour' * $3)
  AND is_completed = false;
```

> **Changes from previous version:** The `hours_ahead` query parameter is now actually used in the query (previously the response meta example showed `168` but SQL hardcoded `1 week`). The join chain was changed from `leads → properties` (direct) to `leads → units → blocks → properties` per the ERD. The `price` and `property_type` columns were removed as they do not exist in the `properties` table (ERD), replaced by `property_price` from the `leads` table and the `unit → block → property` chain.
> 

---

## 4. Create Reminder API

### 4.1 Create New Reminder

**Endpoint:** `/api/v1/reminders`**Method:** `POST`**Content-Type:** `application/json`**Purpose:** Creates a new reminder for lead follow-up

**Request Body:**

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `lead_id` | UUID | Yes | `reminder_schedules.lead_id` | Must exist in `leads`, `assigned_to` = logged-in user |
| `remind_at` | ISO 8601 timestamp | Yes | `reminder_schedules.remind_at` | Must be future time |
| `message` | string | No | `reminder_schedules.message` | Text, nullable |

**Example Request Body:**

```json
{
    "lead_id": "660e8400-e29b-41d4-a716-446655440000",
    "remind_at": "2026-01-15T10:00:00+07:00",
    "message": "Follow up after site visit"
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
            "message": "Follow up after site visit",
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
    $1, -- user_id from JWT token
    $2, -- lead_id from request body
    $3, -- remind_at from request body
    $4, -- message from request body
    false,
    NOW()
) RETURNING *
```

> **Changes from previous version:** Uses `gen_random_uuid()` (consistent with Properties V2) replacing `uuid_generate_v4()`. Removed `updated_at` from response as the column does not exist in the `reminder_schedules` table (ERD). Response is wrapped in a `reminder` object (consistent with Properties V2 pattern of wrapping data in an entity-named object).
> 

**Validation Logic:**

1. Check that `lead_id` exists and `assigned_to` = logged-in user
2. Check that `remind_at` > NOW()
3. Check that no duplicate reminder exists for the same lead at the same time

---

## 5. Update Reminder API

### 5.1 Complete/Update Reminder

**Endpoint:** `/api/v1/reminders/:id`**Method:** `PUT`**Content-Type:** `application/json`**Purpose:** Updates reminder status or edits the reminder schedule

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
    "message": "Reschedule - client requested a more flexible time"
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
            "message": "Reschedule - client requested a more flexible time",
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

> **Changes from previous version:** Removed `updated_at` from response and SQL as the column does not exist in the `reminder_schedules` table per the ERD. Response is wrapped in a `reminder` object. Uses the `COALESCE` pattern for partial updates (consistent with Properties V2).
> 

**Validation Logic:**

1. Check that the reminder with the given ID exists and belongs to the logged-in user (`user_id` from JWT)
2. If updating `remind_at`, ensure the new time > NOW()
3. At least 1 field must be provided

---

## 6. Delete Reminder API

### 6.1 Delete Reminder

**Endpoint:** `/api/v1/reminders/:id`**Method:** `DELETE`**Purpose:** Deletes an unnecessary reminder

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

> **Changes from previous version:** Response changed from nested `data` object to flat `message` string (consistent with DELETE pattern in Properties V2). If no rows are deleted, returns `NOT_FOUND`.
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
| `VALIDATION_ERROR` | 400 | Request validation failed | All endpoints |
| `UNAUTHORIZED` | 401 | No valid token provided | All endpoints |
| `FORBIDDEN` | 403 | Resource does not belong to user | GET/PUT/DELETE by ID |
| `NOT_FOUND` | 404 | Resource not found | GET/PUT/DELETE by ID |
| `INTERNAL_ERROR` | 500 | Server error | All endpoints |

> **Changes from previous version:** HTTP Status for `VALIDATION_ERROR` changed from `422` to `400` (consistent with Properties V2).
> 

---

## 8. API Summary Table

| # | Method | Endpoint | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| **Dashboard** |  |  |  |  |
| 1 | `GET` | `/api/v1/dashboard/overview` | - | 4 key dashboard metrics |
| **Reminders** |  |  |  |  |
| 2 | `GET` | `/api/v1/reminders/upcoming` | - | List of upcoming reminders |
| 3 | `POST` | `/api/v1/reminders` | `application/json` | Create new reminder |
| 4 | `PUT` | `/api/v1/reminders/:id` | `application/json` | Update / complete reminder |
| 5 | `DELETE` | `/api/v1/reminders/:id` | - | Delete reminder |

---

## 9. Database Impact Matrix

| Endpoint | Method | Tables | Operations | Security Filter |
| --- | --- | --- | --- | --- |
| `/dashboard/overview` | GET | `leads` | SELECT (aggregate) | RBAC: `assigned_to = user_id` (Sales) / all leads (Admin/Supervisor) |
| `/reminders/upcoming` | GET | `reminder_schedules`, `leads`, `units`, `blocks`, `properties` | SELECT with JOIN (4 tables) | RBAC: `reminder_schedules.user_id = user_id` (Sales) / all reminders (Admin/Supervisor) |
| `/reminders` | POST | `reminder_schedules`, `leads` | INSERT + validation SELECT | `user_id` from JWT, validates `leads.assigned_to` |
| `/reminders/:id` | PUT | `reminder_schedules` | UPDATE | `user_id = user_id` |
| `/reminders/:id` | DELETE | `reminder_schedules` | DELETE | `user_id = user_id` |

---

## 10. Changelog — From Version 1.0 to 2.0

| # | Area | Change | Reason |
| --- | --- | --- | --- |
| 1 | **Response structure — Reminders** | `lead.property` changed to `lead.unit.block.property` (nested chain) | ERD: leads relate to `units`, not directly to `properties` |
| 2 | **Response fields — Reminders** | Removed `property_type` and `price` from response | ERD: `properties` table has neither `property_type` nor `price` columns |
| 3 | **Response fields — Reminders** | Added `lead.status` and `lead.property_price` | ERD: `leads` has `status` and `property_price` columns relevant for display |
| 4 | **Response fields — Reminders** | Added `lead.unit.land_area`, `lead.unit.status`, `lead.unit.block.name`, `lead.unit.block.property.city` | Provides full context per ERD hierarchy |
| 5 | **Response fields — Reminders** | `lead.unit` can be `null` | ERD: `leads.unit_id` is NULLABLE (lead may not have a unit) |
| 6 | **Response structure — Create/Update** | Removed `updated_at` from response | ERD: `reminder_schedules` table has no `updated_at` column |
| 7 | **Response structure — Create/Update** | Data wrapped in `reminder` object (not directly in `data`) | Consistent with Properties V2 pattern (`data.property`, `data.block`, `data.unit`) |
| 8 | **Response structure — Delete** | Changed from `{ "data": { "id": "...", "deleted": true } }` to `{ "message": "Reminder deleted successfully" }` | Consistent with DELETE pattern in Properties V2 |
| 9 | **SQL — Insert** | `uuid_generate_v4()` → `gen_random_uuid()` | Consistent with Properties V2 |
| 10 | **SQL — Update** | Removed `SET updated_at = NOW()` | ERD: `reminder_schedules` table has no `updated_at` column |
| 11 | **SQL — Upcoming Reminders** | Join chain changed from `leads → properties` to `leads → units → blocks → properties` | Per ERD relationships |
| 12 | **SQL — Upcoming Reminders** | `hours_ahead` parameter used dynamically in query (no longer hardcoded `1 week`) | Bug fix: parameter was defined but not used in SQL |
| 13 | **Error Code** | `VALIDATION_ERROR` HTTP Status changed from `422` → `400` | Consistent with Properties V2 |
| 14 | **Document metadata** | Added Document Overview table, API Summary Table, Database Impact Matrix, Changelog | Format consistency with Properties V2 |
| 15 | **RBAC** | Added Data Visibility / Authorization Rules (section 1.1); implemented data-level RBAC for `GET /dashboard/overview` and `GET /reminders/upcoming` — Admin/Supervisor aggregate/fetch all data, Sales own data only | Consistent with other APIs (Kanban V2, Leads V2, Pipeline, Analytics) |

---

## 11. Related Documents

- ERD - Dashboard Management
- API Design - Properties V2
- API Design - Authentication & Session Management
- API Design - Leads
- API Design - Users & Roles

---

*Document Version: 2.0 | Last Updated: 2026-07-13*