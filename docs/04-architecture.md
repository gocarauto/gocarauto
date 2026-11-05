# GoCar Auto — Phase 4: System Architecture Specification

## Overview
GoCar Auto is an automotive fleet and customer service platform providing maintenance lifecycle management, bilingual Arabic/English invoices and digital agreements, staff workshop operations, and a client self-service VIP portal.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|  +----------------------------------+     +-------------------------------------+ |
|  |  Staff Command Center            |     |  Customer VIP Portal                | |
|  |  (React 18 + Vite, Port 5173)    |     |  (React 18 + Vite + RTL, Port 5174) | |
|  +-----------------+----------------+     +------------------+------------------+ |
+--------------------|-----------------------------------------|--------------------+
                     |                                         |
                     +--------------------+--------------------+
                                          |
                                          v (HTTP / REST + JWT Cookie / Bearer)
+-----------------------------------------------------------------------------------+
|                                  APPLICATION TIER                                 |
|  +------------------------------------------------------------------------------+ |
|  |  Express.js API Engine (Node.js, Port 3000)                                  | |
|  |  - Auth Middleware & RBAC (Admin / Operator / Customer)                      | |
|  |  - Arabic Text Reshaper & BiDi PDF Pipeline (PDFKit + arabic-reshaper)        | |
|  |  - Service Reminders & Dispatch Engine (WhatsApp universal API deep links)   | |
|  |  - Financial & Invoicing Subsystem                                           | |
|  +--------------------------------------+---------------------------------------+ |
+-----------------------------------------|-----------------------------------------+
                                          v (SQLite / MySQL Dialect Adapter)
+-----------------------------------------------------------------------------------+
|                                  DATA PERSISTENCE                                 |
|  +------------------------------------------------------------------------------+ |
|  |  Relational Database (database/gocar_auto.db / MySQL)                         | |
|  |  - Foreign key constraints enabled                                            | |
|  |  - Automated balance rollup triggers                                         | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## Data Model

The persistence layer uses a normalized relational schema with strict foreign keys and automated balance triggers.

### Core Entities

```
+----------------+       +-------------------+       +--------------------+
|    clients     | 1---* |     vehicles      | 1---* |  service_requests  |
+----------------+       +-------------------+       +--------------------+
| id (PK)        |       | id (PK)           |       | id (PK)            |
| full_name      |       | client_id (FK)    |       | client_id (FK)     |
| phone          |       | make, model, year |       | vehicle_id (FK)    |
| email          |       | license_plate     |       | status, mileage    |
| total_spent    |       | vin               |       | scheduled_date     |
+----------------+       | current_mileage   |       +---------+----------+
                         +---------+---------+                 | 1
                                   | 1                         |
                                   |                           v *
                                   |                 +--------------------+
                                   |                 |  service_records   |
                                   |                 +--------------------+
                                   |                 | id (PK)            |
                                   |                 | request_id (FK)    |
                                   |                 | item_id (FK)       |
                                   |                 | quantity, price    |
                                   |                 +--------------------+
                                   v *                         | 1
                         +--------------------+                v
                         | service_reminders  |      +--------------------+
                         +--------------------+      |   service_items    |
                         | id (PK)            |      +--------------------+
                         | client_id (FK)     |      | id (PK)            |
                         | vehicle_id (FK)    |      | item_name (EN)     |
                         | service_type       |      | item_name_ar (AR)  |
                         | due_date, status   |      | category, price    |
                         +--------------------+      +--------------------+
```

### Table Definitions

1. **`users`**: Administrative and operational workshop staff.
   - `id`, `name`, `role` (`Admin`, `Operator`), `email`, `mobile`, `password_hash`, `created_at`, `updated_at`.
2. **`clients`**: Vehicle owners and corporate fleet accounts.
   - `id`, `full_name`, `email`, `phone`, `address`, `password_hash`, `total_spent`, `join_date`.
3. **`vehicles`**: Tracked automotive assets.
   - `id`, `client_id`, `make`, `model`, `year`, `license_plate`, `vin`, `current_mileage`, `last_service_date`, `next_service_due`.
4. **`service_items`**: Master parts and labor catalog with bilingual naming.
   - `id`, `item_name`, `item_name_ar`, `category` (`Parts`, `Oil`, `Service`), `sale_price`, `is_active`.
5. **`service_requests`**: Intake tickets and maintenance orders.
   - `id`, `client_id`, `vehicle_id`, `status` (`Open`, `In Progress`, `Completed`, `Invoiced`, `Paid`), `mileage`, `notes`, `source`.
6. **`service_records`**: Line items per service order.
   - `id`, `request_id`, `item_id`, `quantity`, `unit_price`, `total_price`, `notes`.
7. **`financial_transactions`**: Ledger invoices, payment receipts, and tax calculations.
   - `id`, `request_id`, `invoice_number`, `total_amount_due`, `amount_paid`, `payment_status` (`Pending`, `Paid`, `Partial`), `tax_rate`, `currency`.
8. **`service_reminders`**: Predictive maintenance dispatch ledger.
   - `id`, `client_id`, `vehicle_id`, `service_type`, `due_date`, `status` (`Pending`, `Sent`, `Completed`), `interval_km`, `interval_months`, `notes`.

---

## API Contracts

The RESTful API operates under the `/api` prefix with JSON payloads and uniform response envelopes.

### Standard Response Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Optional operational feedback"
}
```

### Core Route Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/staff/login`: Staff login returning JWT session cookie and user profile.
- `POST /api/auth/customer/login`: Client portal login with phone/email and password.
- `POST /api/auth/customer/register`: Self-service onboarding for new customers.
- `GET /api/auth/verify`: Validates existing session and returns current role.
- `POST /api/auth/logout`: Clears session token.

#### Service Management (`/api/service-requests`)
- `GET /api/service-requests`: List all work orders with filters for status, date range, and client.
- `POST /api/service-requests`: Create new maintenance work order.
- `GET /api/service-requests/:id`: Retrieve full order details including line items and invoices.
- `PATCH /api/service-requests/:id/status`: Transition work order stage (`Open` -> `In Progress` -> `Completed` -> `Invoiced`).
- `POST /api/service-requests/:id/items`: Append parts/services line items to a ticket.

#### Service Reminders (`/api/reminders`)
- `GET /api/reminders/all?status=Pending`: Query active or sent reminders globally.
- `POST /api/reminders`: Register a scheduled service target.
- `PUT /api/reminders/:id`: Reschedule due date or update reminder status (`Pending` -> `Sent`).
- `DELETE /api/reminders/:id`: Purge reminder record.
- `POST /api/reminders/smart-scan`: Cross-reference past invoice history to auto-generate predictive reminders and discover unserviced prospect vehicles.

#### Client Management (`/api/clients`)
- `GET /api/clients`: Search and paginate customer accounts.
- `POST /api/clients`: Register customer record.
- `GET /api/clients/:id`: Fetch client profile, linked vehicle fleet, and total spending history.
- `PUT /api/clients/:id`: Update contact info and preferences.

#### Vehicle Registry (`/api/vehicles`)
- `GET /api/vehicles`: List registered vehicles.
- `POST /api/vehicles`: Bind vehicle to a client record (VIN, plate, model, mileage).
- `GET /api/vehicles/:id/history`: Chronological maintenance ledger for a specific vehicle.

#### Invoicing & Financials (`/api/financial`)
- `POST /api/financial/generate-invoice`: Generate invoice and line item breakdown.
- `GET /api/financial/:id/pdf`: Stream compiled bilingual PDF receipt.
- `PUT /api/financial/:id/payment`: Record partial or full cash/card settlement.

---

## Authentication

Authentication is implemented via stateless signed JSON Web Tokens (JWT) coupled with Role-Based Access Control (RBAC).

```
[ Browser Client ]
       |
       | 1. POST /api/auth/staff/login (credentials)
       v
[ Auth Middleware ] ---> [ bcrypt.compare(password, hash) ]
       |
       | 2. Issue JWT (signed with HS256 secret)
       v
[ Set-Cookie: token=... (HttpOnly, SameSite=Lax) ]
       |
       | 3. Subsequent Request with Token
       v
[ verifyToken Middleware ]
       |
       +---> Decode payload (userId, role, email)
       +---> [ isStaff Middleware ]: Enforce role in ('Admin', 'Operator')
       +---> [ isAdmin Middleware ]: Enforce role === 'Admin'
       +---> Next handler
```

- **Token Lifetime**: 24-hour expiration window.
- **Cookie Security**: `HttpOnly`, `SameSite=Lax`, secure flags in production.
- **Customer Isolation**: Customer portal endpoints (`/api/customer-portal/*`) verify that `req.user.clientId` matches requested resources, preventing horizontal privilege escalation.

---

## Integration Points

1. **WhatsApp Messaging Engine**:
   - Universal URL dispatch (`api.whatsapp.com/send?phone=201xxxxxxxxx&text=...`).
   - Deep-linking triggers native desktop and mobile WhatsApp clients with pre-filled bilingual templates without external third-party API costs.

2. **Arabic Text Reshaping & BiDi PDF Pipeline**:
   - Integrated `arabic-reshaper` and `bidi-js` with `pdfkit` to ensure correct right-to-left rendering of Arabic glyphs for invoices, contracts, and receipts.

3. **Docker Orchestration**:
   - `docker-compose.yml` binds the Node.js backend container (`backend:3000`) and the dual frontend client builds (`staff-interface`, `customer-portal`) with network isolation and persistent volume storage.

4. **Multi-Dialect Database Adapter (`database/db.js`)**:
   - Abstraction layer that supports SQLite (`sqlite3`) for zero-dependency local environments and MySQL (`mysql2`) for high-concurrency production deployments.
