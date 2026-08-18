# API Design - Properties

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Properties Management |
| **Version** | 1.1 |
| **Last Updated** | 2026-07-02 |
| **Related Docs** | [BRD](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f) \ |

---

## 2. Page Overview

The **Properties Module** allows users to manage their own property types for leads management.

### 2.1 Properties List View (Filter Dropdown & Property List)

- **Route**: `/properties`
- **Purpose**: Display user's properties as filter dropdown options
- **Features**:
    - Only properties owned by logged-in user
    - Simple list for dropdown filtering
    - No pagination (users typically have limited properties)
- **UI Component**: Dropdown/Select options

### 2.2 Create Property View

- **Route**: `/properties` (popup view)
- **Purpose**: Add new property type
- **Features**:
    - Simple form with minimal fields
    - Only user inputs: `name` and `property_type`
    - Auto-assign to logged-in user
- **UI Component**: Modal form

---

## 3. API Design

### 3.1 GET /api/v1/properties - Get User Properties (Dropdown Filter & Property List)

**Purpose**: Retrieve list of properties owned by current user for dropdown filter

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `search` | string | No | - | Search by property name |

**Request Example**:

```jsx
GET /api/v1/properties
```

**Response Structure**:

```json
{
    "success": true,
    "data": {
        "properties": [
            {
                "id": "3a8713e4-44dc-4e49-a074-8e106a8e0bdf",
                "name": "Apartemen Sudirman Park 1BR",
                "property_type": "Apartemen",
                "created_at": "2026-07-02T09:01:57.090Z"
            }
        ]
    }
}
```

**Data Mapping**:

| Response Field | Database Table | Database Column | Mapping Logic |
| --- | --- | --- | --- |
| `id` | `properties` | `id` | Direct mapping |
| `name` | `properties` | `name` | Direct mapping |
| `property_type` | `properties` | `property_type` | Direct mapping |
| `created_at` | `properties` | `created_at` | Direct mapping |

**Database Query**:

```sql
SELECT
      id,
      name,
      property_type,
      created_at
    FROM properties
    ${whereClause}
    ORDER BY name ASC
```

**Security Notes**:

- Filter by `created_by` ensures users only see their own properties
- User ID extracted from JWT token in authentication middleware

---

### 3.2 POST /api/v1/properties - Create New Property

**Purpose**: Create a new property type for the logged-in user

**Method**: `POST`

**Request Body**:

```json
{
  "name": "Cluster B Type 45/72",
  "property_type": "Rumah Tapak"
}
```

**Request Payload Fields**:

| Field | Type | Required | Database Table | Database Column | Validation |
| --- | --- | --- | --- | --- | --- |
| `name` | string | Yes | `properties` | `name` | Max 100 chars, unique per user |
| `property_type` | string | Yes | `properties` | `property_type` | Max 50 chars |

**Validation Rules**:

- `name`: Required, max 100 characters, must be unique for the user
- `property_type`: Required, max 50 characters
- `created_by`: Auto-populated from JWT token

**Database Impact - INSERT Operation**:

```sql
 INSERT INTO properties (
      id, name, property_type, assigned_to, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, NOW(), NOW()
    ) RETURNING *
```

---

### 3.3 PUT /api/v1/properties/:id - Update Property

**Purpose**: Update existing property (name and/or property_type)

**Method**: `PUT`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Property ID to update |

**Request Body**:

```json
{
  "name": "Cluster B Type 45/72 (Revised)",
  "property_type": "Rumah 2 Lantai"
}
```

**Database Impact - UPDATE Operation**:

```sql
 UPDATE properties
    SET name = COALESCE($2, name),
        property_type = COALESCE($3, property_type),
        updated_at = NOW()
    WHERE id = $1
      AND assigned_to = $4
    RETURNING *
```

---

### 3.4 DELETE /api/v1/properties/:id - Delete Property

**Purpose**: Soft delete a property (mark as deleted)

**Method**: `DELETE`

**Database Impact** 

```sql
DELETE FROM properties WHERE id = $1
```

---

## 4. Property Type Examples

| Property Type | Description |
| --- | --- |
| `Rumah Tapak` | Single-detached house |
| `Rumah 2 Lantai` | Two-story house |
| `Apartemen` | Apartment unit |
| `Ruko` | Shop-house |
| `Tanah Kavling` | Land plot |
| `Vila` | Villa/holiday home |

---

## 5. Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": ["Property name already exists"]
    }
  }
}
```

**Error Codes**:

| Code | HTTP Status | Description |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | No valid authentication token |
| `FORBIDDEN` | 403 | Property belongs to different user |
| `NOT_FOUND` | 404 | Property not found |

---

## 6. Integration with Leads Module

When creating a new lead, the `property_id` dropdown will:

1. Call `GET /api/v1/properties`
2. Filter results by logged-in user automatically
3. Display properties in dropdown format
4. Only show active properties (non-deleted)

---

## 7. Related Documents

- [BRD - Sales Force Automation System](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f)
- [ERD - Sales Force Automation System](https://www.notion.so/ERD-Sales-Force-Automation-System-2e4b2c42720c81608681d8ec647c6954)
- [API Design - Leads](https://www.notion.so/API-Design-Leads-2e6b2c42720c81049249fe6f831ec771)
- [API Design - Authentication](https://www.notion.so/API-Design-Authentication-Session-Management-2e7b2c42720c81a78f8aed7caba631db)

---

*Document Version: 1.1 | Last Updated: 2026-07-02*