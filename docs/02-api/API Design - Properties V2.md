# API Design - Properties V2

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Properties Management |
| **Version** | 2.3 |
| **Last Updated** | 2026-08-28 |
| **Related Docs** | ERD - Sales Force Automation System |
| **Base URL** | `/api/v1` |

---

## 2. Page Overview

### 2.1 Properties List View

- **Route**: `/properties`
- **Purpose**: Displays a list of all properties belonging to the logged-in user
- **Features**: Property list with pagination, search, city filter

### 2.2 Property Detail View

- **Route**: `/properties/:id`
- **Purpose**: Displays property details along with its blocks
- **Features**: Property edit form + list of blocks below

### 2.3 Block Detail View (Units List)

- **Route**: `/properties/:id/blocks/:blockId`
- **Purpose**: Displays a list of units within a block
- **Features**: Unit list with availability status

### 2.4 Siteplan View

- **Route**: `/properties/:id/siteplan`
- **Purpose**: Displays an interactive siteplan image with unit overlays
- **Features**: SVG siteplan image + unit list (land_area, status) for frontend mapping

### 2.5 Unit Detail View

- **Route**: `/units/:id`
- **Purpose**: Displays unit details and assigned leads
- **Features**: Unit details + related lead information

---

## 3. API Design — Properties

### 3.1 GET /api/v1/properties — Get Properties List

**Purpose**: Displays all properties available to the authenticated user with an active subscription

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `page` | integer | No | `1` | Page number |
| `limit` | integer | No | `10` | Number of items per page (max 50) |
| `search` | string | No | - | Search by property name |
| `city` | string | No | - | Filter by city |

**Request Example**:

```
GET /api/v1/properties?page=1&limit=10&search=Grand&city=Jakarta
```

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "properties": [
            {
                "id": "3a8713e4-44dc-4e49-a074-8e106a8e0bdf",
                "name": "Grand Permata Residence",
                "city": "Jakarta",
                "land_area": 5000.00,
                "address": "Jl. Permata Raya No. 1, Jakarta Selatan",
                "description": "Cluster premium di Jakarta Selatan",
                "siteplan_assets": "/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg",
                "is_active": true,
                "total_blocks": 5,
                "total_units": 120,
                "created_at": "2026-07-02T09:01:57.090Z",
                "updated_at": "2026-07-02T09:01:57.090Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total_items": 25,
            "total_pages": 3
        }
    }
}
```

**Data Mapping**:

| Response Field | DB Table | DB Column | Mapping Logic |
| --- | --- | --- | --- |
| `id` | `properties` | `id` | Direct |
| `name` | `properties` | `name` | Direct |
| `city` | `properties` | `city` | Direct |
| `land_area` | `properties` | `land_area` | Direct (numeric) |
| `address` | `properties` | `address` | Direct |
| `description` | `properties` | `description` | Direct |
| `siteplan_assets` | `properties` | `siteplan_assets` | Direct — relative path of the uploaded SVG file |
| `is_active` | `properties` | `is_active` | Direct |
| `total_blocks` | `blocks` | - | `COUNT(blocks.id)` WHERE `property_id` = property.id |
| `total_units` | `units` (via blocks) | - | `COUNT(units.id)` JOIN blocks WHERE `property_id` = property.id |
| `created_at` | `properties` | `created_at` | Direct |
| `updated_at` | `properties` | `updated_at` | Direct |

**Database Query**:

```sql
SELECT
    p.id,
    p.name,
    p.city,
    p.land_area,
    p.address,
    p.description,
    p.siteplan_assets,
    p.is_active,
    p.created_at,
    p.updated_at,
    COALESCE(bc.block_count, 0) AS total_blocks,
    COALESCE(uc.unit_count, 0) AS total_units
FROM properties p
LEFT JOIN (
    SELECT property_id, COUNT(id) AS block_count
    FROM blocks
    WHERE is_active = true
    GROUP BY property_id
) bc ON bc.property_id = p.id
LEFT JOIN (
    SELECT b.property_id, COUNT(u.id) AS unit_count
    FROM blocks b
    JOIN units u ON u.block_id = b.id
    GROUP BY b.property_id
) uc ON uc.property_id = p.id
ORDER BY p.name ASC
LIMIT $1 OFFSET $2
```

**Security Notes**:
- Users must have an active subscription to access this endpoint

---

### 3.2 POST /api/v1/properties — Add New Property

**Purpose**: Adds a new property

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Request Body (Form Fields)**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `name` | string (form field) | Yes | `name` | Max 255 chars, NOT NULL |
| `city` | string (form field) | Yes | `city` | Max 100 chars, NOT NULL |
| `land_area` | string (form field) | No | `land_area` | Numeric(10,2), >= 0, in m² |
| `address` | string (form field) | No | `address` | Text |
| `description` | string (form field) | No | `description` | Text |
| `siteplan_file` | file (form file) | No | `siteplan_assets` | SVG only (`image/svg+xml`), max 5MB |

**Request Example**:

```
POST /api/v1/properties
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="name"

Grand Permata Residence
------WebKitFormBoundary
Content-Disposition: form-data; name="city"

Jakarta
------WebKitFormBoundary
Content-Disposition: form-data; name="land_area"

5000.00
------WebKitFormBoundary
Content-Disposition: form-data; name="address"

Jl. Permata Raya No. 1, Jakarta Selatan
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Cluster premium di Jakarta Selatan dengan fasilitas lengkap
------WebKitFormBoundary
Content-Disposition: form-data; name="siteplan_file"; filename="siteplan.svg"
Content-Type: image/svg+xml

<SVG file content...>
------WebKitFormBoundary--
```

**Validation Rules**:
- `name`: Required, max 255 characters
- `city`: Required, max 100 characters
- `land_area`: Optional, if provided must be a number >= 0
- `address`: Optional
- `description`: Optional
- `siteplan_file`: Optional, but if provided:
- Only accepts MIME type `image/svg+xml`
- Maximum size **5MB** (5,242,880 bytes)
- File will be renamed to format: `{UUID}-{timestamp}.svg`
- Stored at path: `public/uploads/siteplans/`
- Value saved to database: `/uploads/siteplans/{UUID}-{timestamp}.svg`
- `assigned_to`: Auto-populated from JWT token
- `is_active`: Default `true`

**Success Response** `201`:

```json
{
    "success": true,
    "data": {
        "property": {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Grand Permata Residence",
            "city": "Jakarta",
            "land_area": 5000.00,
            "address": "Jl. Permata Raya No. 1, Jakarta Selatan",
            "description": "Cluster premium di Jakarta Selatan dengan fasilitas lengkap",
            "siteplan_assets": "/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg",
            "is_active": true,
            "created_at": "2026-07-10T10:00:00.000Z",
            "updated_at": "2026-07-10T10:00:00.000Z"
        }
    }
}
```

**Success Response** `201` (without siteplan upload):

```json
{
    "success": true,
    "data": {
        "property": {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Grand Permata Residence",
            "city": "Jakarta",
            "land_area": 5000.00,
            "address": "Jl. Permata Raya No. 1, Jakarta Selatan",
            "description": "Cluster premium di Jakarta Selatan dengan fasilitas lengkap",
            "siteplan_assets": null,
            "is_active": true,
            "created_at": "2026-07-10T10:00:00.000Z",
            "updated_at": "2026-07-10T10:00:00.000Z"
        }
    }
}
```

**Database Impact — INSERT**:

```sql
INSERT INTO properties (
    id, name, city, land_area, address, description,
    siteplan_assets, assigned_to, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
) RETURNING *
```

> **Note**: `$6` will contain the relative file path (e.g., `/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg`) if a file is uploaded, or `NULL` if no file is provided.
> 

**Security Notes**:
- **RBAC Restriction**: Endpoint can only be accessed by users with the **Admin** or **Supervisor** role
- Users with other roles (e.g., **Sales**) will be rejected with **403 Forbidden** (`FORBIDDEN`, message: "Insufficient permissions")
- Authentication is still required (401 if token is invalid/missing) and an active subscription is required, same as other endpoints
- Role is checked from the JWT token after `authenticate`, before `subscriptionCheck`/file upload — unauthorized users will not trigger file parsing

---

### 3.3 GET /api/v1/properties/:id — Get Property Detail (with Blocks)

**Purpose**: Retrieves property details along with the list of blocks within it (used during editing)

**Method**: `GET`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Property ID |

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "property": {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Grand Permata Residence",
            "city": "Jakarta",
            "land_area": 5000.00,
            "address": "Jl. Permata Raya No. 1, Jakarta Selatan",
            "description": "Cluster premium di Jakarta Selatan dengan fasilitas lengkap",
            "siteplan_assets": "/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg",
            "is_active": true,
            "created_at": "2026-07-10T10:00:00.000Z",
            "updated_at": "2026-07-10T10:00:00.000Z"
        },
        "blocks": [
            {
                "id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
                "name": "Block Anggrek",
                "is_active": true,
                "total_units": 24,
                "created_at": "2026-07-10T10:05:00.000Z",
                "updated_at": "2026-07-10T10:05:00.000Z"
            },
            {
                "id": "c2d3e4f5-a6b7-8901-cdef-123456789012",
                "name": "Block Mawar",
                "is_active": true,
                "total_units": 20,
                "created_at": "2026-07-10T10:06:00.000Z",
                "updated_at": "2026-07-10T10:06:00.000Z"
            }
        ]
    }
}
```

**Data Mapping — blocks**:

| Response Field | DB Column | Mapping Logic |
| --- | --- | --- |
| `id` | `blocks.id` | Direct |
| `name` | `blocks.name` | Direct |
| `is_active` | `blocks.is_active` | Direct |
| `total_units` | - | `COUNT(units.id)` WHERE `block_id` = block.id |
| `created_at` | `blocks.created_at` | Direct |
| `updated_at` | `blocks.updated_at` | Direct |

**Database Query**:

```sql
-- Property detail
SELECT * FROM properties
WHERE id = $1 AND assigned_to = $2;

-- Blocks with unit count
SELECT
    b.id,
    b.name,
    b.is_active,
    b.created_at,
    b.updated_at,
    COALESCE(uc.unit_count, 0) AS total_units
FROM blocks b
LEFT JOIN (
    SELECT block_id, COUNT(id) AS unit_count
    FROM units
    GROUP BY block_id
) uc ON uc.block_id = b.id
WHERE b.property_id = $1
ORDER BY b.name ASC
```

---

### 3.4 PUT /api/v1/properties/:id — Edit Property

**Purpose**: Updates property data (fields are the same as add new property)

**Method**: `PUT`

**Content-Type**: `multipart/form-data`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Property ID |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `delete_siteplan` | boolean | No | `false` | Set to true to delete an existing siteplan |

**Request Body (Form Fields)**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `name` | string (form field) | No | `name` | Max 255 chars |
| `city` | string (form field) | No | `city` | Max 100 chars |
| `land_area` | string (form field) | No | `land_area` | Numeric(10,2), >= 0, in m² |
| `address` | string (form field) | No | `address` | Text |
| `description` | string (form field) | No | `description` | Text |
| `siteplan_file` | file (form file) | No | `siteplan_assets` | SVG only (`image/svg+xml`), max 5MB |

**Request Example**:

```
PUT /api/v1/properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="name"

Grand Permata Residence Phase 2
------WebKitFormBoundary
Content-Disposition: form-data; name="city"

Tangerang
------WebKitFormBoundary
Content-Disposition: form-data; name="land_area"

7500.00
------WebKitFormBoundary
Content-Disposition: form-data; name="address"

Jl. Permata Raya No. 2, Tangerang Selatan
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Cluster premium fase 2 dengan tambahan fasilitas
------WebKitFormBoundary
Content-Disposition: form-data; name="siteplan_file"; filename="siteplan-v2.svg"
Content-Type: image/svg+xml

<SVG file content...>
------WebKitFormBoundary--
```

**Validation Rules**:
- All fields are optional (partial update)
- If `name` is provided, max 255 characters
- If `city` is provided, max 100 characters
- If `land_area` is provided, must be a number >= 0
- At least 1 field (form field, file, or query param) must be provided
- **Query Parameter Rules**:
- If `delete_siteplan = true` and `siteplan_file` is provided → return error 400 `VALIDATION_ERROR`
- If `delete_siteplan = true` and no existing siteplan → ignore (graceful no-op)
- If `siteplan_file` is provided:
- Only accepts MIME type `image/svg+xml`
- Maximum size **5MB** (5,242,880 bytes)
- File will be renamed to format: `{UUID}-{timestamp}.svg`
- Stored at path: `public/uploads/siteplans/`
- **Old file will be deleted** from disk before saving the new file
- If no old file exists (NULL), deletion is skipped
- If `siteplan_file` is **not** provided and `delete_siteplan = false`, `siteplan_assets` in the database **remains unchanged** (not set to NULL)
- If `delete_siteplan = true` and no `siteplan_file` is provided, the existing siteplan will be deleted from disk and `siteplan_assets` in the database will be set to NULL
- **Ownership rules**: Admin & Supervisor can edit any property including those they don't own. Other roles can only edit their own properties (ownership check via `assigned_to` in the service layer)

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "property": {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Grand Permata Residence Phase 2",
            "city": "Tangerang",
            "land_area": 7500.00,
            "address": "Jl. Permata Raya No. 2, Tangerang Selatan",
            "description": "Cluster premium fase 2 dengan tambahan fasilitas",
            "siteplan_assets": "/uploads/siteplans/661f9500-f30c-52e5-b827-557766551111-1700000000.svg",
            "is_active": true,
            "created_at": "2026-07-10T10:00:00.000Z",
            "updated_at": "2026-07-10T12:30:00.000Z"
        }
    }
}
```

**Success Response** `200` (update without uploading a new siteplan):

```json
{
    "success": true,
    "data": {
        "property": {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Grand Permata Residence Phase 2",
            "city": "Tangerang",
            "land_area": 7500.00,
            "address": "Jl. Permata Raya No. 2, Tangerang Selatan",
            "description": "Cluster premium fase 2 dengan tambahan fasilitas",
            "siteplan_assets": "/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg",
            "is_active": true,
            "created_at": "2026-07-10T10:00:00.000Z",
            "updated_at": "2026-07-10T12:30:00.000Z"
        }
    }
}
```

**Database Impact — UPDATE**:

```sql
UPDATE properties
SET name = COALESCE($1, name),
    city = COALESCE($2, city),
    land_area = COALESCE($3, land_area),
    address = COALESCE($4, address),
    description = COALESCE($5, description),
    siteplan_assets = $6,
    updated_at = NOW()
WHERE id = $7
RETURNING *
```

> **Note**: `$6` will contain:
- New file path if `siteplan_file` is uploaded
- `NULL` if `delete_siteplan = true`
- Previous `siteplan_assets` value if no siteplan change is made
>
Deletion of the old file from disk is performed in the service layer **before** the UPDATE query is executed.
>
> **Ownership validation** is performed in the service layer via SELECT before the UPDATE query is executed. **Admin** and **Supervisor** roles bypass the ownership check (`assigned_to`), so they can edit properties belonging to other users. Other roles can only edit their own properties.

**File Replacement Flow**:

```
PUT /api/v1/properties/:id with siteplan_file
│
├─ 1. Fetch old property data from DB (to get old file path)
│
├─ 2. If old siteplan_assets is not NULL:
│     └─ Delete old file from disk (public/uploads/siteplans/...)
│        └─ Error handling: if file not found on disk, ignore (no throw)
│
├─ 3. Save new file to disk (public/uploads/siteplans/{UUID}-{timestamp}.svg)
│
└─ 4. UPDATE database with new file path
```

**Siteplan Delete Flow**:

```
PUT /api/v1/properties/:id?delete_siteplan=true
│
├─ 1. Fetch old property data from DB (to get old file path)
│
├─ 2. If old siteplan_assets is not NULL:
│     └─ Delete old file from disk (public/uploads/siteplans/...)
│        └─ Error handling: if file not found on disk, ignore (no throw)
│
└─ 3. UPDATE database with siteplan_assets = NULL
```

**Security Notes**:
- **RBAC Restriction**: Endpoint can only be accessed by users with the **Admin** or **Supervisor** role
- Users with other roles (e.g., **Sales**) will be rejected with **403 Forbidden** (`FORBIDDEN`, message: "Insufficient permissions")
- Authentication is still required (401 if token is invalid/missing) and an active subscription is required, same as other endpoints
- Role is checked from the JWT token after `authenticate`, before `subscriptionCheck`/file upload — unauthorized users will not trigger file parsing
- **Ownership bypass**: Admin & Supervisor can edit properties belonging to other users (ownership check via `assigned_to` is bypassed for privileged roles)

**Error Response — Delete Siteplan Conflict**:

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Cannot delete siteplan and upload new file at the same time",
        "details": {
            "delete_siteplan": ["Cannot be true when siteplan_file is provided"]
        }
    }
}
```

---

### 3.5 DELETE /api/v1/properties/:id — Delete Property

**Purpose**: Deletes a property along with all its blocks and units (cascade)

**Method**: `DELETE`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Property ID |

**Success Response** `200`:

```json
{
    "success": true,
    "message": "Property deleted successfully"
}
```

**Database Impact — DELETE (Cascade)**:

```sql
-- ON DELETE CASCADE will delete:
-- 1. All units in every block (leads.unit_id → SET NULL)
-- 2. All blocks in the property
-- 3. The property itself
DELETE FROM properties
WHERE id = $1
  AND assigned_to = $2
```

**Business Rules**:
- If there are active leads associated with units in this property, `unit_id` on the lead will be set to NULL (per ERD: `ON DELETE SET NULL`)
- Unit status for leads with active associations will be handled by a trigger before deletion
- **Siteplan files on disk will be deleted** after the DELETE query succeeds. If `siteplan_assets` is `NULL` or the file is not found on disk, deletion is skipped without error

**File Cleanup Flow**:

```
DELETE /api/v1/properties/:id
│
├─ 1. Fetch property data from DB (to get siteplan_assets path)
│
├─ 2. DELETE FROM properties WHERE id = $1 AND assigned_to = $2
│     └─ If no rows deleted → return NOT_FOUND
│
└─ 3. If siteplan_assets is not NULL:
      └─ Delete file from disk (public/uploads/siteplans/...)
         └─ Error handling: if file not found, ignore
```

**Security Notes**:
- **RBAC Restriction**: Endpoint can only be accessed by users with the **Admin** or **Supervisor** role
- Users with other roles (e.g., **Sales**) will be rejected with **403 Forbidden** (`FORBIDDEN`, message: "Insufficient permissions")
- Authentication is still required (401 if token is invalid/missing) and an active subscription is required, same as other endpoints
- Role is checked from the JWT token after `authenticate`, before `subscriptionCheck` — unauthorized users will not trigger database queries

---

## 4. API Design — Blocks

**Security Notes**:
- **RBAC Restriction**: Block CRUD endpoints (POST, PUT, DELETE) can only be accessed by users with the **Admin** or **Supervisor** role
- Users with other roles (e.g., **Sales**) will be rejected with **403 Forbidden** (`FORBIDDEN`, message: "Insufficient permissions")
- No ownership check — Admin and Supervisor can manage blocks belonging to any property
- Authentication is still required (401 if token is invalid/missing) and an active subscription is required, same as other endpoints
- Role is checked from the JWT token after `authenticate`, before `subscriptionCheck` — unauthorized users will not trigger database queries

### 4.1 POST /api/v1/properties/:propertyId/blocks — Add New Block

**Purpose**: Adds a new block to a specific property

**Method**: `POST`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `propertyId` | UUID | Yes | Property ID |

**Request Body**:

```json
{
    "name": "Block Melati"
}
```

**Request Payload Fields**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `name` | string | Yes | `name` | Max 100 chars, unique per property |

**Validation Rules**:
- `name`: Required, max 100 characters
- `name` must be unique within a single property (unique constraint: `property_id + name`)
- Property must exist in the database (validated by ID only, no ownership check)
- Only Admin or Supervisor are authorized (RBAC)

**Success Response** `201`:

```json
{
    "success": true,
    "data": {
        "block": {
            "id": "d3e4f5a6-b7c8-9012-defa-234567890123",
            "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Block Melati",
            "is_active": true,
            "created_at": "2026-07-10T11:00:00.000Z",
            "updated_at": "2026-07-10T11:00:00.000Z"
        }
    }
}
```

**Database Impact — INSERT**:

```sql
INSERT INTO blocks (
    id, property_id, name, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, true, NOW(), NOW()
) RETURNING *
```

---

### 4.2 PUT /api/v1/blocks/:id — Edit Block

**Purpose**: Updates the block name

**Method**: `PUT`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Block ID |

**Request Body**:

```json
{
    "name": "Block Melati Baru"
}
```

**Request Payload Fields**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `name` | string | Yes | `name` | Max 100 chars, unique per property |

**Validation Rules**:
- `name`: Required, max 100 characters
- `name` must be unique within the same property
- Block must exist in the database (validated by ID only, no ownership check)
- Only Admin or Supervisor are authorized (RBAC)

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "block": {
            "id": "d3e4f5a6-b7c8-9012-defa-234567890123",
            "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Block Melati Baru",
            "is_active": true,
            "created_at": "2026-07-10T11:00:00.000Z",
            "updated_at": "2026-07-10T14:00:00.000Z"
        }
    }
}
```

**Database Impact — UPDATE**:

```sql
UPDATE blocks
SET name = $1,
    updated_at = NOW()
WHERE id = $2
RETURNING *
```

---

### 4.3 DELETE /api/v1/blocks/:id — Delete Block

**Purpose**: Deletes a block along with all its units (cascade)

**Method**: `DELETE`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Block ID |

**Success Response** `200`:

```json
{
    "success": true,
    "message": "Block deleted successfully"
}
```

**Database Impact — DELETE (Cascade)**:

```sql
-- ON DELETE CASCADE will delete:
-- 1. All units in this block (leads.unit_id → SET NULL)
-- 2. The block itself
DELETE FROM blocks
WHERE id = $1
```

**Business Rules**:
- Same as delete property — `unit_id` on associated leads will be set to NULL
- Unit status will be handled by a trigger

---

## 5. API Design — Units

### 5.1 GET /api/v1/blocks/:blockId/units — Get Units (by Block)

**Purpose**: Displays the list of units within a specific block

**Access**: Private (requires authentication and active subscription, allowed roles: admin, supervisor)

**Method**: `GET`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `blockId` | UUID | Yes | Block ID |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `page` | integer | No | `1` | Page number |
| `limit` | integer | No | `20` | Number of items per page (max 100) |
| `status` | string | No | - | Filter: `available`, `reserved`, `booked`, `sold` |
| `search` | string | No | - | Search by unit name |

**Request Example**:

```
GET /api/v1/blocks/b1c2d3e4-f5a6-7890-bcde-f12345678901/units?status=available&page=1&limit=20
```

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "block": {
            "id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
            "name": "Block Anggrek",
            "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "property_name": "Grand Permata Residence"
        },
        "units": [
            {
                "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
                "name": "A-1",
                "land_area": 72.00,
                "status": "available",
                "created_at": "2026-07-10T10:10:00.000Z",
                "updated_at": "2026-07-10T10:10:00.000Z"
            },
            {
                "id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
                "name": "A-2",
                "land_area": 90.00,
                "status": "reserved",
                "created_at": "2026-07-10T10:11:00.000Z",
                "updated_at": "2026-07-10T10:11:00.000Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total_items": 24,
            "total_pages": 2
        }
    }
}
```

**Database Query**:

```sql
SELECT
    u.id,
    u.name,
    u.land_area,
    u.status,
    u.created_at,
    u.updated_at
FROM units u
JOIN blocks b ON b.id = u.block_id
JOIN properties p ON p.id = b.property_id
WHERE u.block_id = $1
  AND ($2::varchar(20) IS NULL OR u.status = $2)
  AND ($3::text IS NULL OR u.name ILIKE '%' || $3 || '%')
ORDER BY u.name ASC
LIMIT $4 OFFSET $5
```

---

### 5.2 POST /api/v1/blocks/:blockId/units — Add New Unit

**Purpose**: Adds a new unit to a specific block

**Access**: Private (requires authentication and active subscription, allowed roles: admin, supervisor)

**Method**: `POST`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `blockId` | UUID | Yes | Block ID |

**Request Body**:

```json
{
    "name": "A-25",
    "land_area": 72.00
}
```

**Request Payload Fields**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `name` | string | Yes | `name` | Max 100 chars, unique per block |
| `land_area` | number | No | `land_area` | Numeric(10,2), >= 0, in m² |

**Validation Rules**:
- `name`: Required, max 100 characters
- `name` must be unique within a single block (unique constraint: `block_id + name`)
- `land_area`: Optional, if provided must be a number >= 0
- Block must exist in the database
- Default status is `available` (does not need to be provided)

**Success Response** `201`:

```json
{
    "success": true,
    "data": {
        "unit": {
            "id": "a7b8c9d0-e1f2-3456-abcd-789012345678",
            "block_id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
            "name": "A-25",
            "land_area": 72.00,
            "status": "available",
            "created_at": "2026-07-10T12:00:00.000Z",
            "updated_at": "2026-07-10T12:00:00.000Z"
        }
    }
}
```

**Database Impact — INSERT**:

```sql
INSERT INTO units (
    id, block_id, name, land_area, status, created_at, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, 'available', NOW(), NOW()
) RETURNING *
```

---

### 5.3 PUT /api/v1/units/:id — Edit Unit

**Purpose**: Updates unit data (fields are the same as add new unit)

**Access**: Private (requires authentication and active subscription, allowed roles: admin, supervisor)

**Method**: `PUT`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Unit ID |

**Request Body**:

```json
{
    "name": "A-25A",
    "land_area": 84.00
}
```

**Request Payload Fields**: Same as **POST /api/v1/blocks/:blockId/units** (all fields are optional for updates)

**Validation Rules**:
- All fields are optional (partial update)
- If `name` is provided, max 100 characters, unique within the same block
- If `land_area` is provided, must be a number >= 0
- `status` **cannot** be changed via this endpoint (handled automatically via trigger based on lead status)
- At least 1 field must be provided

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "unit": {
            "id": "a7b8c9d0-e1f2-3456-abcd-789012345678",
            "block_id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
            "name": "A-25A",
            "land_area": 84.00,
            "status": "available",
            "created_at": "2026-07-10T12:00:00.000Z",
            "updated_at": "2026-07-10T15:00:00.000Z"
        }
    }
}
```

**Database Impact — UPDATE**:

```sql
UPDATE units
SET name = COALESCE($1, name),
    land_area = COALESCE($2, land_area),
    updated_at = NOW()
WHERE id = $3
RETURNING *
```

---

### 5.4 DELETE /api/v1/units/:id — Delete Unit

**Purpose**: Deletes a unit

**Access**: Private (requires authentication and active subscription, allowed roles: admin, supervisor)

**Method**: `DELETE`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Unit ID |

**Success Response** `200`:

```json
{
    "success": true,
    "message": "Unit deleted successfully"
}
```

**Database Impact — DELETE**:

```sql
-- ON DELETE SET NULL on leads.unit_id
DELETE FROM units
WHERE id = $1
```

**Business Rules**:
- `unit_id` on associated leads will be set to NULL
- Units with `sold` status cannot be deleted (additional business rule, if needed)

---

## 6. API Design — Siteplan

### 6.1 GET /api/v1/properties/:id/siteplan — Get Property Siteplan

**Purpose**: Retrieves the siteplan image and all units in the property (for frontend mapping/overlay)

**Method**: `GET`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Property ID |

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "property": {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Grand Permata Residence",
            "siteplan_assets": "/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg"
        },
        "units": [
            {
                "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
                "block_id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
                "block_name": "Block Anggrek",
                "name": "A-1",
                "land_area": 72.00,
                "status": "available"
            },
            {
                "id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
                "block_id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
                "block_name": "Block Anggrek",
                "name": "A-2",
                "land_area": 90.00,
                "status": "reserved"
            },
            {
                "id": "a7b8c9d0-e1f2-3456-abcd-789012345678",
                "block_id": "c2d3e4f5-a6b7-8901-cdef-123456789012",
                "block_name": "Block Mawar",
                "name": "B-1",
                "land_area": 60.00,
                "status": "sold"
            }
        ]
    }
}
```

**Success Response** `200` (without siteplan):

```json
{
    "success": true,
    "data": {
        "property": {
            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "name": "Grand Permata Residence",
            "siteplan_assets": null
        },
        "units": []
    }
}
```

**Data Mapping**:

| Response Field | DB Column | Mapping Logic |
| --- | --- | --- |
| `property.siteplan_assets` | `properties.siteplan_assets` | Direct — relative path of the uploaded SVG file. Frontend can access the file via server base URL + this path |
| `units[].id` | `units.id` | Direct |
| `units[].block_id` | `units.block_id` | Direct |
| `units[].block_name` | `blocks.name` | JOIN via block_id |
| `units[].name` | `units.name` | Direct |
| `units[].land_area` | `units.land_area` | Direct |
| `units[].status` | `units.status` | Direct |

**Database Query**:

```sql
-- Property siteplan
SELECT id, name, siteplan_assets
FROM properties
WHERE id = $1 AND assigned_to = $2;

-- All units across all blocks in this property
SELECT
    u.id,
    u.block_id,
    b.name AS block_name,
    u.name,
    u.land_area,
    u.status
FROM units u
JOIN blocks b ON b.id = u.block_id
JOIN properties p ON p.id = b.property_id
WHERE p.id = $1
  AND p.assigned_to = $2
ORDER BY b.name ASC, u.name ASC
```

**Notes**:
- This response is designed so the frontend can map/overlay units on the siteplan image
- Each unit includes `block_name` so the frontend can group them visually
- No pagination is used since units per property are typically limited (tens to hundreds)
- If `siteplan_assets` is `null`, the frontend should display a "No siteplan available" state and show the upload option
- SVG files are served directly via static serving: `{BASE_URL}/uploads/siteplans/{filename}.svg`

---

### 6.2 GET /api/v1/units/:id — Get Unit Detail

**Purpose**: Retrieves complete unit details along with leads assigned to that unit

**Access**: All authenticated roles (Admin, Supervisor, Sales) can access any unit

**Method**: `GET`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Unit ID |

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "unit": {
            "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
            "block_id": "b1c2d3e4-f5a6-7890-bcde-f12345678901",
            "block_name": "Block Anggrek",
            "property_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "property_name": "Grand Permata Residence",
            "name": "A-1",
            "land_area": 72.00,
            "status": "reserved",
            "created_at": "2026-07-10T10:10:00.000Z",
            "updated_at": "2026-07-10T10:10:00.000Z"
        },
        "leads": [
            {
                "id": "x1y2z3a4-b5c6-7890-abcd-ef1234567890",
                "name": "Budi Santoso",
                "phone": "081234567890",
                "email": "budi@email.com",
                "status": "negotiating",
                "assigned_to": "u1v2w3x4-y5z6-7890-abcd-ef1234567890",
                "assigned_to_name": "Ahmad Sales",
                "created_at": "2026-07-10T14:00:00.000Z"
            }
        ]
    }
}
```

**Data Mapping — leads**:

| Response Field | DB Column | Mapping Logic |
| --- | --- | --- |
| `id` | `leads.id` | Direct |
| `name` | `leads.name` | Direct |
| `phone` | `leads.phone` | Direct |
| `email` | `leads.email` | Direct |
| `status` | `leads.status` | Direct — lead process status |
| `assigned_to` | `leads.assigned_to` | Direct — user UUID |
| `assigned_to_name` | `users.full_name` | JOIN via assigned_to |
| `created_at` | `leads.created_at` | Direct |

**Database Query**:

```sql
-- Unit detail
SELECT
    u.*,
    b.name AS block_name,
    p.id AS property_id,
    p.name AS property_name
FROM units u
JOIN blocks b ON b.id = u.block_id
JOIN properties p ON p.id = b.property_id
WHERE u.id = $1;

-- Leads assigned to this unit
SELECT
    l.id,
    l.name,
    l.phone,
    l.email,
    l.status,
    l.assigned_to,
    u.full_name AS assigned_to_name,
    l.created_at
FROM leads l
LEFT JOIN users u ON u.id = l.assigned_to
WHERE l.unit_id = $1
ORDER BY l.created_at DESC
```

**Notes**:
- `leads` can contain multiple leads; by design, a unit may have **multiple active leads** simultaneously
- When one lead reaches `booked` status, other leads on that unit are automatically unassigned (the unit is exclusively claimed by the `booked` lead)

---

### 6.3 POST /api/v1/units/:id/leads — Add Lead to Unit

**Purpose**: Assigns a lead to a specific unit

**Access**: All authenticated roles (Admin, Supervisor, Sales) can perform this operation on any unit

**Method**: `POST`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Unit ID |

**Request Body**:

```json
{
    "lead_id": "x1y2z3a4-b5c6-7890-abcd-ef1234567890"
}
```

**Request Payload Fields**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `lead_id` | UUID | Yes | `leads.unit_id` | Must be a valid lead that is not currently assigned to another active unit |

**Validation Rules**:
- `lead_id`: Required, valid UUID format
- Lead must exist in the database
- Unit must not have `sold` status (only applies to the `Sales` role; Admin/Supervisor bypass this)
- Lead must be owned by the user (`assigned_to` match) — only applies to the `Sales` role; Admin/Supervisor bypass this
- Unit must not already have a lead with `booked` status (applies to all roles)
- **Business Rule**: When a lead reaches `booked` status, all other leads on that unit are unassigned (the unit is exclusively claimed by the `booked` lead)
- After assignment, a DB trigger will update the unit status based on the lead status

**Authorization Exceptions (RBAC)**:

> The `Admin` and `Supervisor` roles **bypass** lead ownership validation (`Lead does not belong to you`) and sold unit status validation (`Cannot assign lead to sold unit`) — they can assign **any** lead to **any** unit. The `Sales` role is restricted: can only assign leads they own (`assigned_to` match) and the unit must not have `sold` status.

**Success Response** `200`:

```json
{
    "success": true,
    "data": {
        "lead": {
            "id": "x1y2z3a4-b5c6-7890-abcd-ef1234567890",
            "name": "Budi Santoso",
            "unit_id": "e5f6a7b8-c9d0-1234-efab-567890123456",
            "unit_name": "A-1",
            "status": "new",
            "updated_at": "2026-07-10T16:00:00.000Z"
        },
        "unit": {
            "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
            "name": "A-1",
            "status": "reserved",
            "updated_at": "2026-07-10T16:00:00.000Z"
        }
    }
}
```

**Database Impact — UPDATE**:

```sql
-- Assign lead to unit (RBAC: Admin/Supervisor bypass ownership check)
UPDATE leads
SET unit_id = $1,
    updated_at = NOW()
WHERE id = $2
  AND (assigned_to = $3 OR $4::boolean)   -- $4 = true (Admin/Supervisor) => bypass ownership, false (Sales) => own lead
  AND unit_id IS NULL
RETURNING *;

-- Unit status will automatically update via DB trigger
-- based on the status of the newly assigned lead
```

**Unit Status Auto-Update Reference** (via DB Trigger):

```
Lead Status    →  Unit Status
─────────────────────────────
new            →  reserved
contacted      →  reserved
surveyed       →  reserved
negotiating    →  reserved
booked         →  booked
closed         →  sold
cancelled      →  available
```

---

### 6.4 DELETE /api/v1/units/:id/leads/:leadId — Remove Lead from Unit

**Purpose**: Unassigns (removes) a lead from a specific unit

**Access**: All authenticated roles (Admin, Supervisor, Sales) can perform this operation on any unit

**Method**: `DELETE`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Unit ID |
| `leadId` | UUID | Yes | Lead ID to unassign |

**Validation Rules**:
- Unit must exist in the database
- Lead must exist — `Sales` role is restricted to their own leads only (`assigned_to` match); Admin/Supervisor can remove any lead
- Lead must currently be assigned to the unit (`leads.unit_id = id`), otherwise → error `409 LEAD_NOT_ASSIGNED`
- No status-based restrictions — leads with any status (including `booked`/`closed`) can still be unassigned
- After unassignment, a DB trigger will update the unit status based on the remaining leads on the unit

**Authorization Exceptions (RBAC)**:

> The `Admin` and `Supervisor` roles **bypass** lead ownership validation — they can remove **any** lead from **any** unit. The `Sales` role is restricted: can only remove their own leads (`assigned_to` match).

**Success Response** `200`:

```json
{
    "success": true,
    "message": "Lead unassigned from unit successfully",
    "data": {
        "lead": {
            "id": "x1y2z3a4-b5c6-7890-abcd-ef1234567890",
            "name": "Budi Santoso",
            "unit_id": null,
            "unit_name": null,
            "status": "negotiating",
            "updated_at": "2026-07-10T17:00:00.000Z"
        },
        "unit": {
            "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
            "name": "A-1",
            "status": "available",
            "updated_at": "2026-07-10T17:00:00.000Z"
        }
    }
}
```

**Database Impact — UPDATE**:

```sql
-- Unassign lead from unit (RBAC: Admin/Supervisor bypass ownership check)
UPDATE leads
SET unit_id = NULL,
    updated_at = NOW()
WHERE id = $1
  AND (assigned_to = $2 OR $3::boolean)   -- $3 = true (Admin/Supervisor) => bypass ownership, false (Sales) => own lead
  AND unit_id = $4
RETURNING *;

-- Unit status will automatically update via DB trigger
-- based on the remaining leads on the unit
```

---

## 7. Error Response Format

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": {
            "name": ["Block name already exists in this property"]
        }
    }
}
```

**Error Codes**:

| Code | HTTP Status | Description | Applicable To |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request validation failed | All endpoints |
| `UNAUTHORIZED` | 401 | No valid token provided | All endpoints |
| `FORBIDDEN` | 403 | Resource not owned by user / role not authorized | GET/PUT/DELETE by ID, POST/PUT/DELETE Property & Block (RBAC) |
| `NOT_FOUND` | 404 | Resource not found | GET/PUT/DELETE by ID |
| `CONFLICT` | 409 | Name already exists (unique violation) | POST Block, POST Unit |
| `UNIT_BOOKED` | 409 | Unit already has a `booked` lead | POST Lead to Unit |
| `UNIT_SOLD` | 409 | Unit is already sold, cannot be assigned | POST Lead to Unit |
| `LEAD_ALREADY_ASSIGNED` | 409 | Lead is already assigned to another unit | POST Lead to Unit |
| `LEAD_NOT_ASSIGNED` | 409 | Lead is not currently assigned to this unit | DELETE Lead from Unit |
| `INVALID_FILE_TYPE` | 400 | File is not SVG type (`image/svg+xml`) | POST/PUT Property (siteplan_file) |
| `FILE_TOO_LARGE` | 400 | File size exceeds the 5MB limit | POST/PUT Property (siteplan_file) |

**Error Response Examples — File Upload**:

```json
// Invalid file type
{
    "success": false,
    "error": {
        "code": "INVALID_FILE_TYPE",
        "message": "Only SVG files are allowed",
        "details": {
            "siteplan_file": ["File must be of type image/svg+xml. Received: image/png"]
        }
    }
}

// File too large
{
    "success": false,
    "error": {
        "code": "FILE_TOO_LARGE",
        "message": "File size exceeds maximum limit",
        "details": {
            "siteplan_file": ["File size must not exceed 5MB. Received: 7.2MB"]
        }
    }
}
```

---

## 8. API Summary Table

| # | Method | Endpoint | Content-Type | Purpose |
| --- | --- | --- | --- | --- |
| **Properties** |  |  |  |  |
| 1 | `GET` | `/api/v1/properties` | - | List all properties |
| 2 | `POST` | `/api/v1/properties` | `multipart/form-data` | Add new property (optional SVG siteplan upload) |
| 3 | `GET` | `/api/v1/properties/:id` | - | Property detail + blocks |
| 4 | `PUT` | `/api/v1/properties/:id` | `multipart/form-data` | Edit property (optional new SVG siteplan upload) |
| 5 | `DELETE` | `/api/v1/properties/:id` | - | Delete property + siteplan file cleanup |
| **Blocks** |  |  |  |  |
| 6 | `POST` | `/api/v1/properties/:propertyId/blocks` | `application/json` | Add new block |
| 7 | `PUT` | `/api/v1/blocks/:id` | `application/json` | Edit block |
| 8 | `DELETE` | `/api/v1/blocks/:id` | - | Delete block |
| **Units** |  |  |  |  |
| 9 | `GET` | `/api/v1/blocks/:blockId/units` | - | List units in block |
| 10 | `POST` | `/api/v1/blocks/:blockId/units` | `application/json` | Add new unit |
| 11 | `PUT` | `/api/v1/units/:id` | `application/json` | Edit unit |
| 12 | `DELETE` | `/api/v1/units/:id` | - | Delete unit |
| **Siteplan** |  |  |  |  |
| 13 | `GET` | `/api/v1/properties/:id/siteplan` | - | Siteplan image + all units |
| 14 | `GET` | `/api/v1/units/:id` | - | Unit detail + leads |
| 15 | `POST` | `/api/v1/units/:id/leads` | `application/json` | Assign lead to unit |
| 16 | `DELETE` | `/api/v1/units/:id/leads/:leadId` | - | Unassign lead from unit |

---

## 9. Siteplan Upload — Infrastructure Notes

### 9.1 Dependencies

```bash
npm install multer @types/multer
```

### 9.2 Folder Structure

```
sales-force-be/
├── public/
│   └── uploads/
│       └── siteplans/          # SVG files are stored here
├── src/
│   ├── middleware/
│   │   └── upload.ts           # Multer configuration
│   ├── routes/
│   │   └── properties.ts       # Route with upload middleware
│   ├── controllers/
│   │   └── properties.ts       # Handle req.file
│   └── services/
│       └── properties.ts       # File path logic + cleanup
└── index.ts                    # Static serving config
```

### 9.3 Upload Middleware Configuration

| Setting | Value |
| --- | --- |
| **Storage** | `DiskStorage` (local file system) |
| **Destination** | `public/uploads/siteplans/` |
| **Filename Pattern** | `{UUIDv4}-{unix_timestamp_ms}.svg` |
| **File Filter** | `mimetype === 'image/svg+xml'` |
| **Size Limit** | `5MB` (5,242,880 bytes) |
| **Field Name** | `siteplan_file` |

### 9.4 Static File Serving

```tsx
// index.ts
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
```

| Setting | Value |
| --- | --- |
| **Route Prefix** | `/uploads` |
| **Serves From** | `public/uploads/` |
| **Full URL Pattern** | `{BASE_URL}/uploads/siteplans/{UUID}-{timestamp}.svg` |
| **Example** | `http://localhost:3000/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg` |

### 9.5 Database Column Update

```sql
-- Extend column to accommodate longer paths
ALTER TABLE properties
ALTER COLUMN siteplan_assets TYPE VARCHAR(500);
```

| Column | Before | After | Reason |
| --- | --- | --- | --- |
| `siteplan_assets` | `VARCHAR(255)` | `VARCHAR(500)` | Path format `{UUID}-{timestamp}.svg` ≈ 70 chars, which is sufficient. However, VARCHAR(500) provides buffer for future folder structure changes |

### 9.6 File Lifecycle Summary

| Operation | File Action | DB Action | Error Handling |
| --- | --- | --- | --- |
| **POST** (with file) | Save new file to disk | INSERT path to `siteplan_assets` | If DB fails → delete the already saved file |
| **POST** (without file) | No file action | INSERT `NULL` to `siteplan_assets` | - |
| **PUT** (with new file) | Delete old file (if exists), save new file | UPDATE new path to `siteplan_assets` | If old file deletion fails (not found) → ignore, continue. If new file save fails → do not delete old file |
| **PUT** (delete_siteplan=true) | Delete old file from disk (if exists) | UPDATE `siteplan_assets` = NULL | If file deletion fails (not found) → ignore, still continue with DB update |
| **PUT** (without file, no delete) | No file action | `siteplan_assets` remains unchanged (preserve old value) | - |
| **DELETE** property | Delete file from disk (if exists) | DELETE FROM properties (cascade) | If file deletion fails (not found) → ignore, still continue with DB deletion |

---

## 10. Related Documents

- ERD - Sales Force Automation System
- API Design - Authentication & Session Management
- API Design - Leads
- API Design - Users & Roles

---

*Document Version: 2.3 | Last Updated: 2026-08-28*
