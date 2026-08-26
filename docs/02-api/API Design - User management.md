# API Design - User management

# User Management API

API endpoints for managing users in the Sales Force system.

---

## Base URL

```
/api/v1/users
```

---

## Authentication

All endpoints require:

- **Authentication**: Bearer Token (JWT)
- **Authorization**: Supervisor or Admin Role (`supervisorOrAdmin` middleware)

> **Role-based visibility:** Role `Admin` dapat melihat seluruh akun user, termasuk akun Admin lain.
> Role `Supervisor` dapat melihat semua akun **kecuali** akun ber-role `Admin`.

---

## Endpoints

### 1. List Users

Get all users with pagination and filtering capabilities.

```
GET /api/v1/users
```

**Query Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50) |
| `search` | string | No | Search by name, email, or phone |
| `is_active` | boolean | No | Filter by active status |
| `role_id` | string | No | Filter by role ID |
| `role` | string | No | Filter by role name: `Admin`, `Supervisor`, `Sales` |
| `sort_by` | string | No | Sort field: `created_at`, `full_name`, `email` (default: `created_at`) |
| `sort_order` | string | No | Sort order: `asc`, `desc` (default: `desc`) |

> **Visibility:** Saat dipanggil oleh role `Supervisor`, akun ber-role `Admin` **tidak** disertakan dalam respons.
> `pagination.total` dan `pages` ikut menghitung tanpa akun Admin. Filter `role_id` maupun `role` yang menargetkan role `Admin` tetap mengembalikan kosong untuk Supervisor.
> Role `Admin` tetap dapat melihat seluruh user termasuk Admin lain.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "John Doe",
        "phone": "+1234567890",
        "is_active": true,
        "role_id": "role-uuid",
        "role": "Admin",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
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

### 2. Get User Detail

Get detailed information about a specific user.

```
GET /api/v1/users/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | User UUID |

> **Visibility:** Saat dipanggil oleh role `Supervisor`, mengakses detail user ber-role `Admin` akan mengembalikan
> `404 User not found`. Role `Admin` dapat mengakses detail seluruh user.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "is_active": true,
    "role_id": "role-uuid",
    "role": "Admin",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. Create User

Create a new user account.

```
POST /api/v1/users
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role_id": "role-uuid",
  "role": "Admin",
  "is_active": true
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string | Yes | User email address (unique, valid email format) |
| `password` | string | Yes | User password (min 8 characters) |
| `full_name` | string | Yes | User full name |
| `phone` | string | No | Phone number (10-20 digits) |
| `role_id` | string | No | Role ID (alternative to role) |
| `role` | string | No | Role name: `Admin`, `Supervisor`, `Sales` |
| `is_active` | boolean | No | Active status (default: true) |

> **Note:** If both `role` and `role_id` are provided, `role` takes precedence. The system will first try to find by role name, then by role ID.
> 

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "is_active": true,
      "role_id": "role-uuid",
      "role": "Admin",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### 4. Update User

Update an existing user's information.

```
PUT /api/v1/users/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | User UUID |

**Request Body:**

```json
{
  "email": "newemail@example.com",
  "password": "NewPassword123!",
  "full_name": "Jane Doe",
  "phone": "+9876543210",
  "role_id": "new-role-uuid",
  "role": "Supervisor",
  "is_active": false
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string | No | New email address (must be unique) |
| `password` | string | No | New password (min 8 characters) |
| `full_name` | string | No | New full name |
| `phone` | string | No | New phone number (10-20 digits) |
| `role_id` | string | No | New role ID (set to `null` to remove role) |
| `role` | string | No | New role name (set to `""` to remove role) |
| `is_active` | boolean | No | New active status |

> **Note:** At least one field must be provided. To remove a role, set `role` to empty string `""` or `role_id` to `null`.
> 

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newemail@example.com",
      "full_name": "Jane Doe",
      "phone": "+9876543210",
      "is_active": false,
      "role_id": "new-role-uuid",
      "role": "Supervisor",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### 5. Delete User

Delete a user account.

```
DELETE /api/v1/users/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | User UUID |

> **Note:** Related records will be deleted automatically via CASCADE.
> 

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Data Models

### User Response Object

This object is returned by all endpoints (List, Detail, Create, Update).

```tsx
interface UserResponse {
  id: string;              // UUID
  email: string;           // User email
  full_name: string;       // Full name
  phone?: string;          // Phone number (optional, can be null)
  is_active: boolean;      // Active status
  role_id?: string;        // Role ID (optional, can be null)
  role?: string;           // Role name (optional, can be null)
  created_at: Date;        // Creation timestamp
  updated_at: Date;        // Last update timestamp
}
```

### Create User DTO

```tsx
interface CreateUserDto {
  email: string;           // Required - valid email format
  password: string;        // Required - min 8 characters
  full_name: string;       // Required - non-empty string
  phone?: string;          // Optional - 10-20 digits
  role_id?: string;        // Optional - Role UUID
  role?: string;           // Optional - Role name
  is_active?: boolean;     // Optional - default: true
}
```

### Update User DTO

```tsx
interface UpdateUserDto {
  email?: string;          // Optional - valid email format, must be unique
  password?: string;       // Optional - min 8 characters
  full_name?: string;      // Optional
  phone?: string;          // Optional - 10-20 digits
  role_id?: string | null; // Optional - null to remove role
  role?: string;           // Optional - empty string to remove role
  is_active?: boolean;     // Optional
}
```

### Get Users Query

```tsx
interface GetUsersQuery {
  page?: number;           // Default: 1
  limit?: number;          // Default: 50
  search?: string;         // Searches in: full_name, email, phone
  is_active?: boolean;     // Filter by active status
  role_id?: string;        // Filter by role ID
  role?: string;           // Filter by role name: Admin, Supervisor, Sales
  sort_by?: 'created_at' | 'full_name' | 'email';  // Default: 'created_at'
  sort_order?: 'asc' | 'desc';                      // Default: 'desc'
}
```

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
  "error": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "User not found"
}
```

```json
{
  "success": false,
  "error": "Role not found"
}
```

### 400 Bad Request

```json
{
  "success": false,
  "error": "Email is required"
}
```

```json
{
  "success": false,
  "error": "Invalid email format"
}
```

```json
{
  "success": false,
  "error": "Password must be at least 8 characters"
}
```

```json
{
  "success": false,
  "error": "Full name is required"
}
```

```json
{
  "success": false,
  "error": "Phone number must be 10-20 digits"
}
```

```json
{
  "success": false,
  "error": "Email already exists"
}
```

```json
{
  "success": false,
  "error": "No fields to update"
}
```