# GoCar Auto - Service and Financial Management System (SFMS)

A comprehensive dual-interface web application for vehicle maintenance, service request management, financial tracking, and customer engagement.

## ⚡ Super-Quick Start

The easiest way to launch the entire ecosystem (Backend + Staff Command Center + VIP Portal) is using our **System Ignition** script:

```bash
# 1. Give execution permission
chmod +x start_system.sh

# 2. Fire it up!
./start_system.sh
```

*Note: The script will automatically use **Docker** if available, or fall back to a high-speed **Local Development** mode.*

## 🚀 Features

### Staff Interface (Back-End)
- **User Management**: Role-based access (Admin/Operator)
- **Service Management**: Create and track service requests with status workflow
- **Financial Tracking**: Invoice generation, payment tracking, PDF receipts
- **Customer & Vehicle Management**: Complete CRUD operations
- **Reporting & Analytics**: Revenue, customer insights, service metrics
- **Notifications**: Automated service reminders and part arrival notifications

### Customer Portal (Front-End)
- **Secure Access**: Login via email/mobile
- **Vehicle Dashboard**: View all owned vehicles
- **Service History**: Complete history with bilingual item names (EN/AR)
- **Invoice Access**: View and download invoices/receipts

### Reporting Module
- Revenue analytics (daily/monthly/yearly)
- Customer insights and retention metrics
- Service performance and trends
- Vehicle service analytics
- Staff performance reports
- Exportable reports (PDF/CSV)

## 📋 Prerequisites

### For Docker Setup (Recommended)
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher

### For Manual Setup
- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher

## 🐳 Quick Start with Docker (Recommended)

### 1. Install Docker on EndeavorOS

```bash
# Install Docker
sudo pacman -S docker docker-compose

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
```

### 2. Start the Application

```bash
# Navigate to project directory
cd "/home/akhalil/AntiGravity/GoCar Auto"

# Start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 3. Access the Applications

- **Backend API**: http://localhost:3000
- **Staff Interface**: http://localhost:5173
- **Customer Portal**: http://localhost:5174

### 4. Stop the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v
```

## 🔧 Manual Setup (Alternative)

### 1. Install Backend Dependencies

```bash
cd "/home/akhalil/AntiGravity/GoCar Auto"
npm install
```

### 2. Install Frontend Dependencies

```bash
# Staff Interface
cd staff-interface
npm install
cd ..

# Customer Portal
cd customer-portal
npm install
cd ..
```

### 3. Start the Services

Open three separate terminals:

**Terminal 1 - Backend API:**
```bash
cd "/home/akhalil/AntiGravity/GoCar Auto"
npm start
```

**Terminal 2 - Staff Interface:**
```bash
cd "/home/akhalil/AntiGravity/GoCar Auto/staff-interface"
npm run dev
```

**Terminal 3 - Customer Portal:**
```bash
cd "/home/akhalil/AntiGravity/GoCar Auto/customer-portal"
npm run dev
```

## 👤 Default Login Credentials

### Staff Login
- **Admin**:
  - Email: `admin@gocarauto.com`
  - Password: `password123`

- **Operator**:
  - Email: `operator@gocarauto.com`
  - Password: `password123`

### Customer Login
- Use any email or mobile from the sample data:
  - Email: `khaled.hassan@email.com`
  - Mobile: `+201001234567`

## 📊 Database

The system uses SQLite for development with automatic initialization:
- Database file: `database/gocar_auto.db`
- Schema is auto-created on first run
- Sample data is auto-loaded for testing

### Reset Database

```bash
# Stop the application
docker-compose down

# Remove database file
rm database/gocar_auto.db

# Restart - database will be recreated
docker-compose up
```

## 🔔 Notifications Setup

### Email Notifications

Edit `.env` file:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### SMS Notifications (Twilio)

Edit `.env` file:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

**Note**: SMS is currently in placeholder mode. Uncomment Twilio code in `utils/notification-service.js` and add credentials to enable.

## 📁 Project Structure

```
GoCar Auto/
├── database/
│   ├── schema.sql          # Database schema
│   ├── seed.sql            # Sample data
│   ├── db.js               # Database connection
│   └── gocar_auto.db       # SQLite database (auto-created)
├── routes/
│   ├── auth.js             # Authentication
│   ├── customers.js        # Customer management
│   ├── vehicles.js         # Vehicle management
│   ├── service-requests.js # Service requests
│   ├── service-records.js  # Service records
│   ├── financial.js        # Financial transactions
│   ├── notifications.js    # Notifications
│   ├── customer-portal.js  # Customer portal API
│   ├── reports.js          # Reporting & analytics
│   └── service-items.js    # Service items master list
├── middleware/
│   └── auth.js             # JWT authentication
├── utils/
│   ├── pdf-generator.js    # Invoice PDF generation
│   └── notification-service.js # Email/SMS service
├── staff-interface/        # React staff interface
├── customer-portal/        # React customer portal
├── server.js               # Express server
├── package.json            # Backend dependencies
├── .env                    # Environment variables
├── Dockerfile              # Backend Docker config
└── docker-compose.yml      # Multi-container setup
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/staff/login` - Staff login
- `POST /api/auth/customer/login` - Customer login
- `GET /api/auth/verify` - Verify token

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/:id/service-history` - Get service history

### Service Requests
- `GET /api/service-requests` - List service requests
- `POST /api/service-requests` - Create service request
- `PATCH /api/service-requests/:id/status` - Update status

### Financial
- `POST /api/financial/generate-invoice` - Generate invoice
- `PATCH /api/financial/:id/payment` - Update payment
- `GET /api/financial/:id/pdf` - Download invoice PDF

### Reports
- `GET /api/reports/revenue` - Revenue analytics
- `GET /api/reports/customers` - Customer insights
- `GET /api/reports/services` - Service metrics
- `GET /api/reports/dashboard` - Dashboard summary

## 🚢 Deployment to Namecheap

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🛠️ Development

### Adding New Service Items

Service items are bilingual (English/Arabic). Add them via:
1. Staff interface (coming soon)
2. Direct database insert
3. Update `database/seed.sql`

### Customizing Invoice

Edit `utils/pdf-generator.js` to customize:
- Company branding
- Invoice layout
- Colors and fonts

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues or questions:
- Email: info@gocarauto.com
- Phone: +20 123 456 7890

---

**Built with**: Node.js, Express, React, Vite, SQLite, Docker
