# API Design - Properties V2

## 1. Document Overview

| Field | Value |
| --- | --- |
| **Module** | Properties Management |
| **Version** | 2.1 |
| **Last Updated** | 2026-07-13 |
| **Related Docs** | ERD - Sales Force Automation System |
| **Base URL** | `/api/v1` |

---

## 2. Page Overview

### 2.1 Properties List View

- **Route**: `/properties`
- **Purpose**: Menampilkan daftar semua properti milik user yang login
- **Features**: List properti dengan pagination, search, filter kota

### 2.2 Property Detail View

- **Route**: `/properties/:id`
- **Purpose**: Menampilkan detail properti beserta blocks di dalamnya
- **Features**: Form edit properti + daftar blocks di bawahnya

### 2.3 Block Detail View (Units List)

- **Route**: `/properties/:id/blocks/:blockId`
- **Purpose**: Menampilkan daftar units di dalam sebuah block
- **Features**: List units dengan status ketersediaan

### 2.4 Siteplan View

- **Route**: `/properties/:id/siteplan`
- **Purpose**: Menampilkan gambar siteplan interaktif dengan overlay unit
- **Features**: Gambar siteplan SVG + daftar units (land_area, status) untuk mapping di frontend

### 2.5 Unit Detail View

- **Route**: `/units/:id`
- **Purpose**: Menampilkan detail unit dan lead yang di-assign
- **Features**: Detail unit + informasi lead terkait

---

## 3. API Design — Properties

### 3.1 GET /api/v1/properties — Get Properties List

**Purpose**: Menampilkan semua properti yang tersedia untuk user yang terautentikasi dengan subscription aktif

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `page` | integer | No | `1` | Halaman ke berapa |
| `limit` | integer | No | `10` | Jumlah item per halaman (max 50) |
| `search` | string | No | - | Cari berdasarkan nama properti |
| `city` | string | No | - | Filter berdasarkan kota |

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
| `siteplan_assets` | `properties` | `siteplan_assets` | Direct — path relatif file SVG yang di-upload |
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
- User harus memiliki active subscription untuk mengakses endpoint

---

### 3.2 POST /api/v1/properties — Add New Property

**Purpose**: Menambahkan properti baru

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Request Body (Form Fields)**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `name` | string (form field) | Yes | `name` | Max 255 chars, NOT NULL |
| `city` | string (form field) | Yes | `city` | Max 100 chars, NOT NULL |
| `land_area` | string (form field) | No | `land_area` | Numeric(10,2), >= 0, dalam m² |
| `address` | string (form field) | No | `address` | Text |
| `description` | string (form field) | No | `description` | Text |
| `siteplan_file` | file (form file) | No | `siteplan_assets` | Hanya SVG (`image/svg+xml`), maks 5MB |

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
- `name`: Wajib, maks 255 karakter
- `city`: Wajib, maks 100 karakter
- `land_area`: Opsional, jika dikirim harus angka >= 0
- `address`: Opsional
- `description`: Opsional
- `siteplan_file`: Opsional, namun jika dikirim:
- Hanya menerima tipe MIME `image/svg+xml`
- Ukuran maksimum **5MB** (5.242.880 bytes)
- File akan di-rename menjadi format: `{UUID}-{timestamp}.svg`
- Disimpan di path: `public/uploads/siteplans/`
- Nilai yang disimpan ke database: `/uploads/siteplans/{UUID}-{timestamp}.svg`
- `assigned_to`: Auto-populated dari JWT token
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

**Success Response** `201` (tanpa upload siteplan):

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

> **Note**: `$6` akan berisi path relatif file (misal: `/uploads/siteplans/550e8400-e29b-41d4-a716-446655440000-1699999999.svg`) jika file di-upload, atau `NULL` jika tidak ada file.
> 

---

### 3.3 GET /api/v1/properties/:id — Get Property Detail (with Blocks)

**Purpose**: Mendapatkan detail properti beserta daftar blocks di dalamnya (digunakan saat edit)

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

**Purpose**: Mengubah data properti (value sama dengan add new property)

**Method**: `PUT`

**Content-Type**: `multipart/form-data`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Property ID |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `delete_siteplan` | boolean | No | `false` | Set true untuk menghapus siteplan yang sudah ada |

**Request Body (Form Fields)**:

| Field | Type | Required | DB Column | Validation |
| --- | --- | --- | --- | --- |
| `name` | string (form field) | No | `name` | Max 255 chars |
| `city` | string (form field) | No | `city` | Max 100 chars |
| `land_area` | string (form field) | No | `land_area` | Numeric(10,2), >= 0, dalam m² |
| `address` | string (form field) | No | `address` | Text |
| `description` | string (form field) | No | `description` | Text |
| `siteplan_file` | file (form file) | No | `siteplan_assets` | Hanya SVG (`image/svg+xml`), maks 5MB |

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
- Semua field opsional (partial update)
- Jika `name` dikirim, maks 255 karakter
- Jika `city` dikirim, maks 100 karakter
- Jika `land_area` dikirim, harus angka >= 0
- Minimal 1 field (form field atau file atau query param) harus dikirim
- **Query Parameter Rules**:
- Jika `delete_siteplan = true` dan `siteplan_file` dikirim → return error 400 `VALIDATION_ERROR`
- Jika `delete_siteplan = true` dan tidak ada siteplan lama → abaikan (graceful no-op)
- Jika `siteplan_file` dikirim:
- Hanya menerima tipe MIME `image/svg+xml`
- Ukuran maksimum **5MB** (5.242.880 bytes)
- File akan di-rename menjadi format: `{UUID}-{timestamp}.svg`
- Disimpan di path: `public/uploads/siteplans/`
- **File lama akan dihapus** dari disk sebelum menyimpan file baru
- Jika tidak ada file lama (NULL), tidak ada penghapusan
- Jika `siteplan_file` **tidak** dikirim dan `delete_siteplan = false`, `siteplan_assets` di database **tetap dipertahankan** (tidak di-set NULL)
- Jika `delete_siteplan = true` dan tidak ada `siteplan_file` dikirim, siteplan yang sudah ada akan dihapus dari disk dan `siteplan_assets` di database akan di-set ke NULL

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

**Success Response** `200` (update tanpa upload siteplan baru):

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
  AND assigned_to = $8
RETURNING *
```

> **Note**: `$6` akan berisi:
- Path file baru jika `siteplan_file` di-upload
- `NULL` jika `delete_siteplan = true`
- `siteplan_assets` nilai lama jika tidak ada perubahan siteplan
>
Penghapusan file lama dari disk dilakukan di service layer **sebelum** query UPDATE dijalankan.
>
> 

**File Replacement Flow**:

```
PUT /api/v1/properties/:id dengan siteplan_file
│
├─ 1. Ambil data properti lama dari DB (untuk mendapat path file lama)
│
├─ 2. Jika siteplan_assets lama tidak NULL:
│     └─ Hapus file lama dari disk (public/uploads/siteplans/...)
│        └─ Handle error: jika file tidak ditemukan di disk, abaikan (tidak throw)
│
├─ 3. Simpan file baru ke disk (public/uploads/siteplans/{UUID}-{timestamp}.svg)
│
└─ 4. UPDATE database dengan path file baru
```

**Siteplan Delete Flow**:

```
PUT /api/v1/properties/:id?delete_siteplan=true
│
├─ 1. Ambil data properti lama dari DB (untuk mendapat path file lama)
│
├─ 2. Jika siteplan_assets lama tidak NULL:
│     └─ Hapus file lama dari disk (public/uploads/siteplans/...)
│        └─ Handle error: jika file tidak ditemukan di disk, abaikan (tidak throw)
│
└─ 3. UPDATE database dengan siteplan_assets = NULL
```

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

**Purpose**: Menghapus properti beserta seluruh blocks dan units di dalamnya (cascade)

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
-- ON DELETE CASCADE akan menghapus:
-- 1. Semua units di setiap block (leads.unit_id → SET NULL)
-- 2. Semua blocks di property
-- 3. Property itu sendiri
DELETE FROM properties
WHERE id = $1
  AND assigned_to = $2
```

**Business Rules**:
- Jika ada lead aktif yang terkait unit di property ini, `unit_id` pada lead akan di-set NULL (sesuai ERD: `ON DELETE SET NULL`)
- Status unit yang terkait lead aktif akan di-handle oleh trigger sebelum penghapusan
- **File siteplan di disk akan dihapus** setelah query DELETE berhasil. Jika `siteplan_assets` bernilai `NULL` atau file tidak ditemukan di disk, penghapusan dilewati tanpa error

**File Cleanup Flow**:

```
DELETE /api/v1/properties/:id
│
├─ 1. Ambil data properti dari DB (untuk mendapat path siteplan_assets)
│
├─ 2. DELETE FROM properties WHERE id = $1 AND assigned_to = $2
│     └─ Jika tidak ada row yang terhapus → return NOT_FOUND
│
└─ 3. Jika siteplan_assets tidak NULL:
      └─ Hapus file dari disk (public/uploads/siteplans/...)
         └─ Handle error: jika file tidak ditemukan, abaikan
```

---

## 4. API Design — Blocks

### 4.1 POST /api/v1/properties/:propertyId/blocks — Add New Block

**Purpose**: Menambahkan block baru ke dalam properti tertentu

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
| `name` | string | Yes | `name` | Maks 100 chars, unik per property |

**Validation Rules**:
- `name`: Wajib, maks 100 karakter
- `name` harus unik di dalam satu property (unique constraint: `property_id + name`)
- Property harus milik user yang login

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

**Purpose**: Mengubah nama block

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
| `name` | string | Yes | `name` | Maks 100 chars, unik per property |

**Validation Rules**:
- `name`: Wajib, maks 100 karakter
- `name` harus unik di dalam property yang sama
- Block harus milik property yang dimiliki user yang login (validasi via join)

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
  AND property_id IN (
      SELECT id FROM properties WHERE assigned_to = $3
  )
RETURNING *
```

---

### 4.3 DELETE /api/v1/blocks/:id — Delete Block

**Purpose**: Menghapus block beserta seluruh units di dalamnya (cascade)

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
-- ON DELETE CASCADE akan menghapus:
-- 1. Semua units di block ini (leads.unit_id → SET NULL)
-- 2. Block itu sendiri
DELETE FROM blocks
WHERE id = $1
  AND property_id IN (
      SELECT id FROM properties WHERE assigned_to = $2
  )
```

**Business Rules**:
- Sama seperti delete property, `unit_id` pada lead terkait akan di-set NULL
- Unit status akan di-handle oleh trigger

---

## 5. API Design — Units

### 5.1 GET /api/v1/blocks/:blockId/units — Get Units (by Block)

**Purpose**: Menampilkan list units di dalam block tertentu

**Method**: `GET`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `blockId` | UUID | Yes | Block ID |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `page` | integer | No | `1` | Halaman |
| `limit` | integer | No | `20` | Jumlah item per halaman (max 100) |
| `status` | string | No | - | Filter: `available`, `reserved`, `booked`, `sold` |
| `search` | string | No | - | Cari berdasarkan nama unit |

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
  AND p.assigned_to = $2
  AND ($3::varchar(20) IS NULL OR u.status = $3)
  AND ($4::text IS NULL OR u.name ILIKE '%' || $4 || '%')
ORDER BY u.name ASC
LIMIT $5 OFFSET $6
```

---

### 5.2 POST /api/v1/blocks/:blockId/units — Add New Unit

**Purpose**: Menambahkan unit baru ke dalam block tertentu

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
| `name` | string | Yes | `name` | Maks 100 chars, unik per block |
| `land_area` | number | No | `land_area` | Numeric(10,2), >= 0, dalam m² |

**Validation Rules**:
- `name`: Wajib, maks 100 karakter
- `name` harus unik di dalam satu block (unique constraint: `block_id + name`)
- `land_area`: Opsional, jika dikirim harus angka >= 0
- `status`: Default `available` (tidak perlu dikirim)
- Block harus milik property yang dimiliki user yang login

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

**Purpose**: Mengubah data unit (value sama dengan add new unit)

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

**Request Payload Fields**: Sama dengan **POST /api/v1/blocks/:blockId/units** (semua field opsional saat update)

**Validation Rules**:
- Semua field opsional (partial update)
- Jika `name` dikirim, maks 100 karakter, unik di dalam block yang sama
- Jika `land_area` dikirim, harus angka >= 0
- `status` **tidak bisa** diubah melalui endpoint ini (di-handle otomatis via trigger berdasarkan status lead)
- Minimal 1 field harus dikirim

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
  AND block_id IN (
      SELECT b.id FROM blocks b
      JOIN properties p ON p.id = b.property_id
      WHERE p.assigned_to = $4
  )
RETURNING *
```

---

### 5.4 DELETE /api/v1/units/:id — Delete Unit

**Purpose**: Menghapus unit

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
-- ON DELETE SET NULL pada leads.unit_id
DELETE FROM units
WHERE id = $1
  AND block_id IN (
      SELECT b.id FROM blocks b
      JOIN properties p ON p.id = b.property_id
      WHERE p.assigned_to = $2
  )
```

**Business Rules**:
- `unit_id` pada lead terkait akan di-set NULL
- Tidak bisa menghapus unit yang sudah berstatus `sold` (business rule tambahan, jika diperlukan)

---

## 6. API Design — Siteplan

### 6.1 GET /api/v1/properties/:id/siteplan — Get Property Siteplan

**Purpose**: Mendapatkan gambar siteplan dan seluruh units di property tersebut (untuk mapping/overlay di frontend)

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

**Success Response** `200` (tanpa siteplan):

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
| `property.siteplan_assets` | `properties.siteplan_assets` | Direct — path relatif file SVG yang di-upload. Frontend dapat mengakses file melalui base URL server + path ini |
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
- Response ini dirancang agar frontend bisa melakukan mapping/overlay units pada gambar siteplan
- Setiap unit memiliki `block_name` agar frontend bisa mengelompokkan secara visual
- Tidak ada pagination karena data units per property biasanya terbatas (puluhan hingga ratusan)
- Jika `siteplan_assets` bernilai `null`, frontend harus menampilkan state “Belum ada siteplan” dan menampilkan opsi upload
- File SVG diakses langsung via static serving: `{BASE_URL}/uploads/siteplans/{filename}.svg`

---

### 6.2 GET /api/v1/units/:id — Get Unit Detail

**Purpose**: Mendapatkan detail unit lengkap beserta leads yang di-assign ke unit tersebut

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
| `status` | `leads.status` | Direct — status proses lead |
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
WHERE u.id = $1
  AND p.assigned_to = $2;

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
- `leads` bisa berisi multiple leads; secara bisnis unit boleh memiliki **banyak lead aktif** sekaligus
- Saat salah satu lead berstatus `booked`, lead lain di unit tersebut otomatis di-unassign (unit diklaim eksklusif oleh lead `booked`)

---

### 6.3 POST /api/v1/units/:id/leads — Add Lead to Unit

**Purpose**: Assign lead ke unit tertentu

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
| `lead_id` | UUID | Yes | `leads.unit_id` | Harus lead yang valid dan belum di-assign ke unit lain aktif |

**Validation Rules**:
- `lead_id`: Wajib, format UUID valid
- Lead harus ada di database
- Lead harus dimiliki oleh user yang sama dengan pemilik property (assigned_to match)
- Unit harus milik property yang dimiliki user yang login
- Unit tidak boleh berstatus `sold`
- Unit tidak boleh sudah memiliki lead berstatus `booked`
- **Business Rule**: Saat sebuah lead masuk status `booked`, semua lead lain di unit tersebut akan di-unassign (unit diklaim eksklusif oleh lead `booked`)
- Setelah assign, trigger DB akan mengubah status unit berdasarkan status lead

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
-- Assign lead to unit
UPDATE leads
SET unit_id = $1,
    updated_at = NOW()
WHERE id = $2
  AND assigned_to = $3
  AND unit_id IS NULL
RETURNING *;

-- Unit status akan otomatis berubah via DB trigger
-- berdasarkan status lead yang baru di-assign
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

**Purpose**: Unassign (melepas) lead dari unit tertentu

**Method**: `DELETE`

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Unit ID |
| `leadId` | UUID | Yes | Lead ID yang akan di-unassign |

**Validation Rules**:
- Unit harus ada dan milik property yang dimiliki user yang login
- Lead harus ada dan dimiliki oleh user yang sama dengan pemilik property (assigned_to match)
- Lead harus sedang di-assign ke unit tersebut (`leads.unit_id = id`), jika tidak → error `409 LEAD_NOT_ASSIGNED`
- Tidak ada pembatasan berdasarkan status lead — lead berstatus apapun (termasuk `booked`/`closed`) tetap dapat di-unassign
- Setelah unassign, trigger DB akan mengubah status unit berdasarkan lead yang tersisa di unit tersebut

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
-- Unassign lead from unit
UPDATE leads
SET unit_id = NULL,
    updated_at = NOW()
WHERE id = $1
  AND assigned_to = $2
  AND unit_id = $3
RETURNING *;

-- Unit status akan otomatis berubah via DB trigger
-- berdasarkan lead yang masih tersisa di unit tersebut
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
| `VALIDATION_ERROR` | 400 | Request validation gagal | Semua endpoint |
| `UNAUTHORIZED` | 401 | Tidak ada token valid | Semua endpoint |
| `FORBIDDEN` | 403 | Resource bukan milik user | GET/PUT/DELETE by ID |
| `NOT_FOUND` | 404 | Resource tidak ditemukan | GET/PUT/DELETE by ID |
| `CONFLICT` | 409 | Nama sudah ada (unique violation) | POST Block, POST Unit |
| `UNIT_BOOKED` | 409 | Unit sudah ada lead berstatus `booked` | POST Lead to Unit |
| `UNIT_SOLD` | 409 | Unit sudah terjual, tidak bisa di-assign | POST Lead to Unit |
| `LEAD_ALREADY_ASSIGNED` | 409 | Lead sudah di-assign ke unit lain | POST Lead to Unit |
| `LEAD_NOT_ASSIGNED` | 409 | Lead tidak sedang di-assign ke unit ini | DELETE Lead from Unit |
| `INVALID_FILE_TYPE` | 400 | File bukan bertipe SVG (`image/svg+xml`) | POST/PUT Property (siteplan_file) |
| `FILE_TOO_LARGE` | 400 | Ukuran file melebihi batas 5MB | POST/PUT Property (siteplan_file) |

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
| 1 | `GET` | `/api/v1/properties` | - | List semua properti |
| 2 | `POST` | `/api/v1/properties` | `multipart/form-data` | Tambah properti baru (opsional upload SVG siteplan) |
| 3 | `GET` | `/api/v1/properties/:id` | - | Detail properti + blocks |
| 4 | `PUT` | `/api/v1/properties/:id` | `multipart/form-data` | Edit properti (opsional upload SVG siteplan baru) |
| 5 | `DELETE` | `/api/v1/properties/:id` | - | Hapus properti + cleanup file siteplan |
| **Blocks** |  |  |  |  |
| 6 | `POST` | `/api/v1/properties/:propertyId/blocks` | `application/json` | Tambah block baru |
| 7 | `PUT` | `/api/v1/blocks/:id` | `application/json` | Edit block |
| 8 | `DELETE` | `/api/v1/blocks/:id` | - | Hapus block |
| **Units** |  |  |  |  |
| 9 | `GET` | `/api/v1/blocks/:blockId/units` | - | List units di block |
| 10 | `POST` | `/api/v1/blocks/:blockId/units` | `application/json` | Tambah unit baru |
| 11 | `PUT` | `/api/v1/units/:id` | `application/json` | Edit unit |
| 12 | `DELETE` | `/api/v1/units/:id` | - | Hapus unit |
| **Siteplan** |  |  |  |  |
| 13 | `GET` | `/api/v1/properties/:id/siteplan` | - | Gambar siteplan + semua units |
| 14 | `GET` | `/api/v1/units/:id` | - | Detail unit + leads |
| 15 | `POST` | `/api/v1/units/:id/leads` | `application/json` | Assign lead ke unit |
| 16 | `DELETE` | `/api/v1/units/:id/leads/:leadId` | - | Unassign lead dari unit |

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
│       └── siteplans/          # SVG files disimpan di sini
├── src/
│   ├── middleware/
│   │   └── upload.ts           # Multer configuration
│   ├── routes/
│   │   └── properties.ts       # Route dengan upload middleware
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
| **Size Limit** | `5MB` (5.242.880 bytes) |
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
-- Perpanjang kolom untuk mengakomodasi path yang lebih panjang
ALTER TABLE properties
ALTER COLUMN siteplan_assets TYPE VARCHAR(500);
```

| Column | Before | After | Reason |
| --- | --- | --- | --- |
| `siteplan_assets` | `VARCHAR(255)` | `VARCHAR(500)` | Path format `{UUID}-{timestamp}.svg` ≈ 70 chars, cukup aman. Namun VARCHAR(500) memberi buffer untuk perubahan struktur folder di masa depan |

### 9.6 File Lifecycle Summary

| Operation | File Action | DB Action | Error Handling |
| --- | --- | --- | --- |
| **POST** (dengan file) | Simpan file baru ke disk | INSERT path ke `siteplan_assets` | Jika DB gagal → hapus file yang sudah tersimpan |
| **POST** (tanpa file) | Tidak ada aksi file | INSERT `NULL` ke `siteplan_assets` | - |
| **PUT** (dengan file baru) | Hapus file lama (jika ada), simpan file baru | UPDATE path baru ke `siteplan_assets` | Jika hapus file lama gagal (tidak ditemukan) → abaikan, lanjutkan. Jika simpan file baru gagal → jangan hapus file lama |
| **PUT** (delete_siteplan=true) | Hapus file lama dari disk (jika ada) | UPDATE `siteplan_assets` = NULL | Jika hapus file gagal (tidak ditemukan) → abaikan, tetap lanjutkan update DB |
| **PUT** (tanpa file, tanpa delete) | Tidak ada aksi file | `siteplan_assets` tetap (pertahankan nilai lama) | - |
| **DELETE** property | Hapus file dari disk (jika ada) | DELETE FROM properties (cascade) | Jika hapus file gagal (tidak ditemukan) → abaikan, tetap lanjutkan hapus DB |

---

## 10. Related Documents

- ERD - Sales Force Automation System
- API Design - Authentication & Session Management
- API Design - Leads
- API Design - Users & Roles

---

*Document Version: 2.1 | Last Updated: 2026-07-13*