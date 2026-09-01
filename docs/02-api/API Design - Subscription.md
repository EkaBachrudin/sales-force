# API Design - Subscription

API endpoints for managing subscriptions in the Sales Force system.

---

## Base URL

```
/api/v1/subscriptions
```

---

## Authentication

All endpoints require:

- **Authentication**: Bearer Token (JWT)
- **Authorization**: Admin Role Only (`adminOnly` middleware)

---

## Endpoints

### 1. List Subscriptions

Get all subscriptions with pagination and filtering capabilities.

```
GET /api/v1/subscriptions
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 50 | Items per page |
| `user_id` | string | No | - | Filter by user ID |
| `status` | string | No | - | Filter by status: `pending`, `active`, `overdue`, `cancelled` |
| `subscription_type` | string | No | - | Filter by type: `monthly`, `quarterly`, `annual` |
| `sort_by` | string | No | `created_at` | Sort field: `created_at`, `due_date`, `amount` |
| `sort_order` | string | No | `desc` | Sort order: `asc`, `desc` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "uuid",
        "user_id": "user-uuid",
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "subscription_type": "monthly",
        "amount": 500000,
        "period_start": "2024-01-25T00:00:00Z",
        "period_end": "2024-02-25T00:00:00Z",
        "due_date": "2024-01-25T00:00:00Z",
        "status": "active",
        "notes": "Monthly subscription",
        "created_at": "2024-01-25T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 50,
      "pages": 1
    }
  }
}
```

---

### 2. Get Subscription Detail

Get detailed information about a specific subscription.

```
GET /api/v1/subscriptions/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Subscription UUID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "user-uuid",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "subscription_type": "monthly",
    "amount": 500000,
    "period_start": "2024-01-25T00:00:00Z",
    "period_end": "2024-02-25T00:00:00Z",
    "due_date": "2024-01-25T00:00:00Z",
    "status": "active",
    "notes": "Monthly subscription",
    "created_at": "2024-01-25T00:00:00Z"
  }
}
```

---

### 3. Create Subscription

Create a new subscription.

```
POST /api/v1/subscriptions
```

**Request Body:**

```json
{
  "user_id": "user-uuid",
  "subscription_type": "monthly",
  "amount": 500000,
  "due_date": "2024-01-25",
  "notes": "Monthly subscription payment"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `user_id` | string | Yes | User UUID (must exist and not empty) |
| `subscription_type` | string | Yes | Type: `monthly`, `quarterly`, `annual` |
| `amount` | number | Yes | Subscription amount in IDR (must be > 0) |
| `due_date` | string | Yes | Due date (ISO 8601 format) |
| `notes` | string | No | Additional notes |

**Notes:**

- `period_start` is automatically set to the same value as `due_date`
- `period_end` is calculated automatically based on `subscription_type`:
    - `monthly`: +1 month
    - `quarterly`: +3 months
    - `annual`: +1 year
- `status` is automatically set to `pending`

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "id": "uuid",
      "user_id": "user-uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "subscription_type": "monthly",
      "amount": 500000,
      "period_start": "2024-01-25T00:00:00Z",
      "period_end": "2024-02-25T00:00:00Z",
      "due_date": "2024-01-25T00:00:00Z",
      "status": "pending",
      "notes": "Monthly subscription payment",
      "created_at": "2024-01-25T00:00:00Z"
    }
  }
}
```

---

### 4. Update Subscription

Update an existing subscription.

```
PUT /api/v1/subscriptions/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Subscription UUID |

**Request Body:**

```json
{
  "subscription_type": "quarterly",
  "amount": 1500000,
  "due_date": "2024-02-25",
  "status": "active",
  "notes": "Updated to quarterly"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `subscription_type` | string | No | New subscription type |
| `amount` | number | No | New amount (must be > 0 if provided) |
| `due_date` | string | No | New due date (ISO 8601 format) |
| `status` | string | No | New status: `pending`, `active`, `overdue`, `cancelled` |
| `notes` | string | No | New or updated notes |

**Notes:**

- At least one field must be provided
- If `due_date` is updated, `period_start` and `period_end` are recalculated
- If only `subscription_type` is changed, `period_end` is recalculated based on current `period_start`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "subscription": {
      "id": "uuid",
      "user_id": "user-uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "subscription_type": "quarterly",
      "amount": 1500000,
      "period_start": "2024-02-25T00:00:00Z",
      "period_end": "2024-05-25T00:00:00Z",
      "due_date": "2024-02-25T00:00:00Z",
      "status": "active",
      "notes": "Updated to quarterly",
      "created_at": "2024-01-25T00:00:00Z"
    }
  }
}
```

---

### 5. Delete Subscription

Delete a subscription.

```
DELETE /api/v1/subscriptions/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Subscription UUID |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Subscription deleted successfully"
}
```

---

## Data Models

### SubscriptionListItem Object

This object is returned by all endpoints.

```tsx
interface SubscriptionListItem {
  id: string;                      // UUID
  user_id: string;                 // User UUID
  user_name?: string;              // User full name (from JOIN)
  user_email?: string;             // User email (from JOIN)
  subscription_type: SubscriptionType;
  amount: number;                  // Amount in IDR
  period_start?: Date;             // Period start date (auto-calculated)
  period_end?: Date;               // Period end date (auto-calculated)
  due_date: Date;                  // Payment due date
  status: SubscriptionStatus;      // Status
  notes?: string;                  // Additional notes
  created_at: Date;                // Creation timestamp
}
```

---

## Enums

### SubscriptionType

```tsx
enum SubscriptionType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}
```

### SubscriptionStatus

```tsx
enum SubscriptionStatus {
  PENDING = 'pending',      // Initial state, awaiting payment
  ACTIVE = 'active',        // Paid and active
  OVERDUE = 'overdue',      // Payment overdue
  CANCELLED = 'cancelled',  // Subscription cancelled
}
```

---

## Period Calculation Logic

Period dates are automatically calculated based on subscription type:

| Subscription Type | Duration |
| --- | --- |
| `monthly` | +1 month from `period_start` |
| `quarterly` | +3 months from `period_start` |
| `annual` | +1 year from `period_start` |
- **On Create**: `period_start` = `due_date`, `period_end` calculated based on type
- **On Update (due_date changed)**: Both `period_start` and `period_end` recalculated
- **On Update (only type changed)**: `period_end` recalculated from current `period_start`

---

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Admin access required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Subscription not found"
}
```

```json
{
  "success": false,
  "error": "User not found"
}
```

### 400 Bad Request

```json
{
  "success": false,
  "error": "User is required"
}
```

```json
{
  "success": false,
  "error": "Subscription type is required"
}
```

```json
{
  "success": false,
  "error": "Amount must be greater than 0"
}
```

```json
{
  "success": false,
  "error": "Due date is required"
}
```

```json
{
  "success": false,
  "error": "Invalid subscription type. Must be monthly, quarterly, or annual"
}
```

```json
{
  "success": false,
  "error": "No fields to update"
}
```

---

## Changes Made

| Area | Before | After |
| --- | --- | --- |
| Default `limit` | 10 | 50 |
| Default `sort_order` | - (none) | `desc` |
| Default `sort_by` | - (none) | `created_at` |
| Response structure List | `data.data` | `data.subscriptions` |
| Response Detail | Without `user_name`, `user_email` | With `user_name`, `user_email` |
| Response Create/Update | Uses `...` | Complete response |
| Data Models | 2 separate models | 1 model (`SubscriptionListItem`) |
| Period calculation | Undocumented | Added dedicated section |
| Validation errors | 4 errors | 9 errors (comprehensive) |
| Auto-calculated fields | Not mentioned | Clearly documented |