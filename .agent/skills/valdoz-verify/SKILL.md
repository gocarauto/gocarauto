---
name: valdoz-verify
description: >-
  Execute comprehensive verification: unit/integration tests, security SAST scans, secret leak checks, and gate audits.
---

# ValdoZ Verify Playbook (Quality & Security Verification)

## Objectives
1. **Security Standards & Skills:** Reference `.valdoz/repos.yaml` for security skills (e.g. `cloudflare/security-audit-skill` for structured 6-phase application vulnerability assessment).
2. **Automated Test Execution:** Run full test suite (unit, integration, end-to-end) with test coverage thresholds.
3. **Static Analysis & SAST:** Run automated SAST scan (Semgrep), secrets detection, and lockfile integrity verification.
4. **Compliance & Drift:** Verify accessibility (WCAG), performance, and API contract drift.
5. **Reporting:** Compile verification report in `docs/07-verification.md`.

## Permitted Command Whitelist
`valdoz *`, `valdoz audit`, test runners, linters.

## Required Deliverables
- `docs/07-verification.md`

## Side-Effect Classification
- Category: **Test Artifacts**
- Reversibility: **Reversible**
