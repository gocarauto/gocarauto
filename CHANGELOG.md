# Changelog

All notable changes to the GoCar Auto platform are documented in this file.

## [Unreleased] - 2026-11-06

### Fixed (CR-004: MySQL Cross-Dialect Telemetry & UI Streamlining)
- **Resolved "CRITICAL: TELEMETRY LINK OFFLINE" in Production:**
  - Diagnosed MySQL/TiDB database error `ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT` caused by SQLite-specific `date('now', 'start of month')` and `date('now', '+7 days')` function syntax in `reportController.js`, `notificationController.js`, and `vehicleController.js`.
  - Replaced native database date math with cross-dialect JavaScript ISO date boundaries passed safely via parameterized query bindings (`?`), fully harmonizing SQLite local dev with TiDB Cloud production.
  - Upgraded `staff-interface/src/components/Dashboard.jsx` with non-blocking error handling, fallback summary metrics, and an active "Retry Sync" banner, eliminating full-page blackouts.
- **Removed Login Helper Credentials:**
  - Removed demo credential text block from `staff-interface/src/components/Login.jsx`.
- **Removed 3-Option Staff Direction Switcher:**
  - Removed floating `<DirectionSwitcher />` from `staff-interface/src/components/Layout.jsx`, fixing the staff UI to a unified, distraction-free command deck.
- **Formal Change Log:**
  - Registered formal change record in `docs/changes/CR-004.md`.

### Fixed (CR-003: Staff Portal Cross-Origin Authentication & Error Feedback)
- **Cross-Origin Cookie & Token Resilience:**
  - Configured `controllers/authController.js` to emit `SameSite=None` + `Secure=true` cookies in production environments, unblocking cross-site communication from Cloudflare Pages (`gocar-staff.pages.dev`) to Render (`gocar-backend-crtx.onrender.com`).
  - Added `Authorization: Bearer ${token}` request interceptor to `staff-interface/src/utils/api.js` backed by `localStorage` persistence in `staff-interface/src/context/AuthContext.jsx`.
- **Staff Flexible Identifier Resolution:**
  - Enhanced `staffLogin` in `controllers/authController.js` to accept `email`, `username`, or `identifier` (`LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?) OR email LIKE ?`), seamlessly matching `admin` or `admin@gocar.com`.
- **Resilient UI & Cold-Start Visibility:**
  - Changed `staff-interface/src/components/Login.jsx` input to `type="text"` to prevent silent HTML5 email validation blocks on username logins.
  - Implemented high-visibility error banners for network timeouts, cold-starts, and invalid credentials, preventing silent redirect loops on 401s.
  - Added automatic cloud wake-up notification if the backend takes longer than 2.5 seconds to respond.
- **Formal Change Log:**
  - Registered formal change record in `docs/changes/CR-003.md`.

### Governance & Verification Reconciliations (Scribe)
- **Phase 2 Specification Deliverable (`docs/02-requirements.md`):**
  - Codified formal Product Requirements Document (PRD) detailing user personas (`Admin`, `Operator`, `Customer`), functional requirements (FR-1 through FR-7), non-functional requirements (NFR-1 through NFR-4), acceptance criteria, and out-of-scope boundaries.
- **Phase 7 Verification Deliverable (`docs/07-verification.md`):**
  - Documented formal QA verification report covering all 7 automated test suites (34 passing tests, 0 failures), security regression validation (`GOCAR-SEC-01` to `GOCAR-SEC-10`, IDOR defenses, query token guards), performance budget metrics, and end-to-end acceptance walkthroughs.
- **ValdoZ Phase Integrity:**
  - Validated and reconciled Phase 2 (Requirements) and Phase 7 (Verify) gate checks, passing all automated gate criteria with composite hashes synced into `.valdoz/state.json`. All Phases 0 through 9 are marked `approved` and `VALID`.

## [1.0.0] - 2026-11-05

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
