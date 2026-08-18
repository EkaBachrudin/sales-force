# WHTSAPP INTEGRATION (golang)

# WhatsApp SaaS - Technical Documentation

## Table of Contents

1. WhatsApp Device Connection
2. Campaign Management

---

## 1. WhatsApp Device Connection

### Overview

Fitur untuk menghubungkan WhatsApp Web ke aplikasi menggunakan QR code scanning. Mendukung multi-tenant dengan session isolation per tenant.

### Tools & Libraries

| Component | Tool/Library | Purpose |
| --- | --- | --- |
| **WhatsApp Library** | [go.mau.fi/whatsmeow](https://github.com/tulir/whatsmeow) | WhatsApp Web API untuk Go |
| **Session Storage** | SQLite (sqlstore) | Menyimpan session data per tenant |
| **WebSocket Server** | [github.com/coder/websocket](https://github.com/coder/websocket) | Real-time QR & status updates |
| **QR Code Generator** | [github.com/skip2/go-qrcode](https://github.com/skip2/go-qrcode) | Generate QR image PNG |
| **HTTP Framework** | Gin | REST API handler |
| **Main Database** | PostgreSQL + GORM | Device metadata storage |
| **Frontend** | React + WebSocket API | UI & real-time connection |

---

### API Endpoints

### Device Management

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/device` | Get current device info |
| `GET` | `/api/v1/device/status` | Get connection status |
| `POST` | `/api/v1/device/connect` | Generate QR code for connection |
| `POST` | `/api/v1/device/disconnect` | Disconnect device |
| `GET` | `/api/v1/device/groups` | Get joined WhatsApp groups |
| `POST` | `/api/v1/device/import-group` | Import contacts from group |
| `WS` | `/api/v1/device/ws?token={jwt}` | WebSocket for real-time updates |

### Request/Response Examples

**POST /api/v1/device/connect**

`// Request
Headers: Authorization: Bearer {jwt_token}

// Response (200 OK)
{
  "qr_code": "4...QR_CODE_STRING...",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "status": "qr_generated"
}`

**WebSocket Events**

`// QR Code generated
{
  "type": "qr",
  "code": "4...QR_CODE_STRING...",
  "image": "base64_png_image"
}

// Device connected
{
  "type": "connected",
  "status": "connected"
}

// Connection failed
{
  "type": "failed",
  "status": "disconnected"
}

// Logged out
{
  "type": "logged_out",
  "status": "disconnected"
}`

---

### Flow Diagram

`┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

1. User clicks "Connect Device"
   ↓
2. Frontend opens WebSocket connection
   ↓
3. Frontend calls POST /api/v1/device/connect
   ↓
4. Backend generates WhatsMeow client & QR code
   ↓
5. QR code pushed via WebSocket
   ↓
6. User scans QR with WhatsApp phone
   ↓
7. Success event pushed via WebSocket
   ↓
8. Device connected & ready to send messages

┌─────────────────────────────────────────────────────────────────────────────┐
│                         TECHNICAL FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend                           Backend                        WhatsApp
────────                           ───────                        ─────────
1. WS Connect  ──────────────────►  Validate JWT
2. POST /connect ────────────────►  Create SQLite session
                                   Initialize WhatsMeow client
                                   client.Connect()
                                   ↓
3. ◄──────────────────────────────  QR Channel Event (code)
   Display QR                       Generate QR image
                                   Push via WS
4.                                    ◄─────────────────────────────►
   User scans with phone            Connect to WA servers
                                   Pairing process
5.                                   ◄─────────────────────────────►
   ◄──────────────────────────────  QR Channel Event (success)
   Show "Connected"                 Save session to SQLite
                                   Update DB status`

---

### Architecture

`┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Device.jsx                                                           │  │
│  │  - WebSocket connection for real-time updates                         │  │
│  │  - QR code display modal                                              │  │
│  │  - Connection status badge                                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Go)                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Device Handler (device_handler.go)                                   │  │
│  │  - POST /connect → GenerateQR()                                       │  │
│  │  - POST /disconnect → Disconnect()                                    │  │
│  │  - GET /groups → GetJoinedGroups()                                    │  │
│  │  - POST /import-group → ImportGroupContacts()                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  WebSocket Handler (ws_handler.go)                                    │  │
│  │  - JWT validation                                                      │  │
│  │  - Connection upgrade                                                 │  │
│  │  - Tenant ID extraction                                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  WhatsApp Service (whatsapp.go)                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Clients Map: map[tenantID]*WhatsMeowClient                     │ │  │
│  │  │  ┌───────────────────────────────────────────────────────────┐ │ │  │
│  │  │  │  WhatsMeowClient                                          │ │ │  │
│  │  │  │  - DeviceID, TenantID                                     │ │ │  │
│  │  │  │  - Client: *whatsmeow.Client                              │ │ │  │
│  │  │  │  - Status, Phone                                          │ │ │  │
│  │  │  └───────────────────────────────────────────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  - GenerateQR(): Create client, get QR channel, return QR           │  │
│  │  - Connect(): Restore existing session                              │  │
│  │  - Disconnect(): Logout, delete session, remove from memory         │  │
│  │  - SendMessage(): Send text/media to recipient                      │  │
│  │  - PushCampaignUpdate(): Push WebSocket update                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STORAGE                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │  PostgreSQL             │  │  SQLite (Per Tenant)                    │  │
│  │  ┌───────────────────┐  │  │  wa_{tenantID}.db                       │  │
│  │  │ devices table     │  │  │  ┌───────────────────────────────────┐ │  │
│  │  │ - id              │  │  │  │ Device Store                       │ │  │
│  │  │ - tenant_id       │  │  │  │ - Encryption keys                  │ │  │
│  │  │ - status          │  │  │  │ - Auth tokens                      │ │  │
│  │  │ - phone_number    │  │  │  │ - Session data                     │ │  │
│  │  │ - jid             │  │  │  │ - Pre-keys                         │ │  │
│  │  │ - last_seen       │  │  │  │ - Identity keys                    │ │  │
│  │  └───────────────────┘  │  │  └───────────────────────────────────┘ │  │
│  └─────────────────────────┘  │  ┌───────────────────────────────────┐ │  │
│                               │  │ Contacts Cache                     │ │  │
│                               │  │ - Phone numbers                    │ │  │
│                               │  │ - Names                            │ │  │
│                               │  └───────────────────────────────────┘ │  │
│                               └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WHATSAPP SERVERS                                    │
│  - Authentication & Pairing                                                │
│  - Message Delivery                                                        │
│  - Receipt Tracking (sent/delivered/read)                                  │
└─────────────────────────────────────────────────────────────────────────────┘`

---

### Database Schema

**PostgreSQL - devices table**

`CREATE TABLE devices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'disconnected',
    phone_number VARCHAR(50),
    jid VARCHAR(100),
    session_data TEXT,
    last_seen TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);`

**SQLite - Session Structure (per tenant)**

`wa_{tenantID}.db
├── device_store        # Encryption keys, registration data
├── chat_settings       # Chat-specific settings
├── contacts            # Cached contact info
├── group Participants   # Group member info
└── history             # Message history sync`

---

### Status Flow

`disconnected
     ↓
[User clicks Connect]
     ↓
qr_generated ──────────► failed (timeout/error)
     ↓
[QR scanned]
     ↓
connected
     ↓
[User disconnects/logs out]
     ↓
disconnected`

---

## 2. Campaign Management

### Overview

Fitur untuk mengirim broadcast message ke multiple contacts dengan dukungan scheduling dan template personalization.

### Tools & Libraries

| Component | Tool/Library | Purpose |
| --- | --- | --- |
| **HTTP Framework** | Gin | REST API handler |
| **Database** | PostgreSQL + GORM | Campaign & message storage |
| **Scheduler** | Go time.Ticker | In-process background scheduler |
| **WhatsApp** | whatsmeow | Message sending |
| **WebSocket** | github.com/coder/websocket | Real-time progress updates |
| **Frontend** | React | Campaign UI & monitoring |

---

### API Endpoints

### Campaign Management

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/campaigns` | List campaigns (paginated) |
| `POST` | `/api/v1/campaigns` | Create new campaign |
| `PUT` | `/api/v1/campaigns/:id` | Update campaign |
| `GET` | `/api/v1/campaigns/:id` | Get campaign details |
| `DELETE` | `/api/v1/campaigns/:id` | Delete campaign |
| `POST` | `/api/v1/campaigns/:id/send` | Send campaign (now or schedule) |
| `GET` | `/api/v1/campaigns/:id/messages` | Get campaign messages |
| `POST` | `/api/v1/messages/:messageID/resend` | Resend failed message |

### Request/Response Examples

**POST /api/v1/campaigns**

`// Request
{
  "name": "Promo Ramadhan",
  "template": "Hello {{prefix}} {{name}}, promo spesial untuk Anda!",
  "image_url": "https://example.com/promo.jpg",
  "contact_ids": ["uuid-1", "uuid-2", "uuid-3"]
}

// Response (201 Created)
{
  "id": "campaign-uuid",
  "name": "Promo Ramadhan",
  "template": "Hello {{prefix}} {{name}}, promo spesial untuk Anda!",
  "image_url": "https://example.com/promo.jpg",
  "status": "draft",
  "total_count": 3,
  "created_at": "2026-04-01T10:00:00Z"
}`

**POST /api/v1/campaigns/:id/send (Send Now)**

`// Request
{
  "scheduled_at": null
}

// Response (200 OK)
{
  "message": "Campaign started"
}`

**POST /api/v1/campaigns/:id/send (Schedule)**

`// Request
{
  "scheduled_at": "2026-04-01T14:30:00Z"
}

// Response (200 OK)
{
  "message": "Campaign scheduled",
  "scheduled_at": "2026-04-01T14:30:00Z"
}`

**WebSocket Campaign Progress Update**

`{
  "type": "campaign_update",
  "campaign_id": "campaign-uuid",
  "status": "running",
  "success_count": 5,
  "failed_count": 1
}`

---

### Flow Diagram

### Send Now Flow

`User               Frontend            Backend           WhatsApp
│                    │                    │                   │
├─ Click "Send" ────►│                    │                   │
│                    ├─ POST /send ──────►│                   │
│                    │                    ├─ Get messages    │
│                    │                    ├─ Status: running │
│                    │                    ├─ Start goroutine │
│                    │◄─ "Started" ───────┤                   │
│                    │                    │                   │
│                    │◄─── WS: running ───┤                   │
│                    │  (progress: 0/0)   │                   │
│                    │                    │                   │
│                    │                    ├─ Send msg 1 ─────►│
│                    │                    ├─ Typing indicator │
│                    │◄─── WS: 1/0 ───────┤                   │
│                    │                    │                   │
│                    │                    ├─ Sleep 30-60s     │
│                    │                    │                   │
│                    │                    ├─ Send msg 2 ─────►│
│                    │                    ◄─── Receipt ───────┤
│                    │◄─── WS: 2/0 ───────┤                   │
│                    │                    │                   │
│                    │                    ├─ ...all messages  │
│                    │                    │                   │
│                    │◄─── WS: completed ──┤                   │
│                    │  (10/2)            │                   │`

### Schedule Flow

`Server Startup               Scheduler                    Backend
│                               │                            │
├─ Start() ───────────────────►│                            │
│                               ├─ Ticker every 30s          │
│                               │                            │
│                               ├─ Check scheduled ─────────►│
│                               │  (due time reached?)       │
│                               │                            │
│                               │◄─── campaigns ─────────────┤
│                               │                            │
│                               ├─ UpdateStatusAtomic ─────►│
│                               │  (scheduled→running)       │
│                               │                            │
│                               ├─ runCampaign()             │
│                               │  (same as Send Now)        │
│                               │                            │
│                               └─ Loop every 30s            │`

---

### Architecture

`┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Campaigns.jsx                                                        │  │
│  │  - Campaign list with status                                          │  │
│  │  - Create/Edit modal                                                   │  │
│  │  - Send modal (Now/Schedule)                                           │  │
│  │  - Detail modal with message progress                                  │  │
│  │  - WebSocket listener for real-time updates                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Go)                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Campaign Handler (campaign_handler.go)                               │  │
│  │  - Create/Update/Delete campaign                                      │  │
│  │  - Send(): Process Send Now or Schedule                               │  │
│  │  - processCampaignMessages(): Async sending goroutine                 │  │
│  │  - createMessagesForCampaign(): Template replacement                   │  │
│  │  - replaceTemplate(): {{name}}, {{prefix}} substitution               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Campaign Scheduler (campaign_scheduler.go)                           │  │
│  │  - Start(): Background goroutine with ticker                          │  │
│  │  - processScheduledCampaigns(): Check every 30s                       │  │
│  │  - runCampaign(): Execute scheduled campaign                          │  │
│  │  - Stop(): Graceful shutdown                                          │  │
│  │                                                                       │  │
│  │  Started in main.go at server startup                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL DATABASE                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  campaigns table                                                      │  │
│  │  - id, tenant_id, name, template                                      │  │
│  │  - status, scheduled_at, started_at, completed_at                     │  │
│  │  - total_count, success_count, failed_count                           │  │
│  │  - image_url                                                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  messages table                                                       │  │
│  │  - id, campaign_id, contact_id, tenant_id                             │  │
│  │  - phone, message, image_url                                          │  │
│  │  - status (pending/sent/delivered/read/failed)                        │  │
│  │  - whatsapp_id, sent_at, error                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘`

---

### Database Schema

**campaigns table**

`CREATE TABLE campaigns (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    template TEXT NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);`

**messages table**

`CREATE TABLE messages (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    whatsapp_id VARCHAR(100),
    sent_at TIMESTAMP,
    error TEXT,
    created_at TIMESTAMP
);`

---

### Status Flow

**Campaign Status:**

`draft ──┬─► Send Now ──► running ──► completed
        │                                   │
        └─► Schedule ──► scheduled ──┬──────┘
                                    │
                                    └──────► running ──► completed`

**Message Status:**

`pending ──► sent ──► delivered ──► read
    │                            │
    └────────────────────────────┴──────► failed`

---

### Template Variables

| Variable | Description | Example |
| --- | --- | --- |
| `{{name}}` | Contact name | "John Doe" |
| `{{prefix}}` | Contact prefix (title) | "Pak", "Bu", "Mas" |

**Example Template:**

`Hello {{prefix}} {{name}},
Promo spesial Ramadhan untuk Anda! Dapatkan diskon 50% untuk semua produk.

Klik: https://example.com/promo

Terima kasih!`

**After replacement:**

`Hello Pak Budi,
Promo spesial Ramadhan untuk Anda! Dapatkan diskon 50% untuk semua produk.

Klik: https://example.com/promo

Terima kasih!`

---

### Sending Behavior

| Setting | Value | Purpose |
| --- | --- | --- |
| **Initial delay** | 500ms | Before first message (Send Now) / 2s (Schedule) |
| **Between messages** | 25-60 seconds (random) | Anti-rate limiting |
| **Typing indicator** | Yes | Shows "typing..." on recipient's phone |

---

### Multi-Server Considerations

**Current Implementation:**

- Scheduler runs on every server instance
- `UpdateStatusAtomic` prevents duplicate execution

**Recommendation for Production:**

- Use dedicated scheduler server OR
- Implement distributed lock with Redis OR
- Use job queue (Bull, Sidekiq, etc.)

---

## Quick Reference

### Common Status Codes

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (invalid input) |
| `401` | Unauthorized (invalid/expired token) |
| `403` | Forbidden (not your resource) |
| `404` | Not Found |
| `500` | Internal Server Error |

### Device Status Values

| Status | Description |
| --- | --- |
| `disconnected` | Not connected to WhatsApp |
| `qr_generated` | QR code ready, waiting for scan |
| `connected` | Successfully connected |
| `active` | Connection active (alternative) |

### Campaign Status Values

| Status | Description |
| --- | --- |
| `draft` | Campaign created, not sent |
| `scheduled` | Campaign scheduled for future |
| `running` | Currently sending messages |
| `completed` | All messages sent |
| `cancelled` | Campaign cancelled |
| `failed` | Campaign failed |

### Message Status Values

| Status | Description |
| --- | --- |
| `pending` | Waiting to be sent |
| `sent` | Sent to WhatsApp server |
| `delivered` | Delivered to recipient |
| `read` | Read by recipient |
| `failed` | Failed to send |

---

*Documentation generated from codebase analysis - 2026*