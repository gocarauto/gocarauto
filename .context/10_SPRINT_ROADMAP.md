# Sprint Roadmap

## Phase 1: Foundation & Audit (Current)
- [x] Establish `.context/` system boundaries and documentation.
- [x] Initialize core Docker infrastructure and local dev environments.

## Phase 2: Core Staff Capabilities
- [ ] Implement robust Role-Based Access Control in `auth.js`.
- [ ] Complete CRUD endpoints for Customers, Vehicles, and Service Requests.
- [ ] **Definition of Done**: Staff can successfully log in, create a customer profile, attach a vehicle, and log a service request with zero console errors.

## Phase 3: VIP Customer Portal
- [ ] Develop Customer dashboard React components.
- [ ] Implement secure login and service history fetching.
- [ ] **Definition of Done**: Customer can view active services and bilingual service history. UI aligns strictly with Elite UI brand identity.

## Phase 4: Financial & Notifications
- [ ] Integrate PDF generation pipeline (`utils/pdf-generator.js`).
- [ ] Connect Email and SMS Notification engines.
- [ ] **Definition of Done**: Service completion automatically dispatches an SMS and generates a downloadable PDF invoice.

## Phase 5: Production Hardening
- [ ] Execute E2E Tests via Browser Subagent.
- [ ] Deploy to Namecheap via `namecheap_deployment.md` workflow.
- [ ] **Definition of Done**: Live system running stably with HTTPS, automated backups enabled, and logging operational.
