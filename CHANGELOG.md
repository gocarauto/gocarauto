# Changelog

All notable changes to the GoCar Auto platform are documented in this file.

## [Unreleased] - 2026-11-10

### Typography Engine Overhaul & Viewport Ergonomics (CR-009)
- **Elimination of Sub-baseline Micro-Type Scale Across Platform:**
  - Diagnosed root causes of platform-wide legibility issues: micro-scale CSS classes (`text-[9px]`, `text-[10px]`, `text-[11px]`, and unscaled `text-xs`), unbounded full-width desktop viewports on wide monitors (causing visual isolation), and counterform clogging under heavy bold weights.
  - Raised global base desktop typographic scale from `12px–13.5px` to an ergonomic `14.5px–16.5px` standard baseline across all customer and staff views.
  - Overhauled component font scales:
    - **`ServiceHistory.jsx` (Service Logbook):** Page headers elevated to `text-2xl sm:text-3xl font-extrabold`, subtitles to `text-sm font-medium`, KPI stat digits to `text-3xl sm:text-4xl font-extrabold`, table headers to `text-xs sm:text-sm font-bold uppercase`, table rows to `text-sm sm:text-base font-semibold`, invoice amounts to `text-base sm:text-lg font-semibold tabular-nums`, and status badges to `px-3.5 py-1.5 rounded-full text-xs font-bold`.
    - **`InvoiceList.jsx` (Billing & Invoices):** Headers, KPI metrics, table rows, and payment status badges elevated to comfortable 14px–16px ergonomic scale.
    - **`VehicleFleet.jsx` (My Vehicles Fleet):** Metric cards elevated from `text-[9px]/text-[10px]` to `text-xs font-bold uppercase` labels, odometer and service counts elevated to `text-xl sm:text-2xl font-semibold tabular-nums`, and oil/trans life capsules elevated to `text-base sm:text-lg font-bold`.
    - **`Appointments.jsx` (Service Appointments):** Header, appointment cards, date/time chips, and action buttons elevated to `text-sm–text-base`.
    - **`Settings.jsx` (Account & Preferences):** Form field labels elevated to `text-xs sm:text-sm font-bold uppercase`, input fields to `py-3 px-4 text-sm sm:text-base font-medium rounded-2xl`, and display preference buttons to `p-4 rounded-2xl text-sm font-bold`.
    - **`ServiceBooking.jsx` (Booking Wizard):** Step progress bar, vehicle selection tiles, and service package cards upgraded to spacious, readable cards.
- **Arabic Typography Clogging Eradication:**
  - Diagnosed Cairo font's closed counterform defect where inner loops of letters (`م`, `و`, `ف`, `ق`, `ط`) collapse into solid black dots under medium and bold weights.
  - Imported and standardized `IBM Plex Sans Arabic` and `Noto Sans Arabic UI` (`wght@400;500;600;700`) as the primary Arabic typography stack across `customer-portal/index.html` and `staff-interface/index.html`.
  - Configured `--font-arabic` token in `index.css` and set `line-height: 1.65` and `letter-spacing: -0.01em` on `[dir="rtl"]` elements, ensuring Arabic character ascenders, descenders, and dots render with crystal-clear open apertures and zero visual bleeding.
- **Tabular Non-Bold Numeric Precision:**
  - Solved digit clogging and ocular fatigue caused by heavy bold weights (`font-weight: 800/900`) closing the loops of `0`, `6`, `8`, and `9`.
  - Enforced `font-variant-numeric: tabular-nums` globally across all currency sums, odometers, invoice numbers, dates, and metric counters, constrained to clean `font-weight: 500-600` for perfect column alignment and open apertures.
- **Responsive Viewport Enclosure & Framing:**
  - Eliminated "canvas sprawl" on widescreen displays (where left-anchored sidebars and right-anchored tables were separated by feet of empty whitespace) by applying ergonomic containment wrappers (`max-w-7xl mx-auto` for dense data tables and `max-w-5xl mx-auto` for forms and wizards).

### Login Terminal Overhaul & Brand Unification (CR-008)
- **Unified Automotive Obsidian & Studio Aesthetic:**
  - Redesigned both Customer Portal (`customer-portal/src/components/Login.jsx`) and Staff Operations Portal (`staff-interface/src/components/Login.jsx`) with identical high-tech CAD blueprint grid background, warm amber showroom spotlights, and subtle wireframe watermark.
  - Implemented sleek obsidian frosted terminal glass card (`rounded-[2.5rem]`, luxury thin border, top amber accent strip).
- **Consolidated Role Switcher:**
  - Added segmented portal switcher tabs (`[ 👤 Customer ]` | `[ 🛠️ Staff Portal ]`) to seamlessly switch between the customer and staff login interfaces across both local dev (`localhost:5174` / `localhost:5173`) and cloud production URLs (`gocarauto.vercel.app` / `gocarauto-3kpg.vercel.app`).
- **Gimmick & "VIP" Terminology Removal:**
  - Completely removed "VIP Concierge", "VIP Concierge Access", "Encrypted VIP Session", "SFMS PORTAL", "ELITE STAFF MANAGEMENT", "Establish Connection", and "AUTHENTICATE".
  - Replaced with clean, professional automotive engineering titles: "Welcome to GoCar Auto" / "Customer Fleet & Service Portal", "GoCar Auto Operations" / "Workshop & Fleet Management Terminal", and standard "Sign In" / "Sign In to Operations".
- **Staff Portal Logo Contrast Remediation:**
  - Identified root cause of washed-out staff logo: `staff-interface/public/logo.png` had been replaced with an all-white inverted version (`RGB ~ 244, 233, 230`), rendering it invisible on white/light cards.
  - Replaced with the crisp, full-color original logo (`customer-portal/public/logo.png`, `RGB ~ 39, 43, 60` dark-navy icon with vibrant orange typography), housed inside a subtle high-contrast badge with drop shadow.
- **Form Enhancements & Browser Autofill Fix:**
  - Injected CSS rules into `customer-portal/src/index.css` and `staff-interface/src/index.css` using `-webkit-box-shadow: 0 0 0 1000px inset` to eliminate Chrome/Safari pale yellow autofill background artifacts.
  - Added interactive password visibility toggle (`Eye` / `EyeOff` icons) to both portals.
  - Added theme toggle (Light/Dark mode) in both login screens and bilingual support (عربي / English) with RTL support in the customer portal.


### Performance Overhaul & Data Retrieval Optimization (CR-007)
- **Backend N+1 Query Elimination in `vehicleController.getAllVehicles`:**
  - Replaced sequential per-vehicle `database.get()` query loop with a single grouped subquery aggregate (`open_sr`) joined to `vehicles`.
  - Computes vehicle `health_score` and mileage intervals in-memory with **0 extra database round trips**, eliminating 2–4 seconds of sequential cloud latency on every vehicle fetch.
- **Cross-Database Compatibility in Customer Portal (`customerPortalController.getDashboard`):**
  - Replaced Postgres/SQLite-only `ORDER BY next_service_due ASC NULLS LAST` with standard portable SQL (`ORDER BY CASE WHEN next_service_due IS NULL THEN 1 ELSE 0 END, next_service_due ASC, id DESC LIMIT 3`), preventing MySQL/TiDB Cloud syntax errors and query retries.
- **Production MySQL Connection Pool Optimization (`database/db.js`):**
  - Configured `enableKeepAlive: true`, `keepAliveInitialDelay: 10000`, `maxIdle: 10`, and `idleTimeout: 60000` on the MySQL2 connection pool to maintain warm connections and eliminate repetitive TLS 1.2 handshakes across WAN.
- **Production Schema Parity (`database/schema.mysql.sql`):**
  - Added the `service_history` SQL view definition using MySQL-compatible `CONCAT` syntax, ensuring customer service history queries execute cleanly.
- **In-Memory Request Caching & In-Flight Request Deduplication (`staff-interface` & `customer-portal`):**
  - Added a smart, zero-dependency in-memory cache layer in both `staff-interface/src/utils/api.js` and `customer-portal/src/utils/api.js`.
  - GET requests are cached for a 30-second fresh window, making navigation between previously visited tabs **instantaneous (0ms perceived latency)** without blank loading screens.
  - Concurrent duplicate in-flight requests are automatically coalesced into a single network call.
  - Automatically invalidates the cache immediately on any mutating HTTP method (`POST`, `PUT`, `DELETE`, `PATCH`) to guarantee real-time data freshness.
- **Reminders Over-fetching Remediation (`ServiceRemindersModule.jsx`):**
  - Removed unconditional loading of the entire `/api/clients` database table on initial component mount. The client registry is now lazily fetched only when the user opens the "New Reminder" modal.
- **Customer Portal Route Code-Splitting (`customer-portal/src/App.jsx`):**
  - Converted all 10 customer portal route components to dynamic `React.lazy()` imports with a centered `<Suspense>` loading indicator.
  - Eliminated the monolithic 584 kB JS bundle warning; routes are now loaded as nimble on-demand chunks.

### Added & Enhanced (Staff Portal Visual Theme Parity & Light/Dark Mode Unification)
- **Deep WCAG AA Text Contrast Remediation Across All Views:**
  - Systematically audited and remediated all 18 views and sub-pages in `staff-interface/` to eliminate hardcoded low-contrast dark tokens, ensuring 100% theme parity with `customer-portal`:
    - **`CustomerForm.jsx` & `CustomerDossier.jsx`:** All step indicators, section headers, form labels, profile details, and magic link cards upgraded to high-contrast `text-slate-900 dark:text-white` and `text-slate-700 dark:text-slate-300` on crisp white cards.
    - **`VehicleForm.jsx` & `VehicleList.jsx`:** Asset intake forms, client dropdowns, telemetry chips, and vehicle list tables updated with high-contrast text and border treatments.
    - **`ServiceRequestForm.jsx` & `ServiceRequestDetail.jsx`:** 3-step intake wizard, operations ledger table, add item form, bulk WhatsApp import parser & staging rows, internal notes & timeline, protocol logs sidebar, invoice modal, and reminder modal remediated for crisp readability in light mode.
    - **`FinancialList.jsx` & `ReportsDashboard.jsx`:** Payment tables, ledger line items, KPI metric cards, operational economics breakdown, charts container, and referral leaderboard table upgraded with high-contrast slate text and labels.
    - **`ConsignmentHub.jsx`:** Header, pipeline KPI ribbon, tabs, search/filters, inbound lead cards, active consignment cards, settle deal modal, and create consignment listing modal re-themed with dual light/dark tokens.
    - **`CredentialManager.jsx` & `ReminderManager.jsx`:** Staff IAM cards, password reset modals, active reminder cards, and inline date editors remediated.
    - **`ServiceRemindersModule.jsx`:** Stats breakdown cards, sub-filter chips, active table, sent history ledger, prospect vehicle rows, New Reminder modal, WhatsApp template preview bubble modal, and bulk queue modal upgraded with WCAG AA compliant slate text.
    - **`Login.jsx` & `ErrorBoundary.jsx`:** Full dual light/dark mode support with top-right theme toggle and high-contrast inputs and error screens.
    - **`index.css` Global Safeguards:** Added systemic CSS safeguards enforcing minimum `#475569` (7.0:1 contrast) for secondary text and `#334155` font-weight 800 for table headers in light mode.
- **Unified Theme Architecture & ThemeProvider (`ThemeContext.jsx`):**
  - Added dedicated `ThemeProvider` in `staff-interface/src/context/ThemeContext.jsx` matching the Customer Portal design engine.
  - Persists preference in `localStorage.getItem('theme')` and synchronizes the `.dark` class directly onto `document.documentElement` for instantaneous transitions without page reloads.
- **Top Header & Bottom Operations Theme Controls (`Layout.jsx`):**
  - Integrated Sun/Moon toggle button in the master console top header alongside search and alert actions.
  - Styled sidebar, top navigation, brand capsule, and mobile bottom navigation with dual-mode CSS tokens: crisp alabaster light theme (`bg-white dark:bg-[#0c0d12] border-slate-200/80 dark:border-white/[0.08]`) and obsidian dark theme.
- **High-Contrast Component Styling (`Dashboard.jsx`, `CustomerList.jsx`, `VehicleList.jsx`, `ServiceRequestList.jsx`, `FinancialList.jsx`, `ReportsDashboard.jsx`):**
  - Upgraded metric cards, quick action bars, consignment alert trays, data tables, and modal dialogues to render with high-contrast text (`text-slate-900 dark:text-white`), subtle light backgrounds (`bg-slate-50 dark:bg-black/40`), and WCAG-compliant status badges.
- **Architectural Decision:**
  - Recorded architectural decision **DEC-007** in `.valdoz/decisions.jsonl` and `.valdoz/decisions.md`.

### Added & Enhanced (CR-006: Comprehensive Application Responsiveness & Mobile/Tablet Adaptation)
- **Persistent Mobile Bottom Navigation Bars:**
  - Added fixed bottom navigation bar in `customer-portal/src/components/Layout.jsx` for viewports `< 1024px` with quick touch access to Dashboard, Fleet, Center Booking CTA, History, and Drawer.
  - Added fixed bottom operations navigation in `staff-interface/src/components/Layout.jsx` for viewports `< 1024px` with quick touch access to Operations Deck, Work Orders, Center Intake CTA, Fleet, and Clients.
  - Added `pb-24 lg:pb-8` safe-area bottom inset padding across all main content streams preventing bottom navigation occlusions.
- **Header Elasticity & Expandable Mobile Search:**
  - Added smooth animated expandable search input in both Customer Portal and Staff Interface headers on `< md` viewports.
  - Sized touch buttons to $\ge 44\times 44\text{px}$ touch targets.
- **Adaptive Data Views (Table-to-Card Transformations):**
  - Upgraded `customer-portal/src/components/ServiceHistory.jsx` and `customer-portal/src/components/InvoiceList.jsx` to render mobile cards on `< md` and master tables on `md+`.
  - Upgraded `staff-interface/src/components/ServiceRequestList.jsx`, `VehicleList.jsx`, and `CustomerList.jsx` to render high-contrast operational cards on `< md` and master tables on `md+`.
- **Vehicle Cockpit Stage Responsiveness (`Dashboard.jsx`):**
  - Scaled hero stage on `< md` to `h-[360px] sm:h-[440px] md:h-[530px]` and moved the 3 HUD telemetry capsules into a dedicated mobile vitals tray directly underneath the car stage, eliminating layout overlapping.
- **Modals to Mobile Bottom Sheets:**
  - Adapted `customer-portal/src/components/SellCarModal.jsx` into a thumb-friendly bottom sheet on small viewports with `rounded-t-3xl` and `max-h-[92vh]`.
- **Architectural Decision:**
  - Recorded architectural decision **DEC-006** in `.valdoz/decisions.jsonl` and `.valdoz/decisions.md`.

## [Unreleased] - 2026-11-09

### Added & Revamped (Customer Portal Dashboard Cinematic Overhaul)
- **Implemented Garage Fleet Cinematic Hero Stage (`customer-portal/src/components/Dashboard.jsx`):**
  - Revamped the vehicle stage into a wide-angle obsidian arena (`bg-[#0a0c14] border border-slate-800/80 rounded-3xl`) with ambient radial glow and responsive vehicle blueprint visualizer.
  - **Enlarged Vehicle Blueprint Presence:** Scaled up the vehicle sketch by ~25% (`max-h-[380px] w-auto max-w-[78%]`) with right-anchored positioning, giving the car visual commanding presence while maintaining perfect balance with the telemetry clusters.
  - **Dynamic Adaptive Stage Height:** Stage dynamically expands to `h-[570px]` when no service tickets are active to consume the vertical space underneath, contracting to `h-[510px]` when a live appointment card is present.
  - **Elevated Contrast Telemetry Gauges:**
    - *Engine Oil Life:* Left telemetry capsule housed in high-contrast frosted slate glass (`bg-slate-900/95 border border-slate-700/70`), featuring fluid droplet icon, bold percentage, fluid gauge bar, and mileage countdown.
    - *Telemetry & Activity:* Upper-right frosted glass card (`bg-slate-900/95 border border-slate-700/70`) with side-by-side two-column split for odometer mileage and services logged.
    - *Transmission Oil Life:* Lower-right telemetry capsule housed in high-contrast frosted slate glass (`bg-slate-900/95 border border-slate-700/70`), featuring gearbox icon, bold percentage, fluid gauge bar, and verified schedule notice.
  - **High-Contrast Telemetry Capsules Restored & Floating Ghost Nodes Removed:**
    - Fully preserved and restored the user's favored high-contrast rectangular telemetry capsules (`Engine Oil Life`, `Telemetry & Activity`, `Transmission Oil Life`) with fluid droplet & gearbox icons, bold percentage metrics, and calibrated laser leader lines.
    - Permanently removed all extraneous Floating Ghost Pulse Nodes (Battery & Tire pulse pins) from the vehicle body, keeping the blueprint clean and focused on genuine diagnostic leader line targets.
    - Resolved CSS intrinsic image dimension capping: replaced passive `max-h-[...]` with active `h-[390px] sm:h-[470px] lg:h-[500px]` and `w-auto`, allowing the `617x421` sketch to actively scale up by ~25% and fill the hero stage gracefully.
    - Scaled tire underglow halo to `w-[720px] sm:w-[780px]` matching the enlarged vehicle footprint.
  - **Unified Segmented Action Dock & Active Vehicle Typography Refinement:**
    - Adjusted font sizes by +1px for the Active Vehicle identity block: `Active Vehicle` badge (`11px` $\rightarrow$ `12px`), vehicle title (`24px/30px` $\rightarrow$ `25px/31px`), and metadata subtitle (`12px` $\rightarrow$ `13px`).
    - Adjusted font sizes by +1px for the bottom dock buttons (`Booking`, `Sell Car`, `Car Documents`) to `13px` with matching `16px` icon sizing and `h-4.5` vertical hairline dividers for optimal optical balance.
    - Unified dark glass container (`bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl`) featuring vertical hairline dividers between `[ 📅 Booking ]` (amber pill), `[ 🏷️ Sell Car ]`, and `[ 📁 Car Documents ]`.
- **Smart Dynamic Tracker (Zone 5):**
  - Transformed the lower deck service status into a smart contextual tracker: dynamically renders live bay status and link to appointment details when a service ticket is open or scheduled; completely collapses to zero height when no active appointments are pending.
- **Overhauled 'My Vehicles' Fleet Showcase (`customer-portal/src/components/VehicleFleet.jsx`):**
  - Fully transformed the fleet view to match the executive two-column split layout (`media_1794259432403_c91b4c5b.jpg`):
    - *Left Column (Visual Hero Showcase Pod):* Immersive dark obsidian stage (`bg-gradient-to-b from-[#181a24] to-[#08090d] border border-slate-800`) with ambient radial floor underglow, top-left vehicle title overlay (`Ford Focus 2012`), central vehicle blueprint visualizer, and floating frosted glass license plate pill (`[ No Plate ]`).
    - *Right Column (Telemetry & Command Deck):* Prominent vehicle heading paired with dynamic emerald `Active Vehicle` badge (or 1-click `Set as Active` toggle synchronized with the main Dashboard).
    - *2x2 Telemetry Matrix:* Odometer (`97,300 km`), Next Due Date (`3 Nov 2026`), Service Visits (`14 Visits`), and dual health capsules for Engine Oil Life (`100%`) & Transmission Oil Life (`92%`) with live progress bars.
    - *Two-Tier Actions:* Full-width gold amber `[ 📅 Book VIP Service ]` hero action button, complemented by a segmented 3-button secondary bar (`[ 🏷️ Sell Car ]`, `[ 🛡️ Passport ]`, and obsidian `[ 📋 Logbook ]` deep-linking to filtered vehicle history).
  - Updated dashboard subtitle to *"Quick overview of your car's health and service history"* (Arabic: *"نظرة سريعة وشاملة على حالة سيارتك وسجل الصيانة"*).
  - Renamed "Digital Glovebox" to "Car Documents" across both English and Arabic translations.
  - Removed AI Advisor from the primary navigation rail to maintain 1:1 parity with the simplified quick dock.
  - Removed floating `<DirectionSwitcher />` (design direction eye button) from Customer Portal layout, ensuring an unencumbered and clean viewport.

### Audited & Remediated (Customer Portal UX/UI Heuristics Audit)
- **Completed Usability & UX Design Audit (`mistyhx/frontend-design-audit`):**
  - Conducted an in-depth audit of the Customer Portal across 15 core heuristics and design principles (System Status, Mental Models, User Freedom, Consistency, Error Prevention, Accessibility, Hierarchy, and Tolerance).
  - Published comprehensive findings and code references in artifact report `frontend_design_audit_customer_portal.md` with an overall score of 82/100 (B+).
- **Implemented Prioritized Remediations:**
  - **[P0] User Control & Freedom (Dialog Entrapment in `SellCarModal.jsx` & `Glovebox.jsx`):**
    - Added global `Escape` key event listeners and click-outside backdrop dismissal to `SellCarModal.jsx` and all modal dialogs in `Glovebox.jsx`.
  - **[P1] WCAG Accessibility Focus Indicators (`customer-portal/src/index.css`):**
    - Enforced universal `:focus-visible { outline: 2px solid #fbbf24; outline-offset: 2px; }` across all interactive elements, tabs, links, and form fields to satisfy WCAG 2.4.7 Focus Visible.
  - **[P2] Error Prevention & Non-Blocking Modals (`customer-portal/src/components/Glovebox.jsx`):**
    - Replaced the blocking native browser `window.confirm()` with a custom in-app animated confirmation modal (`docToDelete`), providing clear document details, irreversible warning, and keyboard/backdrop cancellation.
  - **[P1] Semantic Form Labeling (`customer-portal/src/components/ServiceBooking.jsx` & `Glovebox.jsx`):**
    - Bound explicit `<label htmlFor="...">` attributes to inputs in `ServiceBooking.jsx` (date picker and diagnostic notes) and `Glovebox.jsx` (document title and category select), improving screen reader accessibility and touch target hit area.

### Fixed & Hardened (Customer Portal Navigation, SWR Caching & API Routing)
- **Resolved Critical API 404s in Customer Dashboard:**
  - Fixed endpoint paths in `customer-portal/src/components/Dashboard.jsx` lines 81-86: updated `api.get('/customer/...')` calls to `api.get('/customer-portal/...')` (`/dashboard`, `/vehicles`, `/appointments`, `/reminders`), restoring live dashboard metrics, active fleet stats, and upcoming service data.
  - Added `router.use('/customer', customerPortalRoutes);` in `routes/index.js` as an API alias to prevent future routing drift.
- **Fixed Reminder Vehicle ID Linkage in Database Controller:**
  - Added `r.vehicle_id` and `sr.vehicle_id` to SELECT queries in `controllers/customerPortalController.js` (`getReminders` and `getAppointments`), preventing `vehicleId=undefined` query parameter generation when clicking "Book Bay" from dashboard reminders.
- **Eliminated Page Flash Across Customer Portal:**
  - Implemented Stale-While-Revalidate (SWR) `sessionStorage` caching (`gocar_glovebox_cache`, `gocar_fleet_cache`) across `customer-portal/src/components/Glovebox.jsx` and `customer-portal/src/components/ServiceBooking.jsx`.
  - Replaced blocking full-page skeleton replacements with permanent header rendering and local content skeleton fallbacks, ensuring instant page transitions without visual flicker.
- **Connected AI Service Advisor to Booking Workflow:**
  - Updated `customer-portal/src/components/AIAdvisor.jsx` to pass technical diagnosis recommendations directly into `ServiceBooking.jsx` via `?notes=${encodeURIComponent(msg.recommendation)}`.
  - Enhanced `ServiceBooking.jsx` to parse and pre-populate notes and support custom service package titles gracefully.
- **Added Sketch Mapping:**
  - Added `'honda-civic-2018'` to `availableSketches` in `customer-portal/src/utils/sketchHelper.js`.
- **Restored Staff Sidebar Layout:**
  - Fixed CSS specificity clash in `staff-interface/src/components/Layout.jsx` where `.ltr:-translate-x-full` overrode `.lg:translate-x-0` on desktop, ensuring the staff navigation bar is always visible.

## [Unreleased] - 2026-11-08

### Added & Enhanced (CR-006: Brand Clarity, Typography Readability & Garage Fleet Cockpit Revamp)
### Reverted & Restored (Customer Portal Garage Fleet Stage)
### Fixed & Hardened (Vehicle Sketch Helper & Dashboard Render)
- **Resolved TypeError in `getVehicleSketch` Invocation:**
  - Hardened `getVehicleSketch` across both `customer-portal` and `staff-interface` to accept either an object (`{ make, model, year }`) or separate primitive parameters without throwing `TypeError: make.toLowerCase is not a function`.
  - Updated `customer-portal/src/components/Dashboard.jsx` to pass `activeVehicle.make, activeVehicle.model, activeVehicle.year` cleanly, eliminating the ErrorBoundary crash on initial dashboard render.
- **Reverted Garage Fleet Card to Original Verified Cockpit Vehicle Stage:**
  - Per user direction, completely reverted the Garage Fleet experimental card changes back to the original verified Cockpit Vehicle Stage in `customer-portal/src/components/Dashboard.jsx`.
  - Restored the two-column Cockpit layout:
    - Left column (`lg:col-span-7`): Active vehicle selector pills, metadata title, verified telemetry indicator dials (`Oil Life` & `Brake Health`), odometer strip, and 4 quick actions (`Book Service`, `Consign Vehicle`, `Digital Glovebox`, `AI Advisor`).
    - Right column (`lg:col-span-5`): Dynamic blueprint visualizer powered by `getVehicleSketch(activeVehicle)` with smooth `motion.div` transitions.
  - Safely removed experimental HUD files (`GarageFleet.jsx`, `SpotlightCard.jsx`, `Particles.jsx`, `ShinyText.jsx`) and restored clean stylesheet rules.
- **Integration of React-Bits Components (`DavidHDev/react-bits`):**
  - **`SpotlightCard` Component:** Extracted directly from React Bits to power the Aero Telemetry Capsules (`customer-portal/src/components/common/SpotlightCard.jsx`). Uses hardware-accelerated CSS variables (`--mouse-x`, `--mouse-y`, `--spotlight-color`) for smooth, re-render-free pointer tracking with customized neon color glow for each telemetry gauge.
  - **`Particles` Component:** Added lightweight HTML5 Canvas ambient particle dust (`customer-portal/src/components/common/Particles.jsx`) behind the vehicle hero in the `#0b111e` bay, giving the diagnostic arena atmospheric depth and motion without UI clutter.
  - **`ShinyText` Component:** Integrated metallic sheen typography animation (`customer-portal/src/components/common/ShinyText.jsx`) for vehicle titles and telemetry headers, configured with `@keyframes shine`.
- **Aero Telemetry Capsules & Zero-Filter Reliable SVG Vector Lines:**
  - Redesigned telemetry badges into sleek, frosted-glass aero capsules (`bg-slate-900/70 backdrop-blur-md border border-.../30 px-4 py-2.5 rounded-2xl shadow-lg`) with integrated neon radial progress micro-meters and telemetry icons (`Wrench`, `Activity`, `Zap`, `Disc`).
  - Replaced brittle SVG `<filter id="hud-glow">` definitions with reliable native CSS `style={{ filter: drop-shadow(...) }}` and standard `strokeDasharray="4 4"`, eliminating hidden or dropped vector lines.
  - Locked 3-point hood perspective arc and tire targets:
    - **Engine Oil** (`#22c55e`): Starts at left capsule port $(280, 185) \rightarrow$ Center Hood Crest $(475, 235)$.
    - **Transmission Oil** (`#06b6d4`): Starts at left capsule port $(280, 325) \rightarrow$ Front Hood / Grille Area $(440, 260)$.
    - **Battery Health** (`#f59e0b`): Starts at right capsule port $(720, 185) \rightarrow$ Rear Cowl / Hood $(535, 215)$.
    - **Tyre Age & Tread** (`#3b82f6`): Starts at right capsule port $(720, 325) \rightarrow$ Front Tyre Hub $(575, 380)$.
  - Staged layer stacking: vehicle hero at `z-10`, SVG leader vector mesh at `z-20`, and interactive telemetry capsules at `z-30`.
- **Minimalist Telemetry Typography & 3D Perspective Hood Arc:**
  - Transitioned from card boxes to borderless minimalist typography with large glowing percentages (`text-3xl font-extrabold tracking-tight` with matching drop-shadow luminescence).
  - Aligned the 3 hood anchor points along the vehicle's 3D perspective plane in a natural ascending arc without intersection:
    - **Transmission Oil** (`#06b6d4`): Front-left of the hood $(440, 260)$ from Left Lower $(290, 335)$.
    - **Engine Oil Life** (`#22c55e`): Center-crest of the hood $(485, 235)$ from Left Upper $(290, 205)$.
    - **Battery Health** (`#f59e0b`): Rear-right of the hood near the cowl $(535, 215)$ from Right Upper $(710, 205)$.
    - **Tyre Age & Tread** (`#3b82f6`): Front wheel hub $(570, 380)$ from Right Lower $(710, 335)$.
  - SVG leader line origins are aligned directly to metric edges ($X=290$ and $X=710$), locking lines to text across responsive viewports.
- **Garage Fleet Stage Height Restoration & Vertical Staggering:**
  - Restored full container height to `h-[540px]` and synchronized SVG canvas to `viewBox="0 0 1000 540"` with vehicle hero scale at `h-[82%]`, eliminating horizontal letterboxing and bottom crowding.
  - Vertically distributed telemetry cards across upper and lower tiers (`top-[145px]` with `gap-10`) on both left and right rails (`w-[24%]`), eliminating corner bottom-clumping:
    - **Engine Oil** (`#22c55e`): Left Upper $(270, 185) \rightarrow$ Center Hood $(470, 240)$.
    - **Transmission Oil** (`#06b6d4`): Left Lower $(270, 310) \rightarrow$ Front Hood / Grille $(435, 260)$.
    - **Battery Health** (`#f59e0b`): Right Upper $(730, 185) \rightarrow$ Right Top Cowl / Hood $(535, 230)$ via a short, direct curve that completely avoids cabin or door lines.
    - **Tyre Age & Tread** (`#3b82f6`): Right Lower $(730, 310) \rightarrow$ Front Tyre Wheel Hub $(570, 380)$.
- **Garage Fleet HUD Percentage-Locked Rail & Vector Synchronisation:**
  - Synchronized HTML telemetry rails (`left-[3%] bottom-[12%] w-[24%]` and `right-[3%] bottom-[12%] w-[24%]`) with the SVG coordinate space (`viewBox="0 0 1000 500"`), permanently eliminating responsive gaps on wide displays.
  - Eliminated cabin-crossing leader lines:
    - **Engine Oil** (`#22c55e`): Starts at left rail boundary $X=270$ (`M 270 330 C 350 330, 400 235, 465 235`) to Top of Hood at `(465, 235)`.
    - **Transmission Oil** (`#06b6d4`): Starts at left rail boundary $X=270$ (`M 270 410 C 340 410, 380 245, 430 245`) to Top of Hood at `(430, 245)`.
    - **Battery Health** (`#f59e0b`): Starts at right rail boundary $X=730$ (`M 730 330 C 650 330, 600 230, 535 230`), curving high over the front fender directly into the battery/cowl zone without slicing through doors or windows.
    - **Tyre Age & Tread** (`#3b82f6`): Starts at right rail boundary $X=730$ (`M 730 410 C 660 410, 610 370, 550 370`), connecting directly to the foreground front wheel assembly.
  - Gauge cards support interactive hover effects, live percentage rendering, and direct routing to `/book-service`.
- **Authentic Brand Logo Restoration & High-DPI Display:**
  - Reverted synthetic monogram SVG to restore GoCar Auto's authentic brand asset (`/logo.png`) with clean container contrast and proper aspect ratios across both portals.
  - Added clean portal classification text (`CUSTOMER PORTAL` / `Staff Operations Portal`) alongside the authentic logo.
- **Typography, Word Spacing & Text Scale Overhaul:**
  - Standardized font matrix with Google Font `Inter` paired with `Plus Jakarta Sans` and `Cairo`.
  - Scaled base root `html` to 16px and body text to `15px` (`0.9375rem`), with line height 1.6 and dedicated `word-spacing: 0.04em` across both portals to eliminate text cramp and eye strain.
  - Elevated micro-typography from cramped sizes to readable `text-xs` (12px) and `text-sm` (14px).
- **Customer Portal Garage Fleet HUD Module (`GarageFleet.jsx` Modularization):**
  - Fully refactored and extracted the garage fleet experience into a dedicated, self-contained component (`customer-portal/src/components/GarageFleet.jsx`).
  - Zero Text Collision Guarantee: Placed the Active Vehicle title hierarchy and the left gauge metrics into a single `flex flex-col justify-between` column container, structurally preventing pixel coordinate collision.
  - Universal SVG Visibility: Removed `hidden lg:block` restrictions from the SVG layer (`absolute inset-0 w-full h-full pointer-events-none z-10 block`), ensuring vector leader lines render seamlessly across all preview viewports and screen sizes.
  - Telemetry Alignment & Battery Health: Replaced Brake Health badge with `BATTERY HEALTH` (100%, 12.6 V • Optimal charge verified, amber `#f59e0b`).
  - Precision Calibrated SVG Dotted Leader Lines:
    - Engine Oil: `M 290 280 C 370 280, 410 230, 480 230` to Top of Hood at `(480, 230)` (`#22c55e`).
    - Transmission Oil: `M 290 350 C 360 350, 400 245, 455 245` to Top of Hood beside engine oil at `(455, 245)` (`#06b6d4`).
    - Battery Health: `M 830 280 C 720 280, 620 225, 530 225` to Right Top Area of Hood at `(530, 225)` (`#f59e0b`).
    - Tyre Age & Tread: `M 830 350 C 740 350, 660 360, 595 360` directly to Front Tyre at `(595, 360)` (`#3b82f6`).
  - Interactive Click-to-Book Contract: Hovering any gauge badge triggers glowing target highlights, and clicking navigates directly to `/book-service?vehicleId=${id}&serviceType=${type}`.
- **Staff Portal Theme Harmonization:**
  - Synchronized staff interface with the customer portal's luxury amber color scheme (`bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20` active navigation pill, harmonized dark slate backgrounds).
- **Front-End Checklist Hardening:**
  - Added React `ErrorBoundary` wrappers to both applications to contain unexpected exceptions.
  - Added WCAG 2.4.1 Skip-to-content bypass links and `id="main-content"` landmarks on both layouts.
  - Added `<meta name="description">`, `<meta name="theme-color">`, and `@media print` styles for clean invoice/passport physical and PDF printing.


### Fixed & Enhanced (Staff Interface Sidebar Restoration)
- **Restored Staff Sidebar Layout:**
  - Resolved missing sidebar in `staff-interface/src/components/Layout.jsx` caused by CSS specificity precedence conflict where `.ltr\:-translate-x-full` overrode `.lg\:translate-x-0` on desktop viewports.
  - Restored explicit `left-0` and standard responsive utility `lg:pl-[280px]`, ensuring the sidebar is permanently pinned on desktop with correct content offset.

### Fixed & Enhanced (Customer Portal Smooth Navigation & Booking Blank Fix)
- **Eliminated Page Navigation Flashing & Layout Shift:**
  - Consolidated route imports in `customer-portal/src/App.jsx` from lazy dynamic chunks to direct component imports, eliminating root `<Suspense>` unmounts of the entire `<Layout>` shell on route changes.
  - Replaced `AnimatePresence mode="wait"` full-viewport opacity zeroing in `customer-portal/src/components/Layout.jsx` with direct `<Outlet />` rendering for instantaneous, zero-flash page transitions.
  - Implemented client-side stale-while-revalidate session caching across `VehicleFleet.jsx`, `Appointments.jsx`, `Dashboard.jsx`, `ServiceHistory.jsx`, and `InvoiceList.jsx` so cached data renders instantaneously upon tab switching.
  - Restructured headers across `VehicleFleet.jsx`, `Appointments.jsx`, `ServiceHistory.jsx`, and `InvoiceList.jsx` to render permanently and immutably rather than hiding behind early `if (loading)` return branches.
  - Removed delayed opacity-0 staggered animation on vehicle and appointment cards, eliminating post-load visual blinks.
- **Fixed Blank Service Booking View (`ServiceBooking.jsx`):**
  - Resolved `ReferenceError: Plus is not defined` runtime crash on `/book-service` by importing `Plus` from `lucide-react`.

### Fixed & Enhanced (CR-002: Comprehensive Front-End & UI/UX Hardening)
- **API Dynamic Routing & Portability:**
  - Replaced hardcoded `http://localhost:3000` URLs across `staff-interface/src/components/VehicleList.jsx` and `ConsignmentHub.jsx` with dynamic environment-aware `API_BASE` resolution (`import.meta.env.VITE_API_URL` with Render production fallback).
  - Configured Vite development proxy in `customer-portal/vite.config.js` to eliminate `/api` route drops during local execution.
  - Normalized digital vehicle passport links in `customer-portal/src/components/VehicleFleet.jsx` to use dynamic base URL.
- **Invoice & PDF Viewer Pop-up Prevention:**
  - Eliminated browser pop-up blocker triggers in `customer-portal/src/components/InvoiceList.jsx`, `customer-portal/src/components/ServiceHistory.jsx`, and `staff-interface/src/components/FinancialList.jsx` by converting asynchronous `document.write` / post-await `window.open` patterns to direct synchronous window triggers passing URL security tokens.
- **Form Validation & Accessibility (WCAG 2.1):**
  - Added explicit HTML associations (`htmlFor` on `<label>` and matching `id` on inputs, selects, and textareas) across `CustomerForm.jsx`, `VehicleForm.jsx`, `ServiceRequestForm.jsx`, and `Settings.jsx`.
  - Added non-blocking error banners to `ServiceRequestForm.jsx` and `ServiceBooking.jsx`, eliminating silent catch failures and uninformative native alerts.
  - Added empty fleet detection card in `ServiceBooking.jsx`, blocking invalid multi-step progression when zero vehicles exist.
- **Search Reliability & UI Polish:**
  - Introduced 300ms debouncing on real-time text filter queries in `CustomerList.jsx` and `VehicleList.jsx` to prevent asynchronous search response collisions.
  - Synchronized Customer Portal header search bar with `ServiceHistory.jsx` via `useSearchParams`.
  - Gated development `<DirectionSwitcher />` behind `import.meta.env.DEV` in Customer Portal.
  - Corrected Tailwind CSS typo (`backdrop-p-10` → `backdrop-blur-xl p-10`) in staff `Login.jsx` and improved light-mode button contrast in customer `Login.jsx`.
  - Added bidirectional logical spacing (`ltr:lg:pl-[280px] rtl:lg:pr-[280px]`) in staff `Layout.jsx`.
- **Customer Self-Service Security:**
  - Added customer self-service password update capability in `customer-portal/src/components/Settings.jsx`.
  - Implemented `PUT /api/customer-portal/password` endpoint backed by bcrypt verification in `controllers/customerPortalController.js` and `routes/customer-portal.js`.

## [Unreleased] - 2026-11-06

### Changed (DEC-005: Edge Frontend Migration to Vercel & Cloudflare Pages Purge)
- **Vercel Edge Network Migration:**
  - Migrated both customer and staff SPAs to Vercel to bypass regional ISP Anycast routing blocks in Egypt:
    - Customer Portal: `https://gocarauto.vercel.app`
    - Staff Interface: `https://gocarauto-3kpg.vercel.app`
  - Added `customer-portal/vercel.json` and `staff-interface/vercel.json` specifying single-page app rewrite rules (`"source": "/(.*)", "destination": "/"`) for clean client-side routing on page refresh.
  - Purged obsolete Cloudflare `_redirects` files from `customer-portal/public/` and `staff-interface/public/`.
- **Backend CORS & Origin Hardening:**
  - Updated `server.js` CORS policy to whitelist `.vercel.app` origins (`https://gocarauto.vercel.app`, `https://gocarauto-3kpg.vercel.app`) and removed `pages.dev`.
  - Updated API client fallback hosts in `customer-portal/src/utils/api.js` and `staff-interface/src/utils/api.js`.
  - Updated `render.yaml` environment variable documentation for `CORS_ORIGIN` and `CUSTOMER_PORTAL_URL`.
- **Documentation & Runbook Alignment:**
  - Fully updated `docs/08-deploy.md`, `docs/WORKFLOW.md`, `docs/02-requirements.md`, and `.agent/rules/04-environment-workflow.md` to reflect the Vercel architecture and instant rollback steps.
  - Logged architectural decision **DEC-005** in `.valdoz/decisions.jsonl` and `.valdoz/decisions.md`.

### Added (CR-005: Customer Portal Redesign - Complete Overhaul: Slices 1, 2 & 3)
- **Impeccable Design Toolkit Integration:**
  - Audited and installed `pbakaus/impeccable` into `.agent/skills/impeccable/`.
  - Pinned commit `c3bb418` (Apache-2.0) in `.valdoz/repos.yaml` and recorded architectural decision **DEC-004** in `.valdoz/decisions.md`.
  - Configured sandboxed native engine binary for local design quality audits and anti-slop scans.
- **Layout Shell & Navigation Overhaul (`Layout.jsx`):**
  - Re-architected sidebar navigation into a clean, task-oriented cockpit shell adhering to Impeccable Operate-mode standards.
  - Enhanced top bar with contextual title/subtitle hierarchy, `⌘K` search shortcut styling, dark/light toggle, bilingual switcher, and primary booking CTA.
  - Enforced bidirectional alignment (RTL for Arabic, LTR for English) with tailored typographic metrics (`Plus Jakarta Sans` / `Cairo`).
- **Vehicle Cockpit Dashboard (`Dashboard.jsx`):**
  - Rebuilt dashboard around a unified vehicle cockpit with segmented fleet switcher tabs.
  - Re-engineered active vehicle vitals with real odometer telemetry (oil life, brake pad integrity, and blueprint visualizer).
  - Added live 5-stage service pipeline stepper (`Scheduled` → `Inspection` → `In Progress` → `Quality Check` → `Ready for Pickup`).
  - Added actionable maintenance reminders feed with instant booking shortcuts.
- **Service Booking Intake Wizard (`ServiceBooking.jsx`):**
  - Rebuilt into a 3-step structured wizard (Vehicle & Package Selection → Date & Bay Window Reservation → Technical Notes & Confirmation).
  - Streamlined service packages with transparent descriptions and clear active focus indicators.
  - Added clear intake confirmation voucher with direct navigation shortcuts.
- **Appointments Schedule (`Appointments.jsx`):**
  - Restructured into a high-scanability card grid with semantic state badges (`Scheduled`, `In Workshop`, `Pending Review`, `Completed`).
  - Formatted dates and intake arrival times with tabular numerals.
- **Digital Service History & Ledger (`ServiceHistory.jsx`):**
  - Redesigned data table with 1px border hierarchy, sortable column headers, and category quick-filter tabs (All, Oil, Brakes, Tires).
  - Provided instant one-click actions for viewing online invoice statements and downloading PDFs.
  - Added top KPI metrics summary (Total Records, Maintenance Invested, Vehicles Serviced).
- **Garage Fleet & Asset Telemetry (`VehicleFleet.jsx`):**
  - Redesigned vehicle cards with structured metadata grid (Odometer, Next Due, Total Services, VIN).
  - Integrated vehicle technical blueprint sketches with smooth hover interaction.
  - Added inline actions: Logbook, Certified Service Passport PDF download, Sell Car modal trigger, and Book Service CTA.
  - Added instant make filter pills and search filtering.
- **Sell Car / Brokerage Dialog (`SellCarModal.jsx`):**
  - Replaced hardcoded dark modal with adaptive light/dark theme modal.
  - Provided clear input fields for Asking Price (EGP), Mileage, and Inspection Notes.
  - Integrated GoCar brokerage trust badge (2.5% success commission, free certified inspection).
- **Digital Glovebox & Encrypted Vault (`Glovebox.jsx`):**
  - Re-engineered document vault into a clean, modern repository.
  - Added upload modal with drag-and-drop file selector, title, and document category picker (`Registration`, `Insurance`, `Driver ID`, `Inspection Report`, `Other`).
  - Provided accessible action controls on every document card (`View`, `Download`, `Delete`).
- **Service Invoices & Billing (`InvoiceList.jsx`):**
  - Redesigned financial statement table with tabular numerals for EGP amounts.
  - Added top financial summary cards: Total Invoiced, Settled Total, Outstanding Balance.
  - Enhanced status pills (`Paid`, `Partial`, `Outstanding`) and instant View/Download PDF actions.
- **Account Settings & Preferences (`Settings.jsx`):**
  - Eliminated pseudo-technical AI slop ("Identity Core", "Contact Manifold", "Comms Vector", "Lumos/Aether").
  - Replaced with clean product language: Personal Information, Email, Mobile, Theme Mode, Display Language.
  - Ensured safe multi-field synchronization for phone numbers without data loss.
- **Design Hygiene & Anti-Slop Fixes:**
  - Replaced dated `animate-bounce` in `AIAdvisor.jsx` with exponential easing (`animate-pulse`).
  - Added browser surface styling (themed `::selection`, custom caret, tabular numerals) in `customer-portal/src/index.css`.
  - Achieved a clean bill of health on `impeccable detect` with 0 anti-patterns and 0 advisories across all 23 components.
- **Formal Change Log:**
  - Registered formal change record in `docs/changes/CR-005.md`.

### Fixed (CR-004: MySQL Cross-Dialect Telemetry & UI Streamlining)
- **Resolved "CRITICAL: TELEMETRY LINK OFFLINE" in Production:**
  - Diagnosed MySQL/TiDB database error `ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT` caused by SQLite-specific `date('now', 'start of month')` and `date('now', '+7 days')` function syntax in `reportController.js`, `notificationController.js`, and `vehicleController.js`.
  - Replaced native database date math with cross-dialect JavaScript ISO date boundaries passed safely via parameterized query bindings (`?`), fully harmonizing SQLite local dev with TiDB Cloud production.
  - Upgraded `staff-interface/src/components/Dashboard.jsx` with non-blocking error handling, fallback summary metrics, and an active "Retry Sync" banner, eliminating full-page blackouts.
- **Resolved Local Blank Screen on Staff Login:**
  - Eliminated lingering `isDir2` and `isDir3` references in `staff-interface/src/components/Layout.jsx` that triggered uncaught `ReferenceError` during initial render in development mode.
  - Unlocked `AuthContext.jsx` route rendering to always deliver `{children}` seamlessly.
- **Enforced Unified ValdoZ Verification Script:**
  - Added `npm run verify` to root `package.json` chaining backend test suite, staff ESLint, customer ESLint, and both production Vite builds into a single non-bypassable pre-completion gate.
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
