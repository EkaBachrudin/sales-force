# FSD - Sales Force Automation System

# Functional Specification Document (FSD)

## Sales Force Automation System - CRM for Property Sales

---

## 1. Document Overview

### 1.1 Purpose

This document defines the technical functional specifications for the development of the **Sales Force CRM System**, which consists of:

1. **Landing Page Lead Generation** - Mortgage simulation & prospect capture
2. **Dashboard Pipeline Management** - Kanban board for lead management
3. **WhatsApp Automation Integration** - Automated follow-ups via WhatsApp

### 1.2 Scope

- **Public Module:** Mortgage simulation landing page
- **Private Module:** CRM dashboard for sales agents
- **Integration Module:** WhatsApp Business API

### 1.3 References

- BRD: [Sales Force Automation System](https://www.notion.so/BRD-Sales-Force-Automation-System-2e4b2c42720c819793e5c67df4e0172f)
- Source: [SALES FORCE](https://www.notion.so/SALES-FORCE-2aeb2c42720c80328e4eeb4c6b939974)

---

## 2. Technical Architecture

### 2.1 Tech Stack

| Layer | Technology | Description |
| --- | --- | --- |
| **Frontend** | Next.js 14+ (App Router) | React framework with SSR/SSG |
| **UI Library** | React, Tailwind CSS, shadcn/ui | Modern component library |
| **Backend API** | Express TS | REST API |
| **Database** | PostgreSQL 15+ | Relational database with JSONB support |
| **ORM** | - | - |
| **Authentication** | JWT + HTTP-only cookies | Secure session management |
| **WhatsApp API** | Twilio / WhatsApp Business API | Messaging integration |
| **Deployment** | VPS (Ubuntu 22.04) | Self-hosted deployment |
| **Reverse Proxy** | Nginx | Web server & load balancer |
| **Process Manager** | systemd / Docker | Service management |
| **SSL** | Let's Encrypt (Certbot) | HTTPS encryption |

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  Public Visitors │         │   Sales Users    │              │
│  │  (Landing Page)  │         │  (Dashboard)     │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                            │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  /landing/*      │         │  /dashboard/*    │              │
│  │  (Public Routes) │         │  (Protected)     │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (VPS)                                 │
│                    Reverse Proxy                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│  express API (Port  │ │  PostgreSQL  │ │  WhatsApp    │
│     8000)        │ │  (Port 5432) │ │  API Service │
│                  │ │              │ │              │
│  - Auth          │ │  - leads     │ │  - Twilio    │
│  - Leads CRUD    │ │  - users     │ │  - WA Cloud  │
│  - Pipeline      │ │  - pipeline  │ │              │
│  - Analytics     │ │  - messages  │ │              │
│  - WA Integration│ │              │ │              │
└──────────────────┘ └──────────────┘ └──────────────┘
```

### 2.3 Database Schema (PostgreSQL)

```sql
-- Table: users (Sales)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Table: leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assigned_to UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    source VARCHAR(50) DEFAULT 'manual', -- 'landing_page', 'whatsapp', 'manual'
    property_url TEXT,
    budget_range JSONB, -- {"min": 500000000, "max": 1000000000}
  
  -- KPR Simulation Data
    property_price NUMERIC(15, 2),
    down_payment NUMERIC(15, 2),
    down_payment_percentage NUMERIC(5, 2),
    interest_rate NUMERIC(5, 2) DEFAULT 5.5,
    loan_term_years INTEGER DEFAULT 15,
    estimated_monthly_payment NUMERIC(15, 2),
  
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'surveyed', 'negotiating', 'closed', 'cancelled'
    notes TEXT,
    last_followed_up_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lead_activities (History)
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL, -- 'status_change', 'note_added', 'call', 'whatsapp'
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: whatsapp_messages
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    user_id UUID REFERENCES users(id),
    direction VARCHAR(20) NOT NULL, -- 'incoming', 'outgoing'
    message_text TEXT NOT NULL,
    message_id VARCHAR(255), -- WhatsApp message ID
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reminder_schedules
CREATE TABLE reminder_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    lead_id UUID REFERENCES leads(id),
    remind_at TIMESTAMPTZ NOT NULL,
    message TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_whatsapp_messages_lead_id ON whatsapp_messages(lead_id);
CREATE INDEX idx_reminder_schedules_user_id ON reminder_schedules(user_id);
CREATE INDEX idx_reminder_schedules_remind_at ON reminder_schedules(remind_at);
```

---

## 3. Functional Specifications

### 3.1 Module 1: Landing Page Lead Generation

### 3.1.1 Page Structure

```
/ (Landing Page)
├── Hero Section
│   ├── Headline: "Hitung KPR Rumah Impian Anda dalam Detik"
│   ├── CTA Button: "Mulai Hitung Sekarang"
│   └── Trust badges: "1000+ Sales Terpercaya"
├── Simulasi KPR Section
│   ├── Input: Harga Rumah (Slider: 100jt - 5M)
│   ├── Input: Uang Muka/DP (Slider: 10% - 50%)
│   ├── Input: Tenor (Dropdown: 5, 10, 15, 20, 25 tahun)
│   ├── Input: Suku Bunga (Default: 5.5%)
│   └── Result: Estimasi Cicilan per Bulan
├── Detail Simulation Section
│   ├── Breakdown: Plafon Pinjaman, DP, Cicilan
│   ├── Chart: Pie chart pembagian angsuran
│   └── CTA: "Dapatkan Detail Promo & Konsultasi Gratis"
├── Lead Capture Form
│   ├── Input: Nama Lengkap (Required)
│   ├── Input: Nomor WhatsApp (Required, format Indonesia)
│   ├── Input: Email (Required)
│   └── Checkbox: Saya setuju dihubungi (Required)
└── Thank You Section
    ├── Success message
    ├── Next steps info
    └── WhatsApp CTA: "Chat Sekarang"
```

### 3.1.2 API Endpoints (Express)

| Method | Endpoint | Description | Request | Response |
| --- | --- | --- | --- | --- |
| POST | /api/v1/kpr/calculate | Calculate mortgage | {price, dp_percent, tenure, rate} | {monthly_payment, total_payment, breakdown} |
| POST | /api/v1/leads/public | Create lead from landing | {name, phone, email, simulation_data} | {lead_id, status, assigned_sales} |

### 3.1.3 KPR Calculation Formula

```tsx
// TypeScript Calculation Logic
function calculateMortgage(
  propertyPrice: number,
  dpPercentage: number,
  annualRate: number,
  years: number
): MortgageResult {
  const dpAmount = propertyPrice * (dpPercentage / 100);
  const principal = propertyPrice - dpAmount;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  // PMT Formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const compound = Math.pow(1 + monthlyRate, numPayments);
  const monthlyPayment = principal * (monthlyRate * compound) / (compound - 1);
  
  return {
    dpAmount,
    principal,
    monthlyPayment,
    totalPayment: monthlyPayment * numPayments,
    totalInterest: monthlyPayment * numPayments - principal,
  };
}
```

### 3.2 Module 2: Dashboard Pipeline Management

### 3.2.1 Page Structure

```jsx
/dashboard (Protected Route)
├── Sidebar Navigation
│   ├── Dashboard
│   ├── Leads
│   ├── Pipeline
│   ├── Analytics
│   ├── WhatsApp
│   └── Settings
├── Top Bar
│   ├── User Profile
│   ├── Notifications
│   └── Logout
└── Main Content Area
    ├── Overview Cards
    │   ├── Total Leads: {count}
    │   ├── This Month: {count}
    │   ├── Surveyed: {count}
    │   └── Closed: {count}
    ├── Lead Detail Panel (Slide-over)
    │   ├── Lead Info (Name, Phone, Email)
    │   ├── Source & Property Interest
    │   ├── KPR Simulation Results
    │   ├── Notes History
    │   ├── Activity Timeline
    │   ├── Quick Actions
    │   │   ├── Call (tel: link)
    │   │   ├── WhatsApp (wa.me link)
    │   │   ├── Add Note
    │   │   └── Schedule Follow-up
    │   └── Move to Stage (Dropdown)
    └── Reminder Panel
        ├── Today's Follow-ups
        ├── Overdue Follow-ups
        └── Upcoming Follow-ups
```

### 3.2.2 API Endpoints (Express)

| Method | Endpoint | Description | Request | Response |
| --- | --- | --- | --- | --- |
| GET | /api/v1/leads | Get all leads (paginated) | query: page, limit, status | {data, total, page} |
| GET | /api/v1/leads/:id | Get lead detail | - | {lead, activities, messages} |
| PUT | /api/v1/leads/:id | Update lead | {status, notes, ...} | {lead} |
| POST | /api/v1/leads/:id/activities | Add activity | {type, notes, metadata} | {activity} |
| GET | /api/v1/pipeline | Get pipeline data | - | {stages: [...], leads: [...]} |
| GET | /api/v1/analytics/overview | Get analytics | - | {metrics} |
| POST | /api/v1/reminders | Create reminder | {lead_id, remind_at, message} | {reminder} |
| GET | /api/v1/reminders | Get reminders | query: date | {reminders} |
| PUT | /api/v1/reminders/:id | Complete reminder | - | {reminder} |

### 3.2.3 Kanban Drag & Drop Logic

```tsx
// Frontend: Drag & Drop Handler
interface DragData {
  leadId: string;
  fromStage: string;
  toStage: string;
}

async function handleDrop({ leadId, toStage }: DragData) {
  // Optimistic update
  updateLeadLocally(leadId, { status: toStage });
  
  // API call
  await fetch(`/api/v1/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: toStage })
  });
  
  // Log activity
  await fetch(`/api/v1/leads/${leadId}/activities`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'status_change',
      new_status: toStage
    })
  });
  
  // Trigger WhatsApp automation if configured
  if (autoMessageEnabled[toStage]) {
    await sendWhatsAppTemplate(leadId, toStage);
  }
}
```

### 3.3 Module 3: WhatsApp Integration

### 3.3.1 WhatsApp Features

```
/dashboard/whatsapp
├── WhatsApp Connection Panel
│   ├── Connection Status
│   ├── QR Code (for first-time login)
│   └── Reconnect Button
├── Template Messages
│   ├── List: predefined templates
│   ├── Create Template Modal
│   └── Edit/Delete actions
├── Message Queue
│   ├── Scheduled messages
│   ├── Sent messages (with status)
│   └── Failed messages (retry)
├── Two-way Chat
│   ├── Contact list (synced from leads)
│   ├── Chat history
│   └── Send/Receive interface
└── Automation Rules
    ├── Trigger: When lead moves to stage
    ├── Action: Send template message
    └── Delay options (immediate, 1hr, 1day)
```

### 3.3.2 API Endpoints (Express - WhatsApp)

| Method | Endpoint | Description | Request | Response |
| --- | --- | --- | --- | --- |
| GET | /api/v1/whatsapp/status | Get connection status | - | {connected, phone_number} |
| POST | /api/v1/whatsapp/send | Send message | {to, message, template_id} | {message_id, status} |
| POST | /api/v1/whatsapp/schedule | Schedule message | {to, message, send_at} | {schedule_id} |
| GET | /api/v1/whatsapp/messages | Get message history | query: lead_id, limit | {messages} |
| POST | /api/v1/whatsapp/templates | Create template | {name, content, variables} | {template} |
| GET | /api/v1/whatsapp/templates | Get templates | - | {templates} |
| POST | /api/v1/whatsapp/webhook | Webhook handler (incoming) | - | {received} |

### 3.3.3 Automation Flow

```tsx
// TypeScript: Trigger on stage change
async function onLeadStatusChange(
  leadId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  // Check if automation is enabled for this stage
  const automation = await getAutomationRule(newStatus);
  
  if (automation) {
    const lead = await getLead(leadId);
    const template = await getTemplate(automation.templateId);
    
    // Replace variables in template
    const message = renderTemplate(template.content, [
      ['{{name}}', lead.name],
      ['{{property}}', lead.propertyUrl || ''],
    ]);
    
    // Send message
    await sendWhatsAppMessage(lead.phone, message, automation.delayMinutes);
    
    // Log the activity
    await logWhatsAppMessage(leadId, message);
  }
}
```

---

## 4. Authentication & Authorization

### 4.1 Auth Flow

```jsx
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │────▶│  Next.js     │────▶│  Express API │
│              │     │  Frontend    │     │  Backend     │
└──────────────┘     └──────────────┘     └──────────────┘
                          │                      │
                          ▼                      ▼
                    /api/auth/login      POST /api/v1/auth/login
                    (email, password)     │
                          │               Validate credentials
                          │                      │
                          │                      ▼
                          │               Generate JWT
                          │                      │
                          │◀─────────────────────┘
                          │ Set httpOnly cookie
                    Redirect to /dashboard
```

### 4.2 JWT Structure

```tsx
interface JWTPayload {
  sub: string;        // User ID
  name: string;       // User name
  email: string;      // User email
  exp: number;         // Expiration time
  iat: number;         // Issued at
}

// Token validity: 7 days
// Refresh token: 30 days
```

### 4.3 Protected Routes Middleware (Next.js)

```tsx
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify token with Express API
  const isValid = await verifyTokenWithBackend(token);
  
  if (!isValid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## 5. VPS Deployment Specification

### 5.1 Server Requirements

| Component | Minimum | Recommended |
| --- | --- | --- |
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Storage | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Bandwidth | 2 TB/month | 4 TB/month |

### 5.2 Deployment Architecture

```
VPS (Ubuntu 22.04)
├── Nginx (Port 80/443)
│   ├── SSL: Let's Encrypt
│   ├── Reverse Proxy to Next.js (Port 3000)
│   └── Reverse Proxy to Express API (Port 8000)
├── Next.js Application
│   ├── Running with PM2
│   ├── Environment: .env.production
│   └── Logs: /var/log/sales-force/nextjs/
├── Express API Service
│   ├── Running as systemd service
│   ├── Environment: /etc/sales-force/.env
│   └── Logs: /var/log/sales-force/api/
└── PostgreSQL
    ├── Port: 5432
    ├── Database: sales_force_db
    ├── User: sales_force_user
    └── Backup: Daily to /var/backups/
```

### 5.3 Environment Variables

```bash
# .env.production (Next.js)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com

# .env (Express API)
DATABASE_URL=postgresql://user:pass@localhost:5432/sales_force_db
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION_DAYS=7

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Or WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-ba-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
```

### 5.4 Nginx Configuration

```jsx
# /etc/nginx/sites-available/sales-force
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Next.js frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Express API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.5 Systemd Service (Express API)

```
# /etc/systemd/system/sales-force-api.service
[Unit]
Description=Sales Force Express API
After=network.target postgresql.service

[Service]
Type=simple
User=salesforce
WorkingDirectory=/var/www/sales-force/api
Environment="NODE_ENV=production"
Environment="DATABASE_URL=postgresql://user:pass@localhost/sales_force_db"
Environment="JWT_SECRET=your-secret"
ExecStart=/var/www/sales-force/api/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 6. Data Models & Types

### 6.1 TypeScript Types (Frontend)

```tsx
// User
type User = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
};

// Lead
type Lead = {
  id: string;
  assigned_to: string;
  name: string;
  phone: string;
  email?: string;
  source: 'landing_page' | 'whatsapp' | 'manual';
  property_url?: string;
  budget_range?: { min: number; max: number };
  property_price?: number;
  down_payment?: number;
  down_payment_percentage?: number;
  interest_rate?: number;
  loan_term_years?: number;
  estimated_monthly_payment?: number;
  status: 'new' | 'contacted' | 'surveyed' | 'negotiating' | 'closed' | 'cancelled';
  notes?: string;
  last_followed_up_at?: string;
  next_follow_up_at?: string;
  created_at: string;
  updated_at: string;
};

// Pipeline Stage
type PipelineStage = {
  id: string;
  name: string;
  color: string;
  order: number;
};

// Lead Activity
type LeadActivity = {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: 'status_change' | 'note_added' | 'call' | 'whatsapp';
  old_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
};

// WhatsApp Message
type WhatsAppMessage = {
  id: string;
  lead_id: string;
  user_id: string;
  direction: 'incoming' | 'outgoing';
  message_text: string;
  message_id?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
};

// Reminder
type Reminder = {
  id: string;
  user_id: string;
  lead_id: string;
  remind_at: string;
  message?: string;
  is_completed: boolean;
  created_at: string;
};
```

### 6.2 TypeScript Interfaces (Backend)

```tsx
interface Lead {
  id: string;
  assigned_to: string;
  name: string;
  phone: string;
  email?: string;
  source: 'landing_page' | 'whatsapp' | 'manual';
  property_url?: string;
  property_price?: number;
  down_payment?: number;
  down_payment_percentage?: number;
  interest_rate?: number;
  loan_term_years?: number;
  estimated_monthly_payment?: number;
  status: LeadStatus;
  notes?: string;
  last_followed_up_at?: string;
  next_follow_up_at?: string;
  created_at: string;
  updated_at: string;
}

interface CreateLeadRequest {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  property_url?: string;
  property_price?: number;
  down_payment_percentage?: number;
  interest_rate?: number;
  loan_term_years?: number;
}

interface LeadResponse {
  lead: Lead;
  kpr_calculation?: KprCalculation;
}

interface KprCalculation {
  property_price: number;
  dp_amount: number;
  principal: number;
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
}

type LeadStatus = 'new' | 'contacted' | 'surveyed' | 'negotiating' | 'closed' | 'cancelled';
```

---

## 7. API Reference

### 7.1 Response Format

```tsx
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### 7.2 Status Codes

| Code | Description |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## 8. Testing Strategy

### 8.1 Unit Tests (TypeScript/Jest)

```tsx
import { describe, test, expect } from '@jest/globals';
import { calculateMortgage } from '../src/utils/kpr';

describe('KPR Calculation', () => {
  test('should calculate down payment correctly', () => {
    const result = calculateMortgage(500_000_000, 20, 5.5, 15);
    expect(result.dpAmount).toBe(100_000_000);
    expect(result.monthlyPayment).toBeGreaterThan(0);
  });

  test('should calculate total interest correctly', () => {
    const result = calculateMortgage(500_000_000, 20, 5.5, 15);
    const expectedTotalInterest = result.totalPayment - result.principal;
    expect(result.totalInterest).toBe(expectedTotalInterest);
  });
});

describe('Lead Status Validation', () => {
  const validStatuses = ['new', 'contacted', 'surveyed', 'negotiating', 'closed', 'cancelled'];
  
  test.each(validStatuses)('should accept valid status: %s', (status) => {
    expect(validStatuses.includes(status)).toBe(true);
  });
  
  test('should reject invalid status', () => {
    expect(validStatuses.includes('invalid')).toBe(false);
  });
});
```

### 8.2 Integration Tests

- Test API endpoints with test database
- Test WhatsApp integration (sandbox)
- Test authentication flow
- Test pipeline transitions

### 8.3 E2E Tests (Playwright)

```tsx
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should calculate KPR correctly', async ({ page }) => {
    await page.goto('/');
    await page.fill('[name="price"]', '500000000');
    await page.fill('[name="dp"]', '20');
    await page.click('button[type="submit"]');
    await expect(page.locator('.monthly-payment')).toBeVisible();
  });

  test('should capture lead', async ({ page }) => {
    await page.goto('/');
    // ... fill KPR form
    await page.click('button[type="submit"]');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="phone"]', '628123456789');
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button:has-text("Dapatkan Detail")');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

---

## 9. Development Phases

### Phase 1: Foundation (Week 1-2)

- [ ]  Setup project structure (Next.js + Express + TypeScript)
- [ ]  Setup PostgreSQL database & migrations
- [ ]  Implement authentication system
- [ ]  Setup VPS & deployment pipeline

### Phase 2: Landing Page (Week 2-3)

- [ ]  Build KPR calculator UI
- [ ]  Implement KPR calculation API
- [ ]  Build lead capture form
- [ ]  Implement lead creation API
- [ ]  Mobile responsive design

### Phase 3: Dashboard MVP (Week 3-5)

- [ ]  Build dashboard layout
- [ ]  Implement Kanban board
- [ ]  Lead CRUD operations
- [ ]  Lead detail view
- [ ]  Basic analytics

### Phase 4: WhatsApp Integration (Week 5-7)

- [ ]  Setup WhatsApp Business API
- [ ]  Template message system
- [ ]  Message queue & scheduling
- [ ]  Webhook handler
- [ ]  Two-way sync

### Phase 5: Automation & Polish (Week 7-8)

- [ ]  Automation rules engine
- [ ]  Reminder system
- [ ]  Advanced analytics
- [ ]  Performance optimization
- [ ]  Security audit

---

## 10. Success Criteria

| Criteria | Target | Measurement |
| --- | --- | --- |
| Landing page load time | < 2s | Lighthouse Performance Score |
| KPR calculation response | < 100ms | API response time |
| Dashboard load time | < 1s | Time to interactive |
| Uptime | 99.5% | Monitoring logs |
| Zero data loss | 100% | Database backup verification |
| Mobile usability | 90+ | Mobile-friendly test |

---

## 11. Security Considerations

### 11.1 Security Measures

| Area | Implementation |
| --- | --- |
| Authentication | JWT with httpOnly cookies |
| Password | bcrypt hashing (cost 12) |
| API Rate Limiting | 100 req/min per IP |
| SQL Injection | Parameterized queries (SQLx) |
| XSS | Input sanitization, CSP headers |
| CSRF | CSRF tokens for state-changing operations |
| Data Encryption | TLS 1.3, database encryption at rest |
| Secrets | Environment variables, .env files not committed |

### 11.2 GDPR Compliance

- Data retention policy configuration
- User data export functionality
- Right to be forgotten (delete account)
- Consent management for data processing
- Privacy policy page

---

## 12. Monitoring & Logging

### 12.1 Application Monitoring

```bash
# Recommended tools:
# - Uptime monitoring: UptimeRobot / StatusCake
# - Error tracking: Sentry (Node.js + JS)
# - Analytics: Plausible (privacy-friendly)
# - Logs: Loki + Grafana
```

### 12.2 Log Strategy

```
/var/log/sales-force/
├── nextjs/
│   ├── access.log
│   └── error.log
├── api/
│   ├── access.log
│   └── error.log
└── nginx/
    ├── access.log
    └── error.log
```

---

## 13. Backup Strategy

### 13.1 Database Backup

```bash
# Daily backup script (cron)
0 2 * * * pg_dump -U sales_force_user sales_force_db | gzip > /var/backups/sales-force/db_$(date +\%Y\%m\%d).sql.gz

# Retention: 30 days
find /var/backups/sales-force/ -name "db_*.sql.gz" -mtime +30 -delete
```

### 13.2 Disaster Recovery

- Weekly off-site backup to cloud storage
- Documented recovery procedure
- RTO: 4 hours
- RPO: 24 hours

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
| --- | --- |
| KPR | Mortgage (Kredit Kepemilikan Rumah) |
| DP | Down Payment (Uang Muka) |
| Lead | Potential customer |
| Pipeline | Sales stages visualization |
| Closing | Successful sale |

### 14.2 References

- [Next.js Documentation](https://nextjs.org/docs)
- Express doc
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/)

---

*Document Version: 1.0*  

*Last Updated: 2026-01-11*  

*Author: Development Team*  

*Tech Stack: Next.js, Express.js + TypeScript, PostgreSQL, VPS*