# BRD - Sales Force Automation System

## Sales Force Automation System for Property Sales

---

## 1. Executive Summary

### 1.1 Document Purpose

This document defines the business requirements for the development of a **Sales Force Automation System** targeting property sales agents (specifically at Matland) to improve sales process efficiency and increase closing ratios.

### 1.2 Problem Statement

Property sales agents face several critical challenges:

- **Low Lead Quality:** 100 inquiries, only ~5 are serious and financially qualified
- **Lead Drop-off:** Prospects disappear mid-process without proper follow-up
- **Difficulty Proving Value:** Reliance solely on brochures and verbal selling
- **Manual Data Management:** Lead data scattered across WhatsApp, notes, and memory
- **Lack of Differentiation:** All agents offer the same thing

### 1.3 Target Outcome

- Increase closing ratio by **20-30%**
- Save **2-3 hours of work per day**
- Improve professionalism in lead management

---

## 2. Stakeholders

| Stakeholder | Role | Needs |
| --- | --- | --- |
| Property Sales | End-user | Tool for managing leads and automated follow-ups |
| Management/Supervisors | Decision Maker | Sales performance reports and analytics |
| Prospects | End-customer | Easy mortgage simulation experience |
| Developers | Implementation | Clear technical requirements |

---

## 3. Functional Requirements

### 3.1 Module 1 - Mortgage Magnet (Lead Qualification Tool)

**Priority:** HIGH | **Tier:** 1

| Requirement ID | Description | Acceptance Criteria |
| --- | --- | --- |
| FR-1.1 | Landing page with interactive mortgage simulation | User can select home price and down payment |
| FR-1.2 | Real-time monthly installment calculation | Result appears < 1 second after input |
| FR-1.3 | Capture form to collect simulation details | Fields: Name, Phone, Email (required) |
| FR-1.4 | Lead notification to sales agent | Data sent to agent's email/WhatsApp in real-time |
| FR-1.5 | Mobile responsive | Optimal display on smartphones |

### 3.2 Module 2 - Sales Dashboard (Personal CRM)

**Priority:** HIGH | **Tier:** 2

| Requirement ID | Description | Acceptance Criteria |
| --- | --- | --- |
| FR-2.1 | Pipeline Kanban Board | Columns: New, Contacted, Surveyed, Negotiating, Closing, Cancelled |
| FR-2.2 | Drag & drop lead management | User can move leads between columns |
| FR-2.3 | Lead Detail View | Displays: Name, Phone, Email, Source, Notes, Property Link |
| FR-2.4 | Automated Reminders | Scheduled follow-up notifications |
| FR-2.5 | Basic Analytics | Displays: Total leads, Survey count, Monthly closings |
| FR-2.6 | Authentication | Login restricted to authorized sales agents |

### 3.3 Modul 3 - WhatsApp Automation

**Priority:** MEDIUM | **Tier:** 3

| Requirement ID | Description | Acceptance Criteria |
| --- | --- | --- |
| FR-3.1 | WhatsApp API Integration | Connected to WhatsApp Business API |
| FR-3.2 | Template messaging | Predefined message templates for sales agents |
| FR-3.3 | Scheduled messaging | Send scheduled messages |
| FR-3.4 | Trigger-based automation | Automated messages when lead moves between columns |
| FR-3.5 | Two-way sync | Incoming messages appear on the dashboard |

---

## 4. Non-Functional Requirements

| Category | Requirement | Target |
| --- | --- | --- |
| Performance | Landing page load time | < 2 seconds |
| Performance | Mortgage simulation response time | < 1 second |
| Availability | System uptime | 99.5% |
| Security | Data encryption | Lead data encryption |
| Usability | Learning curve | < 30 minutes for new sales agents |
| Scalability | Concurrent users | Support 10-50 simultaneous sales agents |

---

## 5. User Stories

### Story 1 - As a Sales Agent:

> "I want to receive leads that are already qualified (have run the mortgage simulation) so I don't waste time dealing with uninterested parties."
> 

### Story 2 - As a Sales Agent:

> "I want all my lead data stored neatly in one place with reminders on when to follow up, so I never lose a prospect."
> 

### Story 3 - As a Sales Agent:

> "I want to see my sales performance (how many leads, surveys, closings) so I can report it to my supervisor."
> 

### Story 4 - As a Prospect:

> "I want to calculate my estimated mortgage installment easily and quickly without having to ask a sales agent."
> 

---

## 6. Technical Stack (Recommended)

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14+, React, Tailwind CSS, shadcn/ui |
| Backend API | Express.js + TypeScript |
| Database | PostgreSQL with pg (native driver) |
| Auth | JWT + httpOnly cookies |
| WhatsApp | Twilio / WhatsApp Business API |
| Deployment | VPS Ubuntu 22.04 + Nginx |

---

## 7. Project Phases

### Phase 1 - MVP (Tier 1 Solution)

- **Timeline:** 2-3 weeks
- **Scope:** Mortgage simulation landing page + lead capture
- **Deliverable:** Landing page that sales agents can share

### Phase 2 - Dashboard (Tier 2 Solution)

- **Timeline:** 4-6 weeks
- **Scope:** Kanban dashboard + analytics
- **Deliverable:** Full CRM system for sales agents

### Phase 3 - Automation (Tier 3 Solution)

- **Timeline:** 6-8 weeks
- **Scope:** WhatsApp integration + automation
- **Deliverable:** Complete automated sales system

---

## 8. Success Metrics

| Metric | Current | Target |
| --- | --- | --- |
| Lead Conversion Rate | ~5% | 15-20% |
| Follow-up Response Time | Not measured | < 24 hours |
| Time Saved per Day | - | 2-3 hours |
| Closing Rate per Month | Baseline | +20-30% |

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Sales resist to change | High | Training + free prototype demo |
| WhatsApp API cost | Medium | Use official API with efficient pricing |
| Data security breach | High | Encryption + access control |
| System downtime | Medium | Monitoring + backup system |

---

## 10. Pricing Strategy

| Tier | Features | Price |
| --- | --- | --- |
| Tier 1 - Mortgage Magnet | Landing page + lead capture | Rp 5-7 Million |
| Tier 2 - Dashboard | Full CRM system | Rp 15-20 Million |
| Tier 3 - Full Automation | All features + WA automation | Rp 30 Million+ |

---

## 11. Next Steps

1. [ ] Validate BRD with stakeholders
2. [ ] Create prototype/mockup for demo
3. [ ] Determine which tier to implement
4. [ ] Create Technical Design Document (TDD)
5. [ ] Begin development of selected phase

---

*Document Version: 1.0*  

*Last Updated: 2025-11-17*  

*Owner: Development Team*