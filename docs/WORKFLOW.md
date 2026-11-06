# GoCar Auto - Engineering Workflow & Release Policy

> **Standard Operating Procedure (SOP)**  
> **Governance:** ValdoZ Protocol v3.0  
> **Status:** Active & Mandatory

---

## 1. Operational Overview

The GoCar Auto engineering lifecycle is structured into three discrete stages:

```
[ Local Development & Test ]  ──▶  [ GitHub Versioning & CI ]  ──▶  [ Production Live Cloud ]
      (Antigravity IDE)               (github.com/gocarauto)          (Edge CDN & Render API)
```

No code, schema alteration, or environment configuration may jump directly to GitHub or Production without passing the preceding verification gates.

---

## 2. Stage-by-Stage Protocols

### Stage 1: Local Development & Verification (Localhost)
- **Role:** Active development, prototyping, refactoring, and local debugging.
- **Components:**
  - Backend API: `http://localhost:3000` (`node server.js` or `npm run dev`)
  - Staff Interface: `http://localhost:5173` (`npm --prefix staff-interface run dev`)
  - Customer Portal: `http://localhost:5174` (`npm --prefix customer-portal run dev`)
  - Local Database: `database/gocar_auto.db` (SQLite for rapid zero-latency development)
- **Pre-Commit Verification Checklist (Mandatory Gate):**
  1. `npm test` -> All unit and integration test suites pass (0 failures).
  2. `npm --prefix customer-portal run lint` -> 0 ESLint errors.
  3. `npm --prefix staff-interface run lint` -> 0 ESLint errors.
  4. `npm --prefix customer-portal run build` -> Clean Vite production build.
  5. `npm --prefix staff-interface run build` -> Clean Vite production build.
  6. `valdoz audit` -> 0 hardcoded secrets, 0 unpinned dependencies.

### Stage 2: GitHub Versioning & Continuous Integration
- **Role:** Single source of truth for version control, change history, and automated build verification.
- **Repository:** `https://github.com/gocarauto/gocarauto`
- **Branch Strategy:**
  - `main`: Production-ready, verified codebase. Every merge or push to `main` triggers continuous live deployments.
  - Slices / Features: Developed on local branches (`slice/<name>` or `feat/<name>`), verified against all local test gates before merging into `main`.
- **Automated CI Gates (`.github/workflows/`):**
  - `ci.yml`: Executes backend tests on Node 20 and compiles frontend production bundles.
  - `valdoz.yml`: Enforces ValdoZ phase gate integrity and static security audit.

### Stage 3: Live Production Cloud Environment
- **Role:** High-availability, zero-cost production hosting serving real customers and workshop staff.
- **Infrastructure Topology:**
  - **Edge Frontends:** Vercel Edge Network auto-deploys `customer-portal` (`https://gocarauto.vercel.app`) and `staff-interface` (`https://gocarauto-3kpg.vercel.app`) from commits on `main`.
  - **Backend API:** Render.com Docker Web Service (`gocar-backend-crtx.onrender.com`) auto-builds container with headless Chromium for PDF invoices.
  - **Primary Relational Database:** TiDB Cloud Serverless MySQL (`gateway01.eu-central-1.prod.aws.tidbcloud.com:4000`) with automated daily backups.
  - **Availability Guard:** Free 10-minute cron ping (`cron-job.org`) to `/api/health` preventing backend container cold starts.

---

## 3. Policy Enforcement Rules

1. **Zero Untested Code to GitHub:**
   Under no circumstances will changes be pushed to GitHub without running the full test and build suites locally.
2. **Never Bypass Human Approval:**
   In Antigravity, all deliverable milestones, major architectural changes, and production pushes require explicit human confirmation.
3. **Atomic Documentation Reflex:**
   Every change must be documented in `CHANGELOG.md` in the same session it is introduced.
