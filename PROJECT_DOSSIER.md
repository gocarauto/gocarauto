# Project Dossier: GoCar Auto

## 1. Executive Summary & Objective
GoCar Auto is a car rental, fleet management, and mobility operations platform. It features a bilingual (Arabic RTL and English) customer booking experience, an administrative staff portal, digital rental agreements, vehicle maintenance scheduling, and payment processing.

## 2. Current Project Standing
- **Current Status**: **Advanced Multi-Portal Enterprise Application**
- **Maturity Level**: 85% Complete
- **Operational Readiness**: Features dual React portals (`staff-interface/`, `customer-portal/`), Express backend with native Arabic reshaper engines, containerized Docker infrastructure, and comprehensive design assets (`Stitch/`).
- **Git State**: Local workspace repository.

## 3. Technology Stack & Bill of Materials
- **Customer Portal**: React (Vite, React Router DOM, Tailwind CSS, Framer Motion, Lucide)
- **Staff Operations Portal**: React (Vite, Recharts, Data Tables, Booking Manager)
- **Backend / API**: Node.js / Express (`arabic-reshaper`, `bidi-js`, `bcrypt`, `cookie-parser`, `csv-parse`, `cors`)
- **DevOps**: Docker Compose, Dockerfile
- **Design System**: Stitch UI assets and component blueprints (`_blueprint/`)

## 4. Key Directory & Architecture Topology
```
GoCar Auto/
├── customer-portal/      # Client-facing vehicle browsing & reservation portal
├── staff-interface/      # Operations desk for check-in/out, fleet & billing
├── _blueprint/           # Prototype server & foundational contracts
├── Stitch/               # High-fidelity UI mockups & design system screens
├── server.js / api/      # Main Express API with Arabic text shaping for PDF contracts
├── Dockerfile            # Container definition
├── docker-compose.yml    # Full-stack orchestrator
└── README.md / AGENTS.md # System architecture & developer guide
```

## 5. Implemented Features
- **Bilingual Arabic/English PDF Contracts**: Automated rental agreement compilation with proper RTL Arabic glyph shaping (`arabic-reshaper`, `bidi-js`).
- **Dual Portal Separation**: Segregates public self-service vehicle discovery from internal fleet management.
- **Fleet Availability Calendar**: Real-time vehicle availability, maintenance block-outs, and booking conflicts.
- **Customer Identity & License Verification**: Upload and validation of driving licenses and national IDs.

## 6. Immediate Next Steps & Gaps
- Integrate payment gateway (e.g. Mada / Apple Pay / Stripe).
- Implement automated vehicle GPS tracking and mileage audit on check-in.
