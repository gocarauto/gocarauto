# Functional Specification

## Core Modules

### 1. Staff Interface (Command Center)
- **Authentication**: Admin/Operator role-based login.
- **Service Management**: Create, update, and track service requests. Status transitions (e.g., Pending, In Progress, Completed).
- **Financial Tracking**: Generate invoices, track payments, download PDF receipts.
- **Customer/Vehicle CRUD**: Full management of customer profiles and vehicle data.
- **Reporting**: Revenue analytics, customer insights, staff performance.

### 2. Customer Portal (VIP Portal)
- **Authentication**: Secure login via email/mobile.
- **Vehicle Dashboard**: View registered vehicles and their current service status.
- **Service History**: Bilingual (EN/AR) historical service records.
- **Invoices**: View and download past invoices.

### 3. Notification Engine
- Automated emails (via Nodemailer) and SMS (via Twilio) triggered by status changes and part arrivals.

## User Stories
- *As an Admin, I want to view a dashboard of daily revenue so I can track business performance.*
- *As an Operator, I want to update a service request to "Completed" and automatically notify the customer.*
- *As a Customer, I want to log in and download my recent service invoice.*

## Strict Acceptance Criteria
- All API endpoints must enforce JWT verification and role checks.
- Invoices must generate within 2 seconds and support bilingual text.
- Customer Portal must be fully responsive across mobile and desktop.
