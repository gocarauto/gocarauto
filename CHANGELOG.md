# Changelog

All notable changes to the GoCar Auto platform are documented in this file.

## [Unreleased] - 2026-11-05

### Added (Pillar 4: 100% Free Cloud Deployment Architecture & Workflow)
- **Zero-Cost Production Blueprint (`docs/08-deploy.md`):**
  - Formulated full-stack decoupled architecture across Cloudflare Pages (Frontend SPAs), Render.com Docker (Backend API), TiDB Cloud Serverless (MySQL Database), Cloudflare R2 (10GB Object Storage), and UptimeRobot (Cold-start keepalive ping).
- **Frontend SPA Deployment Optimizations:**
  - Added `customer-portal/public/_redirects` (`/* /index.html 200`) and `staff-interface/public/_redirects` for 100% error-free client-side routing on Cloudflare Pages and Netlify.
  - Added production environment templates `customer-portal/.env.production.example` and `staff-interface/.env.production.example`.
- **Backend & Cloud Database Adaptation:**
  - Enhanced `database/db.js` with `DB_PORT`, `DB_SSL` TLS 1.2+ configuration for TiDB Serverless, and agnostic table initialization check `database.isInitialized()`.
  - Added `database/schema.mysql.sql` matching production schema for MySQL/TiDB.
  - Added `render.yaml` infrastructure-as-code blueprint for 1-click zero-cost backend deployment.
  - Updated `Dockerfile` default command to production `node server.js` while retaining dev command in `docker-compose.yml`.
- **Continuous Integration & Governance Pipeline:**
  - Added `.github/workflows/ci.yml` verifying backend test suite (Node 20), frontend ESLint checks, and Vite production builds on every push/PR.
  - Added `.github/workflows/valdoz.yml` for automated CI phase gate verification and strict static security auditing.
  - Formally logged architectural decision `DEC-002` in `.valdoz/decisions.jsonl` and `.valdoz/decisions.md`.
  - Formally logged architectural decision `DEC-003`: Established mandatory 3-stage lifecycle hierarchy (Local Antigravity -> GitHub Version Control -> Live Production Cloud).
  - Codified non-bypassable workflow invariants in `.agent/rules/04-environment-workflow.md` and operational guide in `docs/WORKFLOW.md`.
  - Passed ValdoZ Phase 8 verification gate with pre-logged research citations (`RES-001` to `RES-005`).
  - Generated live interactive ValdoZ dashboard at `.valdoz/dashboard.html`.
  - Configured project-isolated Git identity (`gocarauto <go2carauto@gmail.com>`) and successfully published initial production release to `https://github.com/gocarauto/gocarauto`.
- **Customer Portal Hook Purity & Render Loops:**
  - Resolved `react-hooks/set-state-in-effect` in `customer-portal/src/context/AuthContext.jsx` by converting synchronous `setState` in `useEffect` to lazy state initialization `useState(() => ...)`.
  - Resolved `react-hooks/purity` in `customer-portal/src/components/AIAdvisor.jsx` by replacing impure `Date.now()` calls with a sequential ref-based message ID counter (`msgIdRef`).
  - Resolved cascading re-render effect in `customer-portal/src/components/DirectionSwitcher.jsx` by deriving active direction during render.
  - Resolved synchronous `setMobileOpen(false)` inside `useEffect([location.pathname])` in `customer-portal/src/components/Layout.jsx` and `staff-interface/src/components/Layout.jsx` by binding mobile sheet dismissal to navigation links.
  - Resolved `customer-portal/src/components/MagicLogin.jsx` synchronous state setting by lazily initializing status based on token presence.
  - Eliminated over 40 dead variable assignments and unused imports across `Dashboard.jsx`, `Appointments.jsx`, `ServiceBooking.jsx`, `ServiceHistory.jsx`, `Settings.jsx`, `VehicleFleet.jsx`, `Glovebox.jsx`, and `InvoiceList.jsx`.
- **Staff Interface Static Quality & Stability:**
  - Corrected useless regex escape characters in `staff-interface/src/components/ServiceRequestDetail.jsx` (`[\.\)]` -> `[.)]`).
  - Resolved unused state variables (`showWhatsappInput`, `otherCount`, `dataJson`, `accentColor`, `isDir2`, `isDir3`).
  - Synchronized `staff-interface/src/components/ConsignmentHub.jsx` data fetching to eliminate cascading re-renders on mount.
  - Configured ESLint rules in both frontends to properly ignore React member expressions (`motion.*`) and capitalized component prop parameters (`Icon`).
- **Quality Gates:**
  - `customer-portal`: 0 ESLint errors, Vite production build clean.
  - `staff-interface`: 0 ESLint errors, Vite production build clean.
  - Backend test suite: 34/34 passing (7 suites).

### Performance (Pillar 2: Database & Query Performance)
- **Database Query Indexing:**
  - Added `idx_customer_documents_client` on `customer_documents(client_id)`: Eliminated full table scans on Digital Glovebox queries (`SCAN customer_documents` -> `SEARCH customer_documents USING INDEX idx_customer_documents_client`).
  - Added `idx_service_reminders_client` on `service_reminders(client_id)`: Eliminated index scans on customer reminder checks.
  - Added `idx_service_reminders_vehicle` on `service_reminders(vehicle_id)`.
  - Added `idx_financial_transactions_status` on `financial_transactions(payment_status)` for optimized revenue and invoice queries.
  - Added `idx_service_requests_scheduled_date` on `service_requests(scheduled_date)` to optimize appointment searches.
  - Updated `database/schema.sql` and synchronized with live `gocar_auto.db`.

### Security (Pillar 3: Zero Breaches & Authorization Boundaries)
- **IDOR Protection Verification:**
  - Added integration test `GOCAR-SEC-09`: Verified customer tokens cannot view or download invoice PDFs belonging to other clients (returns 403 Forbidden).
  - Added integration test `GOCAR-SEC-10`: Verified customer tokens cannot access service history of vehicles owned by other clients (returns 403 Forbidden).
- **Brute Force & Enumeration Protection:**
  - Applied `authLimiter` (10 requests per 15-minute window) to `GET /auth/customer/magic-login/:token` in `routes/auth.js` to block brute-force token enumeration attacks.
- **Upload Path Traversal Protection:**
  - Verified `routes/customer-documents.js` and `controllers/customerDocumentController.js` enforce private non-public storage, extension whitelisting (`.pdf, .jpg, .jpeg, .png, .webp`), unique sanitized filenames (`doc-${unique}${ext}`), and `path.basename` deletion guards.
