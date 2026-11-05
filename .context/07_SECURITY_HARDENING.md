# Security Hardening

## 1. Identity Assertion
- **Authentication**: Stateless JSON Web Tokens (JWT) issued upon successful login, configured with short expiration times.
- **Password Storage**: Passwords hashed using `bcrypt` (minimum 10 rounds).
- **Role-Based Access Control (RBAC)**: Enforced via Express middleware (`middleware/auth.js`) differentiating between 'Admin' and 'Operator' roles for staff endpoints, and explicitly separating 'Customer' endpoints.

## 2. Token Masking & Handling
- **Storage**: Tokens on the client side must be stored securely (e.g., HTTP-only cookies if applicable, or secure local storage).
- **Masking**: API responses must NEVER return password hashes or raw token secrets.

## 3. Payload Scrubbing
- Input validation on all endpoints to sanitize incoming JSON payloads.
- Prevent SQL Injection by using parameterized queries in `mysql2`/`sqlite3` or ORM features.
- Cross-Origin Resource Sharing (CORS) restricted to explicit frontend domains in production.

## 4. API Rate Limiting
- To be implemented: basic rate limiting to prevent brute-force login attempts and API abuse.
