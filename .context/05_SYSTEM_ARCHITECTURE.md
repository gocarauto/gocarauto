# System Architecture

## Directory Trees
```text
GoCar Auto/
├── database/            # Schema, Seed data, and SQLite DB files
├── routes/              # Express API route handlers (Auth, Customers, Services, etc.)
├── controllers/         # Business logic for routes
├── middleware/          # Express middleware (Auth checks, Error handlers)
├── utils/               # PDF Generation, Notification logic
├── staff-interface/     # React SPA for staff operations
├── customer-portal/     # React SPA for VIP customers
├── server.js            # Node/Express Entry Point
└── docker-compose.yml   # Multi-container orchestration
```

## Model Relationships
- **User (Staff/Customer)**: 1-to-many relationship with Vehicles (for Customers).
- **Vehicle**: Belongs to exactly 1 Customer. Has many Service Requests.
- **Service Request**: Belongs to exactly 1 Vehicle. Has many Service Records/Items.
- **Invoice/Financial**: 1-to-1 relationship with a Service Request.

## Data Streams
1. **Client to API**: React SPAs communicate with the Express backend via RESTful JSON payloads, authenticated via JWT in the Authorization header.
2. **API to Database**: Express controllers query the SQL database (SQLite/MySQL) using direct queries or light ORM wrappers.
3. **Background Jobs**: Node-cron triggers scheduled tasks (e.g., daily revenue calculation, service reminders) operating directly on the database and pushing to Notification Services.
4. **PDF Engine**: Data fetched from DB is piped into `pdfkit`, reshaped for Arabic text, and streamed back to the client as an application/pdf blob.
