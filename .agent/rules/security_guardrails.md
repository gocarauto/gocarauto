# Security Guardrails

These passive constraints ensure the security and integrity of the GoCar Auto application.

## 1. Authentication & Authorization
- **JWT Protection**: Every new route in `routes/` that accesses user-specific or sensitive data MUST use the `auth` middleware.
- **Role Validation**: Routes intended for staff only must explicitly check the user's role if the middleware doesn't already handle it.

## 2. Input Validation
- **Strict Typing**: All request bodies and query parameters must be validated for type and presence before being used.
- **Sanitization**: All user-provided strings that are stored in the database or rendered in the UI must be sanitized to prevent XSS and SQL Injection.

## 3. Data Privacy
- **Selective Exposure**: Never return sensitive fields like `password_hash` or `secret_key` in API responses.
- **Environment Variables**: Sensitive configuration (secrets, API keys) must NEVER be hardcoded. Use `.env` files and `process.env`.
