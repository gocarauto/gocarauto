# GoCar Auto — Phase 2: System Requirements & Specification (PRD)

## Overview
GoCar Auto is a dual-interface Service & Financial Management System (SFMS) engineered for automotive repair workshops, consignment marketplaces, and fleet operations. The platform bridges internal workshop operations with a self-service customer portal, providing bilingual (Arabic/English) billing, automated maintenance reminders, and end-to-end service tracking.

---

## User Personas & Roles

1. **System Administrator (`Admin`)**
   - Full governance over staff credentials, role assignments, and system-wide configurations.
   - Access to executive financial summaries, gross margin analytics, and operational audit logs.

2. **Workshop Staff / Operator (`Operator`)**
   - Manages client records, vehicle profiles, and service dossiers.
   - Oversees the work order pipeline from intake to vehicle handover.
   - Issues bilingual tax invoices, records partial/full payments, and handles receivables.
   - Dispatches automated maintenance reminders via WhatsApp deep links.
   - Manages vehicle consignment workflows and marketplace listing states.

3. **VIP Customer / Vehicle Owner (`Customer`)**
   - Self-authenticates into the Customer VIP Portal.
   - Reviews real-time work order progress, vehicle dossiers, and inspection documents.
   - Downloads bilingual PDF invoices, digital receipts, and verified Service Passports.
   - Submits service bookings and vehicle consignment requests.
   - Tracks phone referral rewards and attribution network spend.

---

## Functional Requirements

### FR-1: Authentication & Access Control (RBAC)
- Multi-role JWT session management (`Admin`, `Operator`, `Customer`).
- Cryptographic password hashing via bcrypt with salted rounds.
- Strict authorization barriers isolating customer data and administrative controls.
- IDOR defenses preventing cross-tenant access to invoices, dossiers, and client profiles.
- Token handling rejecting URL query parameter tokens on state-mutating requests (`POST`, `PUT`, `DELETE`).

### FR-2: Client & Fleet Vehicle Dossiers
- Normalized client directory supporting individual vehicle owners and commercial fleet accounts.
- Comprehensive vehicle profiles including VIN, make, model, year, license plate, mileage, and engine specs.
- Public vehicle pedigree lookup with privacy redactions (scrubbed personal ownership data).

### FR-3: Workshop Service Lifecycle & Work Orders
- Configurable service catalog with part costs, labor rates, and tax calculations.
- Multi-stage work order workflow: `Pending` -> `In Progress` -> `Completed` -> `Delivered` -> `Cancelled`.
- Automated vehicle total spend calculation maintained via database triggers on service records.

### FR-4: Bilingual Invoicing & Financial Accounting
- Dual-currency and dual-language (Arabic/English) invoice generation.
- Arabic text reshaping and bidirectional (BiDi) algorithmic rendering.
- Real-time balance rollup, split payments, and payment status updates (`Unpaid`, `Partial`, `Paid`).
- Segregated delivery fees, workshop pass-throughs, and consignment commissions in revenue reports.

### FR-5: Automated Maintenance Reminders & WhatsApp Dispatch
- Canonical service type deduplication preventing duplicate reminders for the same vehicle/service.
- Dynamic mileage and date-based reminder calculation.
- One-click WhatsApp dispatch with pre-filled bilingual notification templates.

### FR-6: Consignment & Used Car Marketplace Hub
- Customer-initiated sell/consignment requests.
- Staff listing management pipeline: `Draft` -> `Pending Review` -> `Listed` -> `Sold` -> `Settled`.
- Automated 2.5% GoCar commission cut calculation and operational revenue reporting.
- Public marketplace and social platform (Facebook Marketplace) listing synchronization.

### FR-7: Verified Vehicle Service Passport
- Tamper-evident PDF export documenting full certified service history.
- Privacy-compliant public view accessible via secure hash/VIN verification.

---

## Non-Functional Requirements

### NFR-1: Security & Compliance
- Zero secrets committed to version control (`valdoz audit` clean).
- Parameterized queries with SQL injection prevention across SQLite and MySQL dialects.
- Strict CORS configuration and role-validated endpoint guards.

### NFR-2: Performance & Scalability
- Sub-100ms API response time for typical CRUD queries.
- Indexed database foreign keys eliminating full table scans on high-traffic tables.
- Static assets optimized for CDN delivery.

### NFR-3: Cost Efficiency & High Availability
- 100% Free Tier Cloud Architecture ($0/month target).
- Edge-hosted SPAs on Cloudflare Pages.
- Containerized backend on Render.com paired with TiDB Serverless MySQL.

### NFR-4: Accessibility & Localization
- Complete bidirectional layout support (LTR for English, RTL for Arabic).
- Responsive UI across mobile (viewport >= 360px), tablet, and desktop (1920x1080).

---

## Acceptance Criteria

1. **Security & Authorization**:
   - All protected routes reject unauthenticated requests with HTTP 401.
   - Customers cannot query, view, or mutate records (invoices, dossiers, appointments) of other customers.
   - Secrets are strictly parsed from environment variables and never checked into source control.

2. **Core Workflow Execution**:
   - Creating or updating a service request automatically triggers vehicle total spend updates without manual intervention.
   - Invoices accurately calculate tax, discounts, and payment status transitions (`Unpaid` to `Partial` to `Paid`).
   - Arabic PDF generation renders properly shaped and aligned right-to-left text.

3. **Consignment & Ledger Segregation**:
   - Consignment listings accurately apply the 2.5% fee on settlement.
   - Referral attributions correctly link new clients to referrers without leaking personal data.

4. **Quality & Verification**:
   - 100% pass rate across the full automated test suite (`npm test`).
   - All gate checks and SAST scans pass with zero blocking errors.

---

## Out of Scope

1. **Direct Credit Card / In-App Payment Processing**:
   - Integration with external payment gateways (e.g. Mada, Stripe, Moyasar) is deferred to future payment provider integrations. Payments are currently recorded by operators as verified transactions.
2. **Real-time Vehicle OBD-II / IoT Telemetry**:
   - Hardware-level GPS and automatic odometer sync from vehicle CAN bus devices is out of scope for the current software lifecycle.
3. **Multi-Workshop Multi-Tenancy**:
   - Multi-tenant enterprise SaaS isolation across disparate garage companies is not in the scope of this single-organization deployment.
