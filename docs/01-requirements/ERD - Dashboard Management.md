# ERD - Dashboard Management

---

## 1. Overview

This document contains the complete **Entity Relationship Diagram (ERD)** for the Sales Force Automation CRM system using Mermaid chart format.

### Database Information

- **DBMS:** PostgreSQL 15+
- **Database Name:** sales_force_db
- **Total Tables:** 12 core tables
- **Relationships:** One-to-Many, Many-to-One
- **Extensions:** uuid-ossp, btree_gist

### Related Documents

- BRD: Sales Force Automation System
- FSD: Sales Force Automation System

---

## 2. Complete ERD (Mermaid)

```mermaid
erDiagram
    %% Roles Table - Role Management
    roles {
        uuid id PK
        varchar name "UK, NOT NULL"
        varchar_255 description
        jsonb permissions "DEFAULT '{}'"
        boolean is_active "DEFAULT true"
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    %% Users Table - Sales/Agent Data
    users {
        uuid id PK
        uuid role_id "FK → roles.id"
        varchar_100 full_name "NOT NULL"
        varchar_255 email "UNIQUE, NOT NULL"
        varchar_20 phone
        varchar_255 password_hash "NOT NULL"
        boolean is_active "DEFAULT true"
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    %% User Sessions Table - Session Management
    user_sessions {
        uuid id PK
        uuid user_id "FK → users.id, NOT NULL"
        varchar_255 refresh_token_hash "UNIQUE, NOT NULL"
        jsonb device_info
        inet ip_address
        text user_agent
        boolean is_active "DEFAULT true"
        timestamptz expires_at "NOT NULL"
        timestamptz last_activity_at "DEFAULT NOW()"
        timestamptz created_at "DEFAULT NOW()"
    }

    %% Revoked Tokens Table - JWT Blacklist
    revoked_tokens {
        uuid id PK
        varchar_255 jti "UNIQUE, NOT NULL"
        uuid user_id "FK → users.id"
        timestamptz revoked_at "DEFAULT NOW()"
        timestamptz expires_at "NOT NULL"
    }

    %% Properties Table - Property/Cluster Catalog
    properties {
        uuid id PK
        uuid assigned_to "FK → users.id, NOT NULL"
        varchar_255 name "NOT NULL"
        varchar_100 city "NOT NULL"
        numeric_10_2 land_area
        text address
        text description
        varchar_500 siteplan_assets
        boolean is_active "DEFAULT true"
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    %% Blocks Table - Property Blocks
    blocks {
        uuid id PK
        uuid property_id "FK → properties.id, NOT NULL"
        varchar_100 name "NOT NULL"
        boolean is_active "DEFAULT true"
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    %% Units Table - Property Units
    units {
        uuid id PK
        uuid block_id "FK → blocks.id, NOT NULL"
        varchar_100 name "NOT NULL"
        numeric_10_2 land_area
        varchar_20 status "DEFAULT 'available', CHECK: available, reserved, booked, sold"
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    %% Leads Table - Customer/Prospect Data
    leads {
        uuid id PK
        uuid assigned_to "FK → users.id"
        uuid unit_id "FK → units.id"
        varchar_100 name "NOT NULL"
        varchar_16 nik "CHECK: 16 digit"
        varchar_20 npwp "CHECK: 15-20 digit"
        varchar_20 phone "NOT NULL, CHECK: 10-20 digit"
        varchar_255 email
        varchar_50 source "DEFAULT 'Visit'"
        jsonb budget_range
        numeric_15_2 property_price
        numeric_15_2 down_payment
        numeric_5_2 down_payment_percentage "CHECK: 1-100%"
        numeric_5_2 interest_rate "DEFAULT 5.5, CHECK: > 0"
        integer loan_term_years "DEFAULT 15, CHECK: 5,10,15,20,25"
        numeric_15_2 estimated_monthly_payment
        varchar_50 status "DEFAULT 'new', CHECK: new, contacted, surveyed, negotiating, booked, closed, cancelled"
        text notes
        timestamptz last_followed_up_at
        timestamptz next_follow_up_at
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    %% Lead Activities Table - Audit Trail & History
    lead_activities {
        uuid id PK
        uuid lead_id "FK → leads.id, NOT NULL"
        uuid user_id "FK → users.id, NOT NULL"
        varchar_50 activity_type "CHECK: status_change, note_added, call, whatsapp"
        varchar_50 old_status "CHECK: new, contacted, surveyed, negotiating, booked, closed, cancelled"
        varchar_50 new_status "CHECK: new, contacted, surveyed, negotiating, booked, closed, cancelled"
        text notes
        jsonb metadata
        timestamptz created_at "DEFAULT NOW()"
    }

    %% WhatsApp Messages Table - Message Log
    whatsapp_messages {
        uuid id PK
        uuid lead_id "FK → leads.id, NOT NULL"
        uuid user_id "FK → users.id, NOT NULL"
        varchar_20 direction "CHECK: incoming, outgoing"
        text message_text "NOT NULL"
        varchar_255 message_id
        varchar_50 status "DEFAULT 'sent', CHECK: sent, delivered, read, failed"
        timestamptz sent_at "DEFAULT NOW()"
        timestamptz created_at "DEFAULT NOW()"
    }

    %% Reminder Schedules Table - Follow-up Reminders
    reminder_schedules {
        uuid id PK
        uuid user_id "FK → users.id, NOT NULL"
        uuid lead_id "FK → leads.id, NOT NULL"
        timestamptz remind_at "NOT NULL"
        text message
        boolean is_completed "DEFAULT false"
        timestamptz created_at "DEFAULT NOW()"
    }

    %% Subscriptions Table - Subscription Management
    subscriptions {
        uuid id PK
        uuid user_id "FK → users.id, NOT NULL"
        varchar_50 subscription_type "NOT NULL, CHECK: monthly, quarterly, annual"
        numeric_15_2 amount "NOT NULL, CHECK: >= 0"
        timestamptz period_start
        timestamptz period_end
        timestamptz due_date "NOT NULL"
        varchar_50 status "DEFAULT 'pending', CHECK: pending, active, overdue, cancelled"
        text notes
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    %% Relationships - Roles
    roles ||--o{ users : "has users"

    %% Relationships - Subscriptions
    users ||--o{ subscriptions : "has subscriptions"

    %% Relationships - Authentication
    users ||--o| user_sessions : "has active session"
    users ||--o{ revoked_tokens : "has revoked tokens"

    %% Relationships - Core Business
    users ||--o{ properties : "owns (assigned_to)"
    users ||--o{ leads : "manages (assigned_to)"
    users ||--o{ lead_activities : "performs (user_id)"
    users ||--o{ whatsapp_messages : "sends (user_id)"
    users ||--o{ reminder_schedules : "creates (user_id)"

    %% Relationships - Property Hierarchy (NEW)
    properties ||--o{ blocks : "has blocks"
    blocks ||--o{ units : "has units"

    %% Relationships - Leads to Units (MODIFIED)
    units ||--o{ leads : "selected by (unit_id)"

    leads ||--o{ lead_activities : "has history (lead_id)"
    leads ||--o{ whatsapp_messages : "has messages (lead_id)"
    leads ||--o{ reminder_schedules : "has reminders (lead_id)"
```

---

## 3. Entity Details

### 3.1 Roles Table

**Purpose:** Stores role/permission data for system users.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Role name (Admin, Supervisor, Sales) |
| description | VARCHAR(255) | NULLABLE | Role description |
| permissions | JSONB | DEFAULT '{}' | Role permissions list |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Default Roles (Seeded):**

| Name | Description | Permissions |
| --- | --- | --- |
| Admin | Full system access | dashboard, leads, analytics, properties, settings, users, subscriptions |
| Supervisor | Can manage team and view all leads | dashboard, leads, analytics, properties, settings, users |
| Sales | Can manage assigned leads and properties | dashboard, leads, analytics, properties, settings |

**Relationships:**

- One-to-Many with **users** (role_id)

**JSONB Structure - permissions:**

```json
{
  "access": ["dashboard", "leads", "analytics", "properties", "settings"]
}
```

---

### 3.2 Users (Sales/Agent)

**Purpose:** Stores data for sales agents using the system.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| role_id | UUID | FK → roles.id, ON DELETE SET NULL | Role reference |
| full_name | VARCHAR(100) | NOT NULL | Sales agent full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| phone | VARCHAR(20) | NULLABLE | Sales agent phone number |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| is_active | BOOLEAN | DEFAULT true | Active/inactive status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Constraints:**

- Email must be unique for each user
- Email must be in valid format: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$`
- Passwords are stored as hashes
- Soft delete using `is_active`
- Existing users are automatically assigned to 'Sales' role during migration

**Relationships:**

- Many-to-One with **roles** (role_id)
- One-to-Many with **properties** (assigned_to)
- One-to-Many with **leads** (assigned_to)
- One-to-Many with **lead_activities** (user_id)
- One-to-Many with **whatsapp_messages** (user_id)
- One-to-Many with **reminder_schedules** (user_id)
- One-to-Many with **user_sessions** (user_id)
- One-to-Many with **revoked_tokens** (user_id)
- One-to-Many with **subscriptions** (user_id)

---

### 3.3 User Sessions Table

**Purpose:** Stores active user sessions for refresh token rotation and session activity tracking.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL, ON DELETE CASCADE | User reference |
| refresh_token_hash | VARCHAR(255) | UNIQUE, NOT NULL | Refresh token hash |
| device_info | JSONB | NULLABLE | Device info (type, OS, browser) |
| ip_address | INET | NULLABLE | Login IP address |
| user_agent | TEXT | NULLABLE | User agent string |
| is_active | BOOLEAN | DEFAULT true | Session active/inactive status |
| expires_at | TIMESTAMPTZ | NOT NULL | Refresh token expiry (7 days) |
| last_activity_at | TIMESTAMPTZ | DEFAULT NOW() | Last activity tracking |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Session creation timestamp |

**JSONB Structure - device_info:**

```json
{
  "device_type": "desktop|mobile|tablet",
  "os": "Windows|macOS|Linux|iOS|Android",
  "browser": "Chrome|Firefox|Safari|Edge"
}
```

**Note:**
- Single device login is handled at the application layer by deactivating previous sessions on new login
- Session cleanup runs periodically to remove expired sessions

---

### 3.4 Revoked Tokens Table

**Purpose:** Blacklist for JWT tokens revoked before expiry (for security).

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| jti | VARCHAR(255) | UNIQUE, NOT NULL | JWT ID of revoked token |
| user_id | UUID | FK → users.id, ON DELETE CASCADE | User reference |
| revoked_at | TIMESTAMPTZ | DEFAULT NOW() | Token revocation timestamp |
| expires_at | TIMESTAMPTZ | NOT NULL | Original JWT expiry time |

**Note:**
- `user_id` is nullable to support revoked tokens from deleted users
- Tokens past `expires_at` can be removed via cleanup job

---

### 3.5 Properties (Property/Cluster Catalog)

**Purpose:** Stores master property or cluster data. Each property must be assigned to a specific sales agent. Specific unit details are at the `units` level.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| assigned_to | UUID | FK → users.id, NOT NULL, ON DELETE CASCADE | Sales agent assigned to property |
| name | VARCHAR(255) | NOT NULL | Property/cluster name (e.g., Grand Permata Residence) |
| city | VARCHAR(100) | NOT NULL | Property location city |
| land_area | NUMERIC(10,2) | NULLABLE | Total land area (m²) |
| address | TEXT | NULLABLE | Full property address |
| description | TEXT | NULLABLE | General property description |
| siteplan_assets | VARCHAR(500) | NULLABLE | Siteplan image URL or file path |
| is_active | BOOLEAN | DEFAULT true | Active property status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**

- Many-to-One with **users** (assigned_to)
- One-to-Many with **blocks** (property_id)

---

### 3.6 Blocks (Block/Cluster within Property)

**Purpose:** Stores unit grouping data within a property (e.g., Block A, Block B).

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| property_id | UUID | FK → properties.id, NOT NULL, ON DELETE CASCADE | Parent property |
| name | VARCHAR(100) | NOT NULL | Block name (e.g., Block Anggrek, Block A) |
| is_active | BOOLEAN | DEFAULT true | Active block status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Constraints:**

- Unique constraint: `(property_id, name)` - block name must be unique within a property.

**Relationships:**

- Many-to-One with **properties** (property_id)
- One-to-Many with **units** (block_id)

---

### 3.7 Units (Specific Property Units)

**Purpose:** Stores specific units for sale. Unit status is automatically controlled by triggers based on associated lead status.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| block_id | UUID | FK → blocks.id, NOT NULL, ON DELETE CASCADE | Parent block |
| name | VARCHAR(100) | NOT NULL | Unit name (e.g., A-1, A-2) |
| land_area | NUMERIC(10,2) | NULLABLE | Specific unit land area (m²) |
| status | VARCHAR(20) | DEFAULT 'available' | Unit availability status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unit Status Values:**

| Value | Description | Automatic Trigger from Lead |
| --- | --- | --- |
| `available` | Unit available for sale | Lead cancelled / no active lead |
| `reserved` | Unit under processing/negotiation | Lead status: *new, contacted, surveyed, negotiating* |
| `booked` | Unit paid booking fee | Lead status: *booked* |
| `sold` | Unit sold (contract signed) | Lead status: *closed* |

**Constraints:**

- Unique constraint: `(block_id, name)` - unit name must be unique within a block.
- CHECK constraint: `status IN ('available', 'reserved', 'booked', 'sold')`

**Relationships:**

- Many-to-One with **blocks** (block_id)
- One-to-Many with **leads** (unit_id)

**Unit to Lead status:**

```jsx
Lead Status          │  Unit Status   │  Reason
─────────────────────┼────────────────┼──────────────────────────────────
NEW                  │  RESERVED      │  Initial interest, mark unit
CONTACTED            │  RESERVED      │  Initial communication
SURVEYED             │  RESERVED      │  Site visit completed
NEGOTIATING          │  RESERVED      │  Still negotiating, no payment yet
BOOKED               │  BOOKED        │  Booking fee paid
CLOSED               │  SOLD          │  Contract completed
CANCELLED            │  AVAILABLE*    │  Available again
```

---

### 3.8 Leads (Prospects/Customers)

**Purpose:** Stores prospect/customer data. Leads now relate directly to `units`, not `properties`.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| assigned_to | UUID | FK → users.id, ON DELETE SET NULL | Responsible sales agent |
| unit_id | UUID | FK → units.id, ON DELETE SET NULL | Interested specific unit |
| name | VARCHAR(100) | NOT NULL | Prospect name |
| nik | VARCHAR(16) | CHECK: 16 digit numbers | NIK number |
| npwp | VARCHAR(20) | CHECK: 15-20 digit numbers | NPWP number |
| phone | VARCHAR(20) | NOT NULL, CHECK: 10-20 digit numbers | WhatsApp/phone number |
| email | VARCHAR(255) | NULLABLE | Prospect email |
| source | VARCHAR(50) | DEFAULT 'Visit' | Lead source |
| budget_range | JSONB | NULLABLE | Budget range {min, max} |
| property_price | NUMERIC(15,2) | NULLABLE | Property price |
| down_payment | NUMERIC(15,2) | NULLABLE | Down payment amount in rupiah |
| down_payment_percentage | NUMERIC(5,2) | CHECK: 1-100% | Down payment percentage |
| interest_rate | NUMERIC(5,2) | DEFAULT 5.5, CHECK: > 0 | Mortgage interest rate |
| loan_term_years | INTEGER | DEFAULT 15, CHECK: 5,10,15,20,25 | Loan term (years) |
| estimated_monthly_payment | NUMERIC(15,2) | NULLABLE | Estimated monthly payment |
| status | VARCHAR(50) | only: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled` | Lead process status |
| notes | TEXT | NULLABLE | Additional notes |
| last_followed_up_at | TIMESTAMPTZ | NULLABLE | Last follow-up timestamp |
| next_follow_up_at | TIMESTAMPTZ | NULLABLE | Next follow-up schedule |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Lead creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Constraints Detail:**

- `status` must be one of: `new`, `contacted`, `surveyed`, `negotiating`, `booked`, `closed`, `cancelled`

**Status Flow:**

```
new → contacted → surveyed → negotiating → booked → closed
  └─────────────────────────────────────────────────→ cancelled
```

**Relationships:**

- Many-to-One with **users** (assigned_to)
- Many-to-One with **units** (unit_id)
- One-to-Many with **lead_activities** (lead_id)
- One-to-Many with **whatsapp_messages** (lead_id)
- One-to-Many with **reminder_schedules** (lead_id)

**JSONB Structure - budget_range:**

```json
{
  "min": 500000000,
  "max": 1000000000
}
```

---

### 3.9 Lead Activities Table

**Purpose:** Audit trail & history for all activities related to leads.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| lead_id | UUID | FK → leads.id, NOT NULL, ON DELETE CASCADE | Lead reference |
| user_id | UUID | FK → users.id, NOT NULL, ON DELETE CASCADE | User who performed activity |
| activity_type | VARCHAR(50) | NOT NULL, CHECK: status_change, note_added, call, whatsapp | Activity type |
| old_status | VARCHAR(50) | CHECK: new, contacted, surveyed, negotiating, closed, cancelled | Previous status |
| new_status | VARCHAR(50) | CHECK: new, contacted, surveyed, negotiating, closed, cancelled | New status |
| notes | TEXT | NULLABLE | Activity notes |
| metadata | JSONB | NULLABLE | Additional data |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Activity creation timestamp |

**Activity Type Values:**

| Value | Description |
| --- | --- |
| status_change | Lead status change |
| note_added | Note added |
| call | Phone call |
| whatsapp | WhatsApp activity |

**Relationships:**

- Many-to-One with **leads** (lead_id)
- Many-to-One with **users** (user_id)

---

### 3.10 WhatsApp Messages Table

**Purpose:** Stores WhatsApp message logs for lead communication.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| lead_id | UUID | FK → leads.id, NOT NULL, ON DELETE CASCADE | Lead reference |
| user_id | UUID | FK → users.id, NOT NULL, ON DELETE CASCADE | Sending/receiving user |
| direction | VARCHAR(20) | NOT NULL, CHECK: incoming, outgoing | Message direction |
| message_text | TEXT | NOT NULL | Message content |
| message_id | VARCHAR(255) | NULLABLE | Message ID from WhatsApp API |
| status | VARCHAR(50) | DEFAULT 'sent', CHECK: sent, delivered, read, failed | Delivery status |
| sent_at | TIMESTAMPTZ | DEFAULT NOW() | Message send timestamp |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Direction Values:**

| Value | Description |
| --- | --- |
| incoming | Message from lead |
| outgoing | Message from sales agent |

**Status Values:**

| Value | Description |
| --- | --- |
| sent | Message sent to server |
| delivered | Message received on device |
| read | Message read |
| failed | Send failed |

**Relationships:**

- Many-to-One with **leads** (lead_id)
- Many-to-One with **users** (user_id)

---

### 3.11 Reminder Schedules Table

**Purpose:** Stores follow-up reminder schedules for sales agents.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL, ON DELETE CASCADE | Sales agent with reminder |
| lead_id | UUID | FK → leads.id, NOT NULL, ON DELETE CASCADE | Lead to follow up |
| remind_at | TIMESTAMPTZ | NOT NULL | Reminder timestamp |
| message | TEXT | NULLABLE | Reminder message/context |
| is_completed | BOOLEAN | DEFAULT false | Completion status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Reminder creation timestamp |

**Relationships:**

- Many-to-One with **users** (user_id)
- Many-to-One with **leads** (lead_id)

---

### 3.12 Subscriptions Table

**Purpose:** Stores user subscription data for system access.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL, ON DELETE CASCADE | User reference |
| subscription_type | VARCHAR(50) | NOT NULL, CHECK: monthly, quarterly, annual | Subscription type |
| amount | NUMERIC(15,2) | NOT NULL, CHECK: >= 0 | Payment amount |
| period_start | TIMESTAMPTZ | NULLABLE | Subscription period start |
| period_end | TIMESTAMPTZ | NULLABLE | Subscription period end |
| due_date | TIMESTAMPTZ | NOT NULL | Due date |
| status | VARCHAR(50) | DEFAULT 'pending', CHECK: pending, active, overdue, cancelled | Subscription status |
| notes | TEXT | NULLABLE | Subscription notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Constraints:**

- `subscription_type` must be one of: `monthly`, `quarterly`, `annual`
- `status` must be one of: `pending`, `active`, `overdue`, `cancelled`
- `amount` must be >= 0
- If both `period_start` and `period_end` are provided, `period_end` must be > `period_start`

**Subscription Types & Periods:**

| subscription_type | Period | Description |
| --- | --- | --- |
| monthly | 1 month | Monthly payment |
| quarterly | 3 months | Quarterly payment |
| annual | 12 months | Annual payment |

**Status Flow:**

```
pending → active → (renewal) → pending
   │
   └──→ overdue → (payment) → active
   │
   └──→ cancelled
```

**Business Rules:**

- A user can have multiple subscription records (history)
- `period_start` and `period_end` are nullable to support flexibility during initial creation
- If `due_date` < NOW() and status is still 'pending', automatically becomes 'overdue' (via background job)
- Users with 'overdue' status cannot access certain features

**Relationships:**

- Many-to-One with **users** (user_id)

---

## 4. Relationship Details

### 4.1 Users ↔︎ Properties (One-to-Many)

```
┌─────────────┐         ┌──────────────┐
│    users    │         │  properties  │
├─────────────┤         ├──────────────┤
│ id (PK)     │───────▶│ assigned_to  │
│ full_name   │   1:N  │ id (PK)      │
│ email       │         │ name         │
│ ...         │         │ city         │
└─────────────┘         └──────────────┘

Foreign Key: properties.assigned_to → users.id
ON DELETE: CASCADE
```

### 4.2 Properties ↔︎ Blocks (One-to-Many)

```
┌──────────────┐         ┌───────────┐
│  properties  │         │  blocks   │
├──────────────┤         ├───────────┤
│ id (PK)      │───────▶│ property_id│
│ name         │   1:N  │ id (PK)   │
│ city         │         │ name      │
└──────────────┘         └───────────┘

Foreign Key: blocks.property_id → properties.id
ON DELETE: CASCADE
```

### 4.3 Blocks ↔︎ Units (One-to-Many)

```
┌───────────┐         ┌───────────┐
│  blocks   │         │   units   │
├───────────┤         ├───────────┤
│ id (PK)   │───────▶│ block_id  │
│ name      │   1:N  │ id (PK)   │
└───────────┘         │ name      │
                      │ status    │
                      └───────────┘

Foreign Key: units.block_id → blocks.id
ON DELETE: CASCADE
```

### 4.4 Units ↔︎ Leads (One-to-Many)

```
┌───────────┐         ┌─────────────┐
│   units   │         │    leads    │
├───────────┤         ├─────────────┤
│ id (PK)   │───────▶│ unit_id     │
│ name      │   1:N  │ id (PK)     │
│ status    │         │ name        │
└───────────┘         │ status      │
                      └─────────────┘

Foreign Key: leads.unit_id → units.id
ON DELETE: SET NULL
```

**Business Rule:**

- Lead directly selects a **specific unit** (not a general property).
- One unit can have **multiple active leads** simultaneously.
- When one lead reaches `booked` status, other leads on that unit are unassigned (unit exclusively claimed by `booked` lead); no new leads can be assigned while a `booked` lead exists.
- If a unit is deleted, `unit_id` on leads becomes NULL.
- Lead status changes **automatically update unit status** via Database Trigger.

### 4.5 Users ↔︎ Leads (One-to-Many)

```
┌─────────────┐         ┌─────────────┐
│    users    │         │    leads    │
├─────────────┤         ├─────────────┤
│ id (PK)     │───────▶│ assigned_to │
│ full_name   │   1:N  │ id (PK)     │
│ email       │         │ name        │
│ ...         │         │ ...         │
└─────────────┘         └─────────────┘

Foreign Key: leads.assigned_to → users.id
ON DELETE: SET NULL
```

---

## 5. Database Extensions

| Extension | Purpose |
| --- | --- |
| uuid-ossp | Generate UUID v4 for primary keys |
| btree_gist | Support for GiST index (used if EXCLUDE constraint implementation is needed in the future) |

---

## 6. Index Summary

### Performance Indexes

| Table | Index Name | Column(s) | Purpose |
| --- | --- | --- | --- |
| users | idx_users_email | email | Lookup by email (login) |
| users | idx_users_is_active | is_active | Filter active users |
| users | idx_users_role_id | role_id | Filter by role |
| user_sessions | idx_user_sessions_user_id | user_id | Find sessions by user |
| user_sessions | idx_user_sessions_token_hash | refresh_token_hash | Token validation |
| user_sessions | idx_user_sessions_is_active | is_active | Filter active sessions |
| user_sessions | idx_user_sessions_expires_at | expires_at | Cleanup expired sessions |
| revoked_tokens | idx_revoked_tokens_jti | jti | Token blacklist check |
| revoked_tokens | idx_revoked_tokens_expires_at | expires_at | Cleanup expired tokens |
| properties | idx_properties_assigned_to | assigned_to | Filter by sales |
| properties | idx_properties_city | city | Filter by location |
| properties | idx_properties_is_active | is_active | Filter active properties |
| **blocks** | **idx_blocks_property_id** | **property_id** | **Find blocks by property** |
| **blocks** | **idx_blocks_property_name_unique** | **property_id, name** | **Unique block name per property** |
| **units** | **idx_units_block_id** | **block_id** | **Find units by block** |
| **units** | **idx_units_status** | **status** | **Filter by availability** |
| **units** | **idx_units_block_name_unique** | **block_id, name** | **Unique unit name per block** |
| leads | idx_leads_assigned_to | assigned_to | Filter by sales |
| **leads** | **idx_leads_unit_id** | **unit_id** | **Filter by unit** |
| leads | idx_leads_status | status | Filter by status |
| leads | idx_leads_created_at | created_at | Sorting by date |
| leads | idx_leads_source | source | Filter by source |
| leads | idx_leads_nik | nik | NIK lookup |
| leads | idx_leads_next_follow_up | next_follow_up_at (WHERE NOT NULL) | Reminder queries |
| lead_activities | idx_lead_activities_lead_id | lead_id | History lookup |
| lead_activities | idx_lead_activities_user_id | user_id | Filter by user |
| lead_activities | idx_lead_activities_created_at | created_at | Sorting |
| lead_activities | idx_lead_activities_type | activity_type | Filter by type |
| whatsapp_messages | idx_whatsapp_messages_lead_id | lead_id | Message history |
| whatsapp_messages | idx_whatsapp_messages_user_id | user_id | Filter by user |
| whatsapp_messages | idx_whatsapp_messages_created_at | created_at | Sorting |
| whatsapp_messages | idx_whatsapp_messages_status | status | Filter by status |
| reminder_schedules | idx_reminder_schedules_user_id | user_id | Filter by user |
| reminder_schedules | idx_reminder_schedules_lead_id | lead_id | Filter by lead |
| reminder_schedules | idx_reminder_schedules_remind_at | remind_at | Scheduled reminders |
| reminder_schedules | idx_reminder_schedules_is_completed | is_completed | Filter pending |
| roles | idx_roles_name | name | Role lookup |
| roles | idx_roles_is_active | is_active | Filter active roles |
| subscriptions | idx_subscriptions_user_id | user_id | Filter by user |
| subscriptions | idx_subscriptions_status | status | Filter by status |
| subscriptions | idx_subscriptions_subscription_type | subscription_type | Filter by type |
| subscriptions | idx_subscriptions_due_date | due_date | Overdue check |
| subscriptions | idx_subscriptions_period | period_start, period_end | Period overlap check |
| subscriptions | idx_subscriptions_created_at | created_at | Sorting |

---

*Document Version: 2.2*

*Last Updated: 2026-07-10*

*Database: PostgreSQL 15+*