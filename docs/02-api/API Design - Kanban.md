# API Design - Kanban

---

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Pipeline Kanban Board |
| **Version** | 1.1 |
| **Last Updated** | 2026-07-20 |
| **Related Docs** | [BRD](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f) \ |

---

## 2. Page Overview

The **Pipeline Kanban Board** is the core feature of the CRM Dashboard that enables sales to visualize and manage leads through different stages of the sales process.

### 2.1 Route & Access

- **Route**: `/dashboard/pipeline`
- **Authentication**: Required (JWT token via httpOnly cookie)
- **Authorization**: Sales users can only view their own assigned leads

### 2.2 Key Features

- Horizontal scrollable kanban board with 6 stages
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
            "property_name": "Cluster Harmony Tipe 45/72",
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
| `stages[].id` | - | - | Hardcoded enum values (`new`, `contacted`, `surveyed`, `negotiating`, `closed`, `cancelled`) |
| `stages[].name` | - | - | Static labels (Indonesian) |
| `stages[].name_en` | - | - | Static labels (English) |
| `stages[].color` | - | - | Static hex colors |
| `stages[].order` | - | - | Static order 1-6 |
| `stages[].lead_count` | `leads` | `COUNT(*)` | COUNT filtered by `status` AND `assigned_to` = current_user (+ `search` filter if provided) |
| `stages[].leads[].id` | `leads` | `id` | Direct mapping |
| `stages[].leads[].name` | `leads` | `name` | Direct mapping |
| `stages[].leads[].property_name` | `properties` | `name` | LEFT JOIN from `properties` via `property_id`, returns `undefined` if null |
| `stages[].leads[].next_follow_up_at` | `leads` | `next_follow_up_at` | Direct mapping, returns `undefined` if null |
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
    p.name AS property_name
FROM leads l
LEFT JOIN properties p ON l.property_id = p.id
WHERE l.status = $1                    -- 'new', 'contacted', 'surveyed', 'negotiating', 'closed', 'cancelled'
  AND l.assigned_to = $2               -- current user ID
  AND l.name ILIKE $3                  -- optional, only when 'search' parameter is provided
ORDER BY l.updated_at DESC
LIMIT $4 OFFSET $5;                    -- without search: $3=LIMIT, $4=OFFSET
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
| `status` | enum | Yes | `leads` | `status` | Must be: `new`, `contacted`, `surveyed`, `negotiating`, `closed`, `cancelled` |
| `reason` | string | No* | `lead_activities` | `notes` | Required when status=`cancelled` |

*Required when moving to "cancelled" stage

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
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
RETURNING *;
```

1. **Handle `cancelled` status**: If status is `cancelled`, additionally require cancellation reason:

```sql
-- The reason field is stored in lead_activities.notes
-- This is handled at application layer validation
```

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
      "source": "Website",
      "property_id": "79047dbd-840d-4624-8011-0aba30d90c5b",
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
      "property": {
        "id": "79047dbd-840d-4624-8011-0aba30d90c5b",
        "name": "Cluster Harmony Tipe 45/72",
        "property_type": "Rumah",
        "price": "850000000.00",
        "city": "Tangerang Selatan"
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
    "closed": 8,
    "conversion_rate": 15.2,
    "avg_time_to_close": 18
  }
}
```

**Data Mapping**:

| Response Field | Database Table | Database Column | Mapping Logic |
| --- | --- | --- | --- |
| `total_leads` | `leads` | `COUNT(*)` | COUNT WHERE assigned_to=current_user |
| `this_month` | `leads` | `COUNT(*)` | COUNT WHERE assigned_to=current_user AND created_at >= start_of_month |
| `surveyed` | `leads` | `COUNT(*)` | COUNT WHERE assigned_to=current_user AND status='surveyed' |
| `closed` | `leads` | `COUNT(*)` | COUNT WHERE assigned_to=current_user AND status='closed' |
| `conversion_rate` | `leads` | Calculated | (closed / total_leads) * 100 |
| `avg_time_to_close` | `leads` | Calculated | AVG days between created_at and updated_at for status='closed' |

**Database Query**:

```sql
-- Main metrics query
WITH metrics AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
        COUNT(*) FILTER (WHERE status = 'surveyed') as surveyed_count,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as this_month_count,
        COUNT(*) as total_count,
        AVG(EXTRACT(DAY FROM (updated_at - created_at))) FILTER (WHERE status = 'closed') as avg_days_to_close
    FROM leads
    WHERE assigned_to = $1
)
SELECT
    total_count as total_leads,
    this_month_count as this_month,
    surveyed_count as surveyed,
    closed_count as closed,
    CASE 
        WHEN total_count > 0 THEN ROUND((closed_count::NUMERIC / total_count::NUMERIC) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    COALESCE(ROUND(avg_days_to_close::NUMERIC, 1), 0) as avg_time_to_close
FROM metrics;
```

---

## 4. Pipeline Stage Configuration

### 4.1 Stage Definitions

| ID | Name (ID) | Name (EN) | Color | Order |
| --- | --- | --- | --- | --- |
| `new` | Baru Masuk | New | #6B7280 (Gray) | 1 |
| `contacted` | Dikontak | Contacted | #3B82F6 (Blue) | 2 |
| `surveyed` | Survey | Surveyed | #8B5CF6 (Purple) | 3 |
| `negotiating` | Negosiasi | Negotiating | #F59E0B (Orange) | 4 |
| `closed` | Closing | Closed | #10B981 (Green) | 5 |
| `cancelled` | Batal | Cancelled | #EF4444 (Red) | 6 |

### 4.2 Stage Transition Rules

**Valid Transitions**:

- Any stage → Any stage (flexible workflow)
- **Special case**: Moving to `cancelled` requires a reason

**Invalid Transitions**:

- None (all transitions allowed for flexibility)

---

## 7. Related Documents

- [BRD - Sales Force Automation System](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f)
- [FSD - Sales Force Automation System](https://www.notion.so/FSD-Sales-Force-Automation-System-2e4b2c42720c818093ffc3728d4807a9)
- [ERD - Sales Force Automation System](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954)
- [UISD - Dashboard Penjualan](https://www.notion.so/UI-Specification-Dashboard-Penjualan-Personal-CRM-2e5b2c42720c8194b8b1c3ab372365fe)
- [API Design - Leads](https://www.notion.so/API-Design-Leads-2e6b2c42720c81049249fe6f831ec771)

---

*Document Version: 1.1 | Last Updated: 2026-07-02*