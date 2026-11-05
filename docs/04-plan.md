# GoCar Auto — Phase 4: Implementation & Slice Delivery Plan

## Overview
This plan establishes the delivery roadmap, architectural milestones, slice breakdown, and dependency matrix for GoCar Auto (SFMS) under the ValdoZ Protocol.

---

## Milestones

| Milestone ID | Target Phase | Focus & Scope | Status |
| :--- | :--- | :--- | :---: |
| **M1: Core System Foundation** | Phase 1–5 | Express backend, SQLite schema, JWT RBAC, Docker containerization | **Completed** |
| **M2: Workshop Operations Engine** | Phase 6 | Staff portal, work order lifecycle, parts catalog, vehicle dossiers | **Completed** |
| **M3: Financials & Arabic PDF Ledger** | Phase 6 | Invoicing, automated payment balance triggers, BiDi Arabic PDF contracts | **Completed** |
| **M4: Dispatch & Smart Reminders Hub** | Phase 6–9 | Predictive scan, WhatsApp multi-template console, 1-click work order intake | **Completed** |
| **M5: Operational Handover & Production Runbook** | Phase 9 | Universal audit compliance, system runbook, operator access transfer | **In Progress** |
| **M6: Telemetry & Payment Gateway Enhancements** | Phase 10 | Direct card gateway (Mada/Stripe), GPS odometer sync | **Planned** |

---

## Slice Breakdown

Each vertical slice delivers a functional user capability through the full stack (Database → API → Frontend).

```
+---------------------------------------------------------------------------------+
|                                SLICE TOPOLOGY                                   |
|                                                                                 |
| [Slice 01: Core Entities]      -> Clients, Vehicles, Service Items              |
| [Slice 02: Work Orders]        -> Intake, Status Transitions, Line Items        |
| [Slice 03: Financials & PDF]   -> Invoice Engine, BiDi Reshaped PDF Generation   |
| [Slice 04: Maintenance Hub]    -> Smart Scan, WhatsApp Dispatch, Rescheduling    |
| [Slice 05: Customer Portal]    -> Self-service VIP Booking, History, Receipts   |
| [Slice 06: Handover Runbook]   -> Operational Deployment & Monitoring           |
+---------------------------------------------------------------------------------+
```

### Slice Details

#### Slice 01: Foundation & Identity (Completed)
- **Goal**: Secure login, user roles (`Admin`, `Operator`), and client/vehicle registry.
- **Components**: `controllers/authController.js`, `controllers/clientController.js`, `controllers/vehicleController.js`.
- **Verification**: Node.js test suite for bcrypt and JWT signature verification.

#### Slice 02: Workshop Work Orders (Completed)
- **Goal**: End-to-end work order tracking from reception to delivery.
- **Components**: `controllers/serviceRequestController.js`, `staff-interface/src/components/ServiceRequestList.jsx`.
- **Verification**: Work order status state machine integrity and line item calculation tests.

#### Slice 03: Billing & Bilingual Contracts (Completed)
- **Goal**: Automated tax and markup computation, bilingual invoice rendering.
- **Components**: `controllers/financialController.js`, `utils/arabicPdf.js`.
- **Verification**: Currency formatting (EGP) and Arabic character reshaping validation.

#### Slice 04: Predictive Maintenance & Dispatch Hub (Completed)
- **Goal**: Algorithmic service reminders, WhatsApp dispatch console, quick reschedule chips.
- **Components**: `controllers/reminderController.js`, `staff-interface/src/components/ServiceRemindersModule.jsx`.
- **Verification**: Deduplication logic, phone normalization (`201xxxxxxxxx`), and bulk queue flow.

#### Slice 05: VIP Customer Portal (Completed)
- **Goal**: Customer self-service booking, vehicle dashboard, and receipt download.
- **Components**: `customer-portal/src/components/Dashboard.jsx`, `customer-portal/src/components/ServiceBooking.jsx`.
- **Verification**: Responsive mobile layout and customer resource authorization checks.

#### Slice 06: Operational Handover & Governance (Current)
- **Goal**: ValdoZ Protocol alignment, system runbook, zero-blocker universal audit.
- **Components**: `docs/09-handover.md`, `docs/04-architecture.md`, `docs/04-plan.md`.
- **Verification**: `valdoz gate check`, `valdoz audit`.

---

## Dependencies

### Internal Architectural Dependencies
- **Work Orders (`service_requests`)** depend strictly on **Clients (`clients`)** and **Vehicles (`vehicles`)**.
- **Financial Transactions (`financial_transactions`)** depend on **Work Orders (`service_requests`)**.
- **Predictive Reminders (`service_reminders`)** depend on **Service Records (`service_records`)** and **Service Items (`service_items`)**.

### External Runtime Dependencies
- **Node.js Environment**: Node.js >= 18.0.0.
- **Database Engine**: `better-sqlite3` / `sqlite3` for local development; `mysql2` optional for enterprise cloud.
- **Text & PDF Processing**: `arabic-reshaper`, `bidi-js`, `pdfkit`.
- **Frontend Build Tools**: Vite 7, React 18, Tailwind CSS, Lucide React, Framer Motion.
- **Container Infrastructure**: Docker Engine 20.10+, Docker Compose 2.0+.
