---
description: Run End-to-End Tests using Browser Subagent
---

This workflow describes how to test the GoCar Auto applications using the Antigravity browser subagent.

1. Ensure the development environment is running and healthy (Workflow: `start_dev_environment.md`).
2. Start an autonomous browser subagent to test the Staff Interface login, navigation, and dashboard functionalities at `http://localhost:5173`.
3. Start an autonomous browser subagent to test the Customer Portal login and user flow at `http://localhost:5174`.
4. Instruct the subagent to take screenshots of key pages (e.g., Invoices, Service Requests) to verify layout integrity, responsive design, and visual aesthetics.
