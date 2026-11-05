# GoCar Auto — Phase 9: Handover

## Overview
GoCar Auto is a dual-interface service and financial management system (SFMS) for car service, fleet operations, customer rental agreements, and bilingual billing.

---

## Runbook
### System Architecture & Topology
- **Customer Portal**: React 18, Vite, Tailwind CSS, Framer Motion (`customer-portal/`)
- **Staff Operations Desk**: React 18, Vite, Recharts, Data Tables (`staff-interface/`)
- **Backend Service**: Node.js / Express API (`server.js`, `routes/`, `controllers/`)
- **Persistence Engine**: SQLite / MySQL via abstraction layer (`database/`)
- **PDF Engine**: PDFKit with Arabic reshaping and bidirectional text rendering (`arabic-reshaper`, `bidi-js`)

### Launch Procedures
1. **Via System Ignition**:
   ```bash
   chmod +x start_system.sh
   ./start_system.sh
   ```
2. **Via Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```

### Operational Endpoints
- **API Server**: `http://localhost:3000`
- **Staff Interface**: `http://localhost:5173`
- **Customer Portal**: `http://localhost:5174`

---

## Access Transfer
- **Repository & Codebase**: Rooted at `/home/akhalil/SSD/AntiGravity/GoCar Auto`.
- **Environment & Secrets**: Configured via `.env` file based on `.env.example`.
- **Database Storage**: Managed through local SQLite database `gocar_auto.db` (or MySQL container configuration).
- **Service Accounts**: Admin and Operator accounts are initialized through seeds in `database/`.
- **Administrative Ownership**: Full administrative access and role configurations are transferred to the operating team.

---

## Known Issues
1. **Payment Gateway Integration**: Direct online payment gateways (e.g. Mada, Stripe, Apple Pay) are slated for subsequent integration; receipts are currently generated via internal accounting workflow.
2. **Real-time Telemetry / GPS**: Vehicle telemetry tracking and automated odometer syncing on return are staged for Phase 10 feature enhancements.
3. **No Network Offline Mode**: In offline environments without Docker registry access, local image caching or direct Node.js runtime fallback is required.

---

## Sign-Off
- **Architecture & Build Verification**: Completed and validated.
- **Security & Lockfile Compliance**: Universal ValdoZ audit passed with zero blocking issues.
- **Deliverable Completeness**: All runtime scripts, Docker definitions, and operational guides have been verified.
- **Client & Operator Acceptance**: Handover documentation approved for ongoing system maintenance and operations.
