# API Design - Dashboard Matrix & Upcoming Reminders

---

## 1. Dashboard Matrix API

### 1.1 Get Dashboard Overview Metrics

**API Design:**

- **Endpoint:** `/api/v1/dashboard/overview`
- **Method:** `GET`
- **Primary Function:** Retrieves 4 key dashboard metrics for the currently logged-in user

**Example Response & Data Mapping:**

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

**Data Source Mapping:**

| Field | Source | Query Logic |
| --- | --- | --- |
| `total_leads.value` | `leads` table | `COUNT(*) WHERE assigned_to = {user_id} AND status != 'cancelled'` |
| `total_leads.trend_value` | `leads` table | `COUNT(*) WHERE assigned_to = {user_id} AND created_at >= DATE_TRUNC('week', NOW())` |
| `new_leads_this_month.value` | `leads` table | `COUNT(*) WHERE assigned_to = {user_id} AND created_at >= DATE_TRUNC('month', NOW())` |
| `new_leads_this_month.trend_percentage` | Calculation | `(current_month_count - prev_month_count) / prev_month_count * 100` |
| `surveyed.value` | `leads` table | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'surveyed'` |
| `surveyed.trend_value` | `leads` table | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'surveyed' AND created_at >= DATE_TRUNC('week', NOW())` |
| `closed.value` | `leads` table | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'closed'` |
| `closed.trend_value` | `leads` table | `COUNT(*) WHERE assigned_to = {user_id} AND status = 'closed' AND created_at >= DATE_TRUNC('week', NOW())` |

**Database Operations (GET):**

```sql
-- Total Leads
SELECT COUNT(*) FROM leads 
WHERE assigned_to = $1 AND status != 'cancelled';

-- New Leads This Week
SELECT COUNT(*) FROM leads 
WHERE assigned_to = $1 
AND created_at >= DATE_TRUNC('week', NOW());

-- New Leads This Month vs Last Month (for percentage)
SELECT 
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as this_month,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
    AND created_at < DATE_TRUNC('month', NOW())) as last_month
FROM leads WHERE assigned_to = $1;

-- Surveyed
SELECT COUNT(*) FROM leads 
WHERE assigned_to = $1 AND status = 'surveyed';

-- Closed
SELECT COUNT(*) FROM leads 
WHERE assigned_to = $1 AND status = 'closed';
```

---

## 2. Upcoming Reminders API

### 2.1 Get Upcoming Reminders

**API Design:**

- **Endpoint:** `/api/v1/reminders/upcoming`
- **Method:** `GET`
- **Primary Function:** Retrieves a list of upcoming reminders for the currently logged-in user

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `limit` | integer | No | 3 | Max items returned |
| `hours_ahead` | integer | No | 24 | Filter reminders within X hours from now |

**Example Response & Data Mapping:**

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
        "lead": {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name": "Budi Santoso",
          "phone": "0812-3456-7890",
          "email": "[budi@example.com](mailto:budi@example.com)",
          "property": {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "Cluster A Type 36/60",
            "property_type": "Rumah",
            "price": 500000000
          }
        }
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "remind_at": "2026-01-13T14:00:00+07:00",
        "remind_at_formatted": "Tomorrow, 2:00 PM",
        "message": "Site visit confirmation",
        "is_completed": false,
        "lead": {
          "id": "660e8400-e29b-41d4-a716-446655440004",
          "name": "Dewi Lestari",
          "phone": "0813-4567-8901",
          "email": "[dewi@example.com](mailto:dewi@example.com)",
          "property": {
            "id": "770e8400-e29b-41d4-a716-446655440005",
            "name": "Cluster B Type 45/72",
            "property_type": "Rumah",
            "price": 750000000
          }
        }
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440006",
        "remind_at": "2026-01-13T16:30:00+07:00",
        "remind_at_formatted": "Tomorrow, 4:30 PM",
        "message": "Send payment schedule",
        "is_completed": false,
        "lead": {
          "id": "660e8400-e29b-41d4-a716-446655440007",
          "name": "Ahmad Wijaya",
          "phone": "0811-2345-6789",
          "email": null,
          "property": {
            "id": "770e8400-e29b-41d4-a716-446655440008",
            "name": "Apartemen City View",
            "property_type": "Apartemen",
            "price": 1200000000
          }
        }
      }
    ],
    "meta": {
      "total": 1,
      "limit": 3,
      "hours_ahead": 168
    }
  }
}
```

**Data Source Mapping:**

| Field | Source | Query Logic |
| --- | --- | --- |
| `id` | `reminder_[schedules.id](http://schedules.id)` | PK reminder table |
| `remind_at` | `reminder_schedules.remind_at` | Timestamp reminder |
| `remind_at_formatted` | Frontend/Backend logic | Format string dari `remind_at` |
| `message` | `reminder_schedules.message` | Pesan reminder |
| `is_completed` | `reminder_[schedules.is](http://schedules.is)_completed` | Status completion |
| [`lead.id`](http://lead.id) | [`leads.id`](http://leads.id) | PK dari JOIN |
| [`lead.name`](http://lead.name) | [`leads.name`](http://leads.name) | Nama lead dari JOIN |
| [`lead.phone`](http://lead.phone) | [`leads.phone`](http://leads.phone) | No HP dari JOIN |
| [`lead.email`](http://lead.email) | [`leads.email`](http://leads.email) | Email dari JOIN |
| [`lead.property.id`](http://lead.property.id) | [`properties.id`](http://properties.id) | PK properti dari JOIN |
| [`lead.property.name`](http://lead.property.name) | [`properties.name`](http://properties.name) | Nama properti dari JOIN |
| [`lead.property.property`](http://lead.property.property)_type` | [`properties.property`](http://properties.property)_type` | Tipe properti dari JOIN |
| [`lead.property`](http://lead.property).price` | `properties.price` | Harga properti dari JOIN |

**Database Operations (GET):**

```sql
SELECT 
  rs.id,
  rs.remind_at,
  rs.message,
  rs.is_completed,
  l.id as lead_id,
  l.name as lead_name,
  l.phone as lead_phone,
  l.email as lead_email,
  p.id as property_id,
  p.name as property_name,
  p.property_type,
  p.price
FROM reminder_schedules rs
INNER JOIN leads l ON rs.lead_id = l.id
LEFT JOIN properties p ON l.property_id = p.id
WHERE rs.user_id = $1
  AND rs.remind_at BETWEEN NOW() AND (NOW() + INTERVAL '1 week')
  AND rs.is_completed = false
ORDER BY rs.remind_at ASC
LIMIT $2;

-- Count total for meta
SELECT COUNT(*) FROM reminder_schedules 
WHERE user_id = $1 
  AND remind_at BETWEEN NOW() AND (NOW() + INTERVAL '1 week')
  AND is_completed = false;
```

---

## 3. Create Reminder API

### 3.1 Create New Reminder

**API Design:**

- **Endpoint:** `/api/v1/reminders`
- **Method:** `POST`
- **Primary Function:** Creates a new reminder for lead follow-up

**Request Payload (Request Body):**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `lead_id` | UUID | Yes | Must exist in leads, assigned to user | Lead yang akan di-remind |
| `remind_at` | ISO 8601 timestamp | Yes | Must be future time | Waktu reminder |
| `message` | string | No | Max 500 chars | Pesan/deskripsi reminder |

**Example Request Body:**

```json
{
  "lead_id": "660e8400-e29b-41d4-a716-446655440000",
  "remind_at": "2026-01-15T10:00:00+07:00",
  "message": "Follow up setelah site visit"
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "440e8400-e29b-41d4-a716-446655440000",
    "lead_id": "660e8400-e29b-41d4-a716-446655440000",
    "remind_at": "2026-01-15T10:00:00+07:00",
    "message": "Follow up setelah site visit",
    "is_completed": false,
    "created_at": "2026-01-12T08:00:00+07:00"
  }
}
```

**Database Operations (INSERT):**

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
  uuid_generate_v4(),
  $1, -- user_id dari JWT token
  $2, -- lead_id dari request body
  $3, -- remind_at dari request body
  $4, -- message dari request body
  false,
  NOW()
) RETURNING *;
```

**Validation Logic:**

1. Check if `lead_id` exists and `assigned_to` matches the currently logged-in user
2. Check if `remind_at` is in the future
3. Check that no duplicate reminder exists for the same lead at the same time

---

## 4. Update Reminder API

### 4.1 Complete/Update Reminder

**API Design:**

- **Endpoint:** `/api/v1/reminders/{reminder_id}`
- **Method:** `PUT`
- **Primary Function:** Updates a reminder's status or edits the reminder schedule

**Request Payload (Request Body):**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `is_completed` | boolean | No | true/false | Mark reminder as completed |
| `remind_at` | ISO 8601 timestamp | No | Must be future time | Update jadwal reminder |
| `message` | string | No | Max 500 chars | Update pesan reminder |

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

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "440e8400-e29b-41d4-a716-446655440000",
    "lead_id": "660e8400-e29b-41d4-a716-446655440000",
    "remind_at": "2026-01-16T14:00:00+07:00",
    "message": "Reschedule - client meminta waktu yang lebih fleksibel",
    "is_completed": false,
    "created_at": "2026-01-12T08:00:00+07:00"
  }
}
```

**Database Operations (UPDATE):**

```sql
UPDATE reminder_schedules
SET 
  is_completed = COALESCE($1, is_completed),
  remind_at = COALESCE($2, remind_at),
  message = COALESCE($3, message)
WHERE id = $4
  AND user_id = $5
RETURNING *;
```

**Validation Logic:**

1. Check if the reminder with the given ID exists and belongs to the currently logged-in user
2. If updating `remind_at`, ensure the new time is in the future
3. Check that the reminder has not been deleted (no soft delete, but verify the record exists)

---

## 5. Delete Reminder API

### 5.1 Delete Reminder

**API Design:**

- **Endpoint:** `/api/v1/reminders/{reminder_id}`
- **Method:** `DELETE`
- **Primary Function:** Deletes a reminder that is no longer needed

**Request Payload:** None (params in URL)

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "deleted": true
  }
}
```

**Database Operations (DELETE):**

```sql
DELETE FROM reminder_schedules
WHERE id = $1
  AND user_id = $2
RETURNING id;
```

---

## 6. Error Response Format

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

**Common Error Codes:**

| Code | HTTP Status | Description |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing JWT token |
| `FORBIDDEN` | 403 | Resource not owned by user |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 7. Summary - Database Impact Matrix

| Endpoint | Method | Tables | Operations |
| --- | --- | --- | --- |
| `/dashboard/overview` | GET | `leads` | SELECT (aggregate) |
| `/reminders/upcoming` | GET | `reminder_schedules`, `leads`, `properties` | SELECT with JOIN |
| `/reminders` | POST | `reminder_schedules`, `leads` | INSERT + validation SELECT |
| `/reminders/{id}` | PUT | `reminder_schedules` | UPDATE |
| `/reminders/{id}` | DELETE | `reminder_schedules` | DELETE |

---

*Document Version: 1.0*  

*Created: 2026-01-12*  

*Reference: BRD, FSD, ERD, UISD*
