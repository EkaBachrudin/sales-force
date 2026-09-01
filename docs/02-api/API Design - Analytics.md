# API Design - Analytics

## Overview

This API is used to retrieve analytics and metrics data for the sales performance dashboard.

### Authentication & Authorization

All endpoints below are **Private**. Each request requires:

1. **Authentication:** Header `Authorization: Bearer <token>` (User must be logged in).
2. **Authorization:** Only users with the **`Admin`**, **`Supervisor`**, or **`Sales`** role can access these endpoints. Other roles will receive a `403 Forbidden` error.
3. **Subscription Check:** The user must have an *active subscription* status to access these endpoints. Otherwise, a `401` or `403` error is returned depending on the middleware configuration.

### Role-Based Data Visibility (RBAC)

The analytics data returned is restricted based on the user's role:

| Role | Data Scope |
| --- | --- |
| `Admin` | Views statistics for **all** leads in the system (ownership filter is bypassed). |
| `Supervisor` | Views statistics for **all** leads in the system (ownership filter is bypassed). |
| `Sales` | Only views statistics for leads **assigned to them** (`assigned_to` = user ID). |

Implementation: each query uses a boolean parameter `is_privileged`. For `Admin`/`Supervisor`, it is set to `true`, bypassing the `assigned_to` condition; for `Sales`, it is set to `false`, keeping the `assigned_to = current_user_id` filter in effect.

---

## 1. Get Analytics Metrics

### Endpoint

```
GET /api/v1/analytics/metrics
```

### Description

Retrieves conversion and sales performance metrics in real time.

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| period | string | No | Time period: `today`, `week`, `month`, `year` (default: `month`) |
| compare_with | string | No | Comparison period: `previous_period`, `last_year` (default: `previous_period`) |

### Response

```json
{
  "success": true,
  "data": {
    "conversion_rate": {
      "value": 32.5,
      "unit": "%",
      "trend": {
        "value": "2",
        "is_positive": true,
        "label": "vs last month"
      }
    },
    "avg_time_to_close": {
      "value": 18,
      "unit": "days",
      "trend": {
        "value": "3",
        "is_positive": true,
        "label": "3 days faster"
      }
    },
    "response_time": {
      "value": 4.2,
      "unit": "hrs",
      "trend": {
        "value": "1.1",
        "is_positive": true,
        "label": "1.1 hrs faster"
      }
    },
    "follow_up_rate": {
      "value": 82,
      "unit": "%",
      "trend": {
        "value": "5",
        "is_positive": true,
        "label": "% increase"
      }
    }
  }
}
```

### Data Sources (Table & Columns)

| Metric | Table | Columns |
| --- | --- | --- |
| Conversion Rate | `leads` | `status`, `created_at` |
| Avg Time to Close | `leads` | `status`, `created_at`, `updated_at` |
| Response Time | `lead_activities`, `leads` | `activity_type`, `old_status`, `created_at` |
| Follow-up Rate | `leads` | `last_followed_up_at`, `created_at` |

**SQL Query Reference:**

```sql
-- Conversion Rate = (Closed Leads / Total Leads) * 100
-- $1 = current user id, $2 = is_privileged (true untuk Admin/Supervisor, false untuk Sales)
SELECT
  COUNT(*) FILTER (WHERE status = 'closed') * 100.0 / NULLIF(COUNT(*), 0) as conversion_rate
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND created_at >= $3
  AND created_at <= $4;

-- Avg Time to Close (in days)
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days
FROM leads
WHERE status = 'closed'
  AND (assigned_to = $1 OR $2::boolean)
  AND created_at >= $3
  AND created_at <= $4;

-- Response Time (avg hours from lead created to first status change from 'new')
SELECT
  AVG(EXTRACT(EPOCH FROM (la.created_at - l.created_at)) / 3600) as avg_hours
FROM lead_activities la
JOIN leads l ON la.lead_id = l.id
WHERE (l.assigned_to = $1 OR $2::boolean)
  AND l.created_at >= $3
  AND l.created_at <= $4
  AND la.activity_type = 'status_change'
  AND la.old_status = 'new';

-- Follow-up Rate (Leads that have been followed up at least once)
SELECT
  COUNT(*) FILTER (WHERE last_followed_up_at IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as follow_up_rate
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND created_at >= $3
  AND created_at <= $4;
```

---

## 2. Get Funnel Data

### Endpoint

```
GET /api/v1/analytics/funnel
```

### Description

Retrieves funnel data based on lead stages. This endpoint always returns the 6 main stages even if their counts are 0.

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| period | string | No | Time period: `today`, `week`, `month`, `year` (default: `month`) |

### Response

```json
{
  "success": true,
  "data": {
    "funnel": [
      { "stage": "new", "count": 45, "label": "Baru Masuk", "color": "#9CA3AF" },
      { "stage": "contacted", "count": 32, "label": "Dikontak", "color": "#3B82F6" },
      { "stage": "surveyed", "count": 18, "label": "Survey", "color": "#8B5CF6" },
      { "stage": "negotiating", "count": 12, "label": "Negosiasi", "color": "#F59E0B" },
      { "stage": "closed", "count": 8, "label": "Closing", "color": "#10B981" },
      { "stage": "cancelled", "count": 5, "label": "Batal", "color": "#EF4444" }
    ],
    "total": 120
  }
}
```

### Data Sources (Table & Columns)

| Data | Table | Columns |
| --- | --- | --- |
| Funnel by Stage | `leads` | `status`, `created_at` |

**SQL Query Reference:**

```sql
-- $1 = current user id, $2 = is_privileged (true untuk Admin/Supervisor, false untuk Sales)
SELECT
  status as stage,
  COUNT(*) as count
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND created_at >= $3
  AND created_at <= $4
GROUP BY status
ORDER BY
  CASE status
    WHEN 'new' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'surveyed' THEN 3
    WHEN 'negotiating' THEN 4
    WHEN 'closed' THEN 5
    WHEN 'cancelled' THEN 6
  END;
```

---

## 3. Get Monthly Closing Trend

### Endpoint

```
GET /api/v1/analytics/trend
```

### Description

Retrieves monthly closing trend data for the last several months in chronological order.

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| months | integer | No | Number of months to look back (default: 6, max: 12) |

### Response

```json
{
  "success": true,
  "data": {
    "trend": [
      { "month": "Aug", "closings": 5 },
      { "month": "Sep", "closings": 6 },
      { "month": "Oct", "closings": 8 },
      { "month": "Nov", "closings": 7 },
      { "month": "Dec", "closings": 10 },
      { "month": "Jan", "closings": 8 }
    ]
  }
}
```

### Data Sources (Table & Columns)

| Data | Table | Columns |
| --- | --- | --- |
| Monthly Closings | `leads` | `status`, `created_at` |

**SQL Query Reference:**

```sql
-- $1 = current user id, $2 = is_privileged (true untuk Admin/Supervisor, false untuk Sales)
SELECT
  TO_CHAR(created_at, 'Mon') as month,
  EXTRACT(MONTH FROM created_at) as month_num,
  COUNT(*) as closings
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND status = 'closed'
  AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
ORDER BY EXTRACT(MONTH FROM created_at) DESC
LIMIT $3;
-- Note: Results are reversed in application logic to return chronological order
```

---

## 4. Get Source Breakdown

### Endpoint

```
GET /api/v1/analytics/sources
```

### Description

Retrieves lead breakdown by source. If the source is empty or null, it is grouped under "Other".

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| period | string | No | Time period: `today`, `week`, `month`, `year` (default: `month`) |

### Response

```json
{
  "success": true,
  "data": {
    "sources": [
      { "source": "Website", "count": 45, "color": "#2563EB" },
      { "source": "Instagram", "count": 32, "color": "#EC4899" },
      { "source": "Facebook", "count": 28, "color": "#3B82F6" },
      { "source": "Whatsapp", "count": 22, "color": "#10B981" },
      { "source": "Referral", "count": 18, "color": "#F59E0B" },
      { "source": "Other", "count": 12, "color": "#6B7280" }
    ],
    "total": 157
  }
}
```

*(Note: Colors are dynamic based on the `SOURCE_COLORS` mapping in the service, including for `landing_page`, `manual`, `visit`, etc.)*

### Data Sources (Table & Columns)

| Data | Table | Columns |
| --- | --- | --- |
| Source Breakdown | `leads` | `source`, `created_at` |

**SQL Query Reference:**

```sql
-- $1 = current user id, $2 = is_privileged (true untuk Admin/Supervisor, false untuk Sales)
SELECT
  COALESCE(source, 'Other') as source,
  COUNT(*) as count
FROM leads
WHERE (assigned_to = $1 OR $2::boolean)
  AND created_at >= $3
  AND created_at <= $4
GROUP BY source
ORDER BY count DESC;
```

---

## 5. Get Complete Analytics Dashboard

### Endpoint

```
GET /api/v1/analytics/dashboard
```

### Description

A single endpoint that retrieves all analytics data at once (metrics, funnel, trend, sources). This endpoint runs all 4 queries in parallel using `Promise.all`.

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| period | string | No | Time period: `today`, `week`, `month`, `year` (default: `month`) |
| trend_months | integer | No | Number of months for the trend (default: 6, max: 12) |
| data_range_months | integer | No | If provided, **overrides** the `period` logic for Metrics, Funnel, and Sources data. Fetches data based on the specified number of months looking back (default: undefined, max: 24) |

### Response

```json
{
  "success": true,
  "data": {
    "metrics": {
      "conversion_rate": { "...": "..." },
      "avg_time_to_close": { "...": "..." },
      "response_time": { "...": "..." },
      "follow_up_rate": { "...": "..." }
    },
    "funnel": {
      "funnel": [ "..."" ],
      "total": 120
    },
    "trend": {
      "trend": [ "..." ]
    },
    "sources": {
      "sources": [ "..." ],
      "total": 157
    }
  }
}
```

---

## Error Responses

### 400 Bad Request

Returned when query parameters fail validation.

```json
// Example: Invalid period
{
  "success": false,
  "error": "Invalid period parameter. Allowed: today, week, month, year"
}

// Example: Trend months out of range
{
  "success": false,
  "error": "Months parameter must be between 1 and 12"
}

// Example: Data range months out of range
{
  "success": false,
  "error": "Data range months parameter must be between 1 and 24"
}
```

### 401 Unauthorized

Returned when the token is missing, invalid, or the user does not have an active subscription (based on the `authenticate` and `subscriptionCheck` middleware).

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden

Returned when the user does not have an authorized role (`Admin`, `Supervisor`, or `Sales`).

```json
{
  "status": "error",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

Returned when the user ID from the token is not found in the database.

```json
{
  "success": false,
  "error": "User not found"
}
```

### 500 Internal Server Error

Returned when a database logic error or other server error occurs.

```json
{
  "success": false,
  "error": "<error_message_from_catch_block>"
}
```

---

## Related Documents

- ERD - Sales Force Automation System
