# Project Decisions Log

> Machine-readable source: `.valdoz/decisions.jsonl`

| ID | Phase | Question | Decision | Rationale | Decided By | Timestamp |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | 10 | Import taste-skill (Leonxlnx/taste-skill) | **Import v2.1.5 commit 12af471f to .agent/skills/design-taste-frontend and global config** | MIT license, passed security audit, provides anti-slop frontend art direction rules and inspection tools | akhalil | 2026-11-04 |
| DEC-002 | 8 | Select 100% free cloud deployment topology for GoCar Auto | **Cloudflare Pages (SPAs) + Render.com Docker (Backend API) + TiDB Cloud Serverless (MySQL DB) + Cloudflare R2 (10GB Object Storage) + cron-job.org (Cold-start ping)** | Zero ongoing cost (bash.00/mo), eliminates cold starts via 10-min keep-alive ping, no credit card required for TiDB, zero bandwidth overage fees on Cloudflare Pages, full native compatibility with Express and React Vite frontends | akhalil | 2026-11-05 |
| DEC-003 | 8 | Define mandatory software engineering and deployment lifecycle workflow | **Strict 3-Stage Tiered Lifecycle: 1. Local Antigravity Development & Verification (Localhost) -> 2. GitHub Version Control & Automated CI -> 3. Live Production Edge (Cloudflare Pages + Render + TiDB Cloud)** | Guarantees zero regressions, zero untested code reaching production, full traceability of changes in Git, and automated CI gate enforcement before live deployment. | akhalil | 2026-11-05 |
