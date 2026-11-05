---
name: API Integration
description: Guidelines for developing robust and consistent Express API endpoints.
---

# API Integration & Backend Standards

When adding new routes or modifying existing ones in the GoCar Auto backend, follow these strict standards:

## Standards
1. **RESTful Structure**: Ensure all endpoints follow RESTful conventions (GET, POST, PATCH/PUT, DELETE).
2. **Consistent Error Handling**: All routes must gracefully handle errors and return a consistent JSON error structure. Use the templates in [error_templates.js](file:///home/akhalil/AntiGravity/GoCar%20Auto/.agent/skills/api_integration/resources/error_templates.js).
3. **Middleware Security**: Ensure routes that require authentication are protected using the JWT `auth` middleware.
4. **Data Validation**: strictly validate all incoming parameters (request body, query parameters, route params) before processing them or interacting with the database.
5. **Logging**: Log significant actions and any caught errors using structured logging (with clear contextual messages and timestamps) to ease debugging.

## Resources
- [Error Response Templates](file:///home/akhalil/AntiGravity/GoCar%20Auto/.agent/skills/api_integration/resources/error_templates.js)
