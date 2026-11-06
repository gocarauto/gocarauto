# Mandatory Engineering & Deployment Lifecycle Rule

> **Status:** STRICT & NON-BYPASSABLE  
> **Enforcement:** ValdoZ Protocol & Antigravity Pair-Programming Directives

---

## The 3-Stage Development & Release Hierarchy

All work on GoCar Auto must follow this unidirectional promotion pipeline without exception:

```
┌────────────────────────────────┐
│   STAGE 1: LOCAL ANTIGRAVITY   │  • Development, Bug fixes, Refactors
│      (Localhost:3000/5173/5174)│  • 34/34 Unit Tests Passing
│                                │  • 0 Frontend Lint & Build Errors
│                                │  • Human Review & Approval in Chat
└───────────────┬────────────────┘
                │
                │ Promoted only after full local verification pass
                ▼
┌────────────────────────────────┐
│      STAGE 2: GITHUB & CI      │  • Versioning & Commit Discipline
│    (github.com/gocarauto)      │  • Automated GitHub Actions Verification
│                                │  • ValdoZ Gate & Audit Verification
└───────────────┬────────────────┘
                │
                │ Automated trigger from verified commits on `main`
                ▼
┌────────────────────────────────┐
│    STAGE 3: LIVE PRODUCTION    │  • Vercel Edge Network (customer & staff frontends)
│   (Vercel + Render + TiDB)     │  • Render.com Docker API (gocar-backend)
│                                │  • TiDB Cloud Serverless MySQL
│                                │  • cron-job.org 10-minute Keep-Alive Ping
└────────────────────────────────┘
```

---

## Non-Bypassable Invariants

1. **Local-First Development (No Live Hot-Fixing):**
   - Never write code, execute schema migrations, or deploy changes directly to live cloud environments without first testing and verifying them locally on localhost.
   - All bug fixes, feature additions, or configuration changes MUST originate on the local machine inside Antigravity.

2. **Mandatory Local Quality Gates Before Git Commit:**
   Before staging any commit to GitHub, the following must pass cleanly:
   - Backend test suite: `npm test` (All tests passing, 0 failures).
   - Frontend static quality: `npm --prefix customer-portal run lint` (0 errors) and `npm --prefix staff-interface run lint` (0 errors).
   - Production bundle validation: `npm --prefix customer-portal run build` and `npm --prefix staff-interface run build`.
   - Security verification: No hardcoded secrets, no unverified external dependencies.

3. **Atomic Documentation Reflex:**
   - Every functional delta, API modification, or architectural change must be accompanied by updates to `CHANGELOG.md` and relevant documentation under the ValdoZ Scribe role in the same session.

4. **Human Gate Approval Required for Live Promotion:**
   - Pushing code to `main` on GitHub triggers automatic edge deployments on Vercel and Render. Therefore, no push to `main` may occur without explicit human approval in Antigravity chat.
