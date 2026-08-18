# BRD - Sales Force Automation System

## Sales Force Automation System untuk Sales Properti

---

## 1. Executive Summary

### 1.1 Tujuan Dokumen

Dokumen ini mendefinisikan kebutuhan bisnis untuk pengembangan **Sistem Otomasi Sales Force** yang ditujukan untuk sales properti (khususnya Matland) untuk meningkatkan efisiensi proses penjualan dan meningkatkan rasio closing.

### 1.2 Problem Statement

Sales properti menghadapi beberapa tantangan kritikal:

- **Lead Quality Rendah:** 100 orang tanya, hanya ~5 yang serius dan punya dana
- **Lead Drop-off:** Calon pembeli hilang di tengah proses tanpa follow-up yang tepat
- **Kesulitan Membuktikan Nilai:** Hanya mengandalkan brosur dan verbal selling
- **Data Management Manual:** Data lead berserakan di WA, catatan, dan memori
- **Kurangnya Differentiator:** Semua sales menawarkan hal yang sama

### 1.3 Target Outcome

- Peningkatan rasio closing sebesar **20-30%**
- Penghematan waktu kerja **2-3 jam per hari**
- Peningkatan profesionalisme dalam lead management

---

## 2. Stakeholders

| Stakeholder | Peran | Kebutuhan |
| --- | --- | --- |
| Sales Properti | End-user | Alat untuk mengelola lead dan follow-up otomatis |
| Management/Atasan | Decision Maker | Laporan performa sales dan analitik |
| Calon Pembeli | End-customer | Pengalaman simulasi KPR yang mudah |
| Developer | Implementation | Requirement teknis yang jelas |

---

## 3. Functional Requirements

### 3.1 Modul 1 - Magnet KPR (Lead Qualification Tool)

**Priority:** HIGH | **Tier:** 1

| ID Requirement | Deskripsi | Acceptance Criteria |
| --- | --- | --- |
| FR-1.1 | Landing page dengan simulasi KPR interaktif | User dapat memilih harga rumah dan DP |
| FR-1.2 | Kalkulasi cicilan per bulan secara real-time | Hasil muncul < 1 detik setelah input |
| FR-1.3 | Form capture untuk mendapatkan detail simulasi | Field: Nama, No HP, Email (required) |
| FR-1.4 | Lead notification ke sales | Data masuk ke email/WA sales secara real-time |
| FR-1.5 | Mobile responsive | Tampilan optimal di smartphone |

### 3.2 Modul 2 - Dashboard Penjualan (Personal CRM)

**Priority:** HIGH | **Tier:** 2

| ID Requirement | Deskripsi | Acceptance Criteria |
| --- | --- | --- |
| FR-2.1 | Pipeline Kanban Board | Kolom: Baru Masuk, Dikontak, Survey, Negosiasi, Closing, Batal |
| FR-2.2 | Drag & Drop lead management | User dapat memindahkan lead antar kolom |
| FR-2.3 | Detail Lead View | Menampilkan: Nama, HP, Email, Sumber, Catatan, Link Properti |
| FR-2.4 | Reminder Otomatis | Notifikasi follow-up yang terjadwal |
| FR-2.5 | Basic Analytics | Menampilkan: Total lead, Jumlah survey, Jumlah closing per bulan |
| FR-2.6 | Authentication | Login khusus untuk sales yang berwenang |

### 3.3 Modul 3 - WhatsApp Automation

**Priority:** MEDIUM | **Tier:** 3

| ID Requirement | Deskripsi | Acceptance Criteria |
| --- | --- | --- |
| FR-3.1 | Integrasi API WhatsApp | Terkoneksi dengan WhatsApp Business API |
| FR-3.2 | Template messaging | Pesan template yang dapat dipilih sales |
| FR-3.3 | Scheduled messaging | Kirim pesan terjadwal |
| FR-3.4 | Trigger-based automation | Pesan otomatis ketika lead pindah kolom |
| FR-3.5 | Two-way sync | Pesan masuk muncul di dashboard |

---

## 4. Non-Functional Requirements

| Category | Requirement | Target |
| --- | --- | --- |
| Performance | Load time landing page | < 2 detik |
| Performance | Response time simulasi KPR | < 1 detik |
| Availability | Uptime sistem | 99.5% |
| Security | Data encryption | Enkripsi data lead |
| Usability | Learning curve | < 30 menit untuk sales baru |
| Scalability | Concurrent users | Mendukung 10-50 sales simultan |

---

## 5. User Stories

### Story 1 - Sebagai Sales:

> "Saya ingin mendapatkan lead yang sudah terkualifikasi (sudah hitung KPR) sehingga saya tidak membuang waktu mengurusi orang yang tidak serius."
> 

### Story 2 - Sebagai Sales:

> "Saya ingin semua data lead saya tersimpan rapi di satu tempat dengan reminder kapan harus follow-up, agar saya tidak pernah kehilangan prospek."
> 

### Story 3 - Sebagai Sales:

> "Saya ingin melihat performa penjualan saya (berapa lead, survey, closing) agar saya bisa melaporkannya ke atasan."
> 

### Story 4 - Sebagai Calon Pembeli:

> "Saya ingin menghitung estimasi cicilan KPR dengan mudah dan cepat tanpa harus bertanya ke sales."
> 

---

## 6. Technical Stack (Recommended)

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14+, React, Tailwind CSS, shadcn/ui |
| Backend API | Express.js + TypeScript |
| Database | PostgreSQL dengan pg (native driver) |
| Auth | JWT + httpOnly cookies |
| WhatsApp | Twilio / WhatsApp Business API |
| Deployment | VPS Ubuntu 22.04 + Nginx |

---

## 7. Project Phases

### Phase 1 - MVP (Tier 1 Solution)

- **Timeline:** 2-3 minggu
- **Scope:** Landing page simulasi KPR + lead capture
- **Deliverable:** Landing page yang dapat di-share sales

### Phase 2 - Dashboard (Tier 2 Solution)

- **Timeline:** 4-6 minggu
- **Scope:** Dashboard Kanban + analytics
- **Deliverable:** Full CRM system untuk sales

### Phase 3 - Automation (Tier 3 Solution)

- **Timeline:** 6-8 minggu
- **Scope:** Integrasi WhatsApp + automation
- **Deliverable:** Complete automated sales system

---

## 8. Success Metrics

| Metric | Current | Target |
| --- | --- | --- |
| Lead Conversion Rate | ~5% | 15-20% |
| Follow-up Response Time | Tidak terukur | < 24 jam |
| Time Saved per Day | - | 2-3 jam |
| Closing Rate per Month | Baseline | +20-30% |

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Sales resist to change | High | Training + demo prototype gratis |
| WhatsApp API cost | Medium | Use official API dengan pricing yang efisien |
| Data security breach | High | Enkripsi + access control |
| System downtime | Medium | Monitoring + backup system |

---

## 10. Pricing Strategy

| Tier | Features | Price |
| --- | --- | --- |
| Tier 1 - Magnet KPR | Landing page + lead capture | Rp 5-7 Juta |
| Tier 2 - Dashboard | Full CRM system | Rp 15-20 Juta |
| Tier 3 - Full Automation | All features + WA automation | Rp 30 Juta+ |

---

## 11. Next Steps

1. [ ] Validasi BRD dengan stakeholder
2. [ ] Buat prototype/mockup untuk demo
3. [ ] Tentukan tier yang akan diimplementasikan
4. [ ] Buat Technical Design Document (TDD)
5. [ ] Mulai development phase yang dipilih

---

*Document Version: 1.0*  

*Last Updated: 2025-11-17*  

*Owner: Development Team*