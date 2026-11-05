# GoCar Auto - Project Map

This document provides a token-efficient overview of the project structure for agentic AI collaboration.

## 🏛️ Directory Structure

- `/controllers/`: **Logic Layer**. All business logic resides here (Separated from routing).
- `/routes/`: **Interface Layer**. Express route definitions and parameter validation.
- `/database/`: Data persistence (SQLite) and migrations.
- `/middleware/`: JWT verification and access control.
- `/utils/`: Helper services (PDF generation, notifications).
- `/config/`: Centralized environment and project configuration.
- `/staff-interface/`: React/Vite application for workshop administrators.
- `/customer-portal/`: React/Vite application for vehicle owners.

## 🚀 Key Entry Points

- `server.js`: API listener and service root.
- `start_system.sh`: Ignition script for Docker/Local environments.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, SQLite3.
- **Frontend**: React, Vite, Vanilla CSS.
- **Infrastructure**: Docker, Docker Compose.
