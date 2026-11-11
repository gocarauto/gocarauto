-- GoCar Auto Service and Financial Management System
-- Database Schema (Refactored)

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ============================================
-- USERS TABLES (formerly STAFF)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Operator')),
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CLIENTS TABLE (formerly CUSTOMERS)
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL,
    address TEXT,
    password_hash TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    referral_source TEXT,
    referred_by_client_id INTEGER,
    notes TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by_client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- ============================================
-- VEHICLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    client_name TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    license_plate TEXT UNIQUE,
    vin TEXT UNIQUE,
    current_mileage INTEGER DEFAULT 0,
    last_service_date DATE,
    last_service_mileage INTEGER,
    next_service_due DATE,
    services_count INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================
-- SERVICE ITEMS (Master List)
-- ============================================

CREATE TABLE IF NOT EXISTS service_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    item_name_ar TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Parts', 'Oil', 'Service')),
    sale_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT 1,
    km_interval INTEGER,
    month_interval INTEGER,
    tracking_point TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SERVICE REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    scheduled_date DATE,
    scheduled_time TEXT,
    service_type TEXT,
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Complete', 'Completed', 'Invoiced', 'Paid', 'Parts Ordered', 'Waiting for Parts')),
    client_name TEXT NOT NULL,
    vehicle_info TEXT NOT NULL,
    days_open INTEGER DEFAULT 0,
    notes TEXT,
    mileage INTEGER DEFAULT 0,
    source TEXT DEFAULT 'STAFF',
    assigned_to_id INTEGER,
    assigned_to_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- SERVICE RECORDS (Transaction Detail/Line Items)
-- ============================================

CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    service_date DATE DEFAULT CURRENT_DATE,
    mileage INTEGER,
    user_id INTEGER,
    item_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (item_id) REFERENCES service_items(id) ON DELETE RESTRICT
);

-- ============================================
-- FINANCIAL TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS financial_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    total_amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK(payment_status IN ('Pending', 'Paid', 'Partial')),
    payment_date DATE,
    payment_method TEXT,
    currency TEXT DEFAULT 'EGP',
    tax_rate DECIMAL(5,2) DEFAULT 14.00,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    spare_parts_markup DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- ============================================
-- NOTIFICATION LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    vehicle_id INTEGER,
    notification_type TEXT NOT NULL CHECK(notification_type IN ('NextServiceDue', 'PartArrival', 'PaymentReminder', 'Other')),
    message TEXT NOT NULL,
    sent_via TEXT CHECK(sent_via IN ('SMS', 'Email', 'Both')),
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Sent' CHECK(status IN ('Sent', 'Failed', 'Pending')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- ============================================
-- VEHICLE MAINTENANCE LEDGER
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_maintenance_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    tracking_point TEXT NOT NULL,
    last_service_id INTEGER,
    last_mileage INTEGER,
    last_date DATE,
    next_due_mileage INTEGER,
    next_due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, tracking_point),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ============================================
-- SERVICE REMINDERS
-- ============================================

CREATE TABLE IF NOT EXISTS service_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Sent', 'Active', 'Dismissed', 'Completed')),
    interval_km INTEGER,
    interval_months INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ============================================
-- EXTERNAL SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS external_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    workshop_name TEXT NOT NULL,
    service_type TEXT,
    service_date DATE NOT NULL,
    mileage INTEGER,
    total_amount DECIMAL(10,2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ============================================
-- CUSTOMER DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS customer_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================
-- SERVICE REQUEST COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS service_request_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- ============================================
-- CONSIGNMENT REQUESTS (Used Car Consignment / Sell My Car)
-- ============================================

CREATE TABLE IF NOT EXISTS consignment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    asking_price DECIMAL(12,2),
    current_mileage INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'Contacted', 'Inspected', 'Listed', 'Sold', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ============================================
-- CONSIGNMENT LISTINGS (Used Car Brokerage Workspace)
-- ============================================

CREATE TABLE IF NOT EXISTS consignment_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    vehicle_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    asking_price DECIMAL(12,2) NOT NULL,
    sold_price DECIMAL(12,2),
    commission_type TEXT NOT NULL DEFAULT 'Percentage' CHECK(commission_type IN ('Percentage', 'Fixed')),
    commission_rate DECIMAL(5,2) DEFAULT 2.50,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    listing_status TEXT NOT NULL DEFAULT 'Intake' CHECK(listing_status IN ('Intake', 'Staged', 'Listed', 'Buyer Viewing', 'Sold', 'Withdrawn')),
    fb_marketplace_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES consignment_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vehicles_client ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_next_service_due ON vehicles(next_service_due);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_make_model ON vehicles(client_id, make, model);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_join_date ON clients(join_date);
CREATE INDEX IF NOT EXISTS idx_clients_referred_by ON clients(referred_by_client_id);
CREATE INDEX IF NOT EXISTS idx_service_items_category ON service_items(category, is_active);
CREATE INDEX IF NOT EXISTS idx_service_items_tracking ON service_items(tracking_point);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_vehicle ON service_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_scheduled_date ON service_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_requests_request_date ON service_requests(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_date ON service_requests(client_id, request_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_vehicle_date ON service_requests(vehicle_id, request_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_status_date ON service_requests(status, request_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned ON service_requests(assigned_to_id, status);
CREATE INDEX IF NOT EXISTS idx_service_records_request ON service_records(request_id);
CREATE INDEX IF NOT EXISTS idx_service_records_item ON service_records(item_id);
CREATE INDEX IF NOT EXISTS idx_service_records_service_date ON service_records(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_records_req_item ON service_records(request_id, item_id);
CREATE INDEX IF NOT EXISTS idx_service_records_user ON service_records(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_request ON financial_transactions(request_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_invoice ON financial_transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON financial_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status_date ON financial_transactions(payment_status, payment_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status_created ON financial_transactions(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_client ON notification_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_vehicle ON notification_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_sent ON notification_logs(status, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_reminders_vehicle ON service_reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_client ON service_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_status ON service_reminders(status);
CREATE INDEX IF NOT EXISTS idx_service_reminders_status_due ON service_reminders(status, due_date ASC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_vehicle_service ON service_reminders(vehicle_id, service_type) WHERE status = 'Pending';
CREATE INDEX IF NOT EXISTS idx_customer_documents_client ON customer_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_file_url ON customer_documents(file_url);
CREATE INDEX IF NOT EXISTS idx_consignment_requests_client ON consignment_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_consignment_requests_vehicle ON consignment_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_consignment_requests_status ON consignment_requests(status);
CREATE INDEX IF NOT EXISTS idx_consignment_requests_status_created ON consignment_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consignment_listings_status ON consignment_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_consignment_listings_vehicle ON consignment_listings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_consignment_listings_client ON consignment_listings(client_id);
CREATE INDEX IF NOT EXISTS idx_consignment_listings_status_created ON consignment_listings(listing_status, created_at DESC);

-- ============================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS
-- ============================================

-- Update Vehicle TotalSpent when service records are added
CREATE TRIGGER IF NOT EXISTS update_vehicle_total_spent
AFTER INSERT ON service_records
BEGIN
    UPDATE vehicles
    SET total_spent = (
        SELECT COALESCE(SUM(sr.total_price), 0)
        FROM service_records sr
        JOIN service_requests sreq ON sr.request_id = sreq.id
        WHERE sreq.vehicle_id = (
            SELECT vehicle_id FROM service_requests WHERE id = NEW.request_id
        )
    ),
    services_count = services_count + 1,
    last_service_date = NEW.service_date,
    last_service_mileage = NEW.mileage,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = (
        SELECT vehicle_id FROM service_requests WHERE id = NEW.request_id
    );
END;

-- Recalculate Vehicle TotalSpent when service records are updated
CREATE TRIGGER IF NOT EXISTS update_vehicle_total_spent_on_update
AFTER UPDATE ON service_records
BEGIN
    UPDATE vehicles
    SET total_spent = (
        SELECT COALESCE(SUM(sr.total_price), 0)
        FROM service_records sr
        JOIN service_requests sreq ON sr.request_id = sreq.id
        WHERE sreq.vehicle_id = (SELECT vehicle_id FROM service_requests WHERE id = NEW.request_id)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT vehicle_id FROM service_requests WHERE id = NEW.request_id);
END;

-- Recalculate Vehicle TotalSpent when service records are deleted
CREATE TRIGGER IF NOT EXISTS update_vehicle_total_spent_on_delete
AFTER DELETE ON service_records
BEGIN
    UPDATE vehicles
    SET total_spent = (
        SELECT COALESCE(SUM(sr.total_price), 0)
        FROM service_records sr
        JOIN service_requests sreq ON sr.request_id = sreq.id
        WHERE sreq.vehicle_id = (SELECT vehicle_id FROM service_requests WHERE id = OLD.request_id)
    ),
    services_count = MAX(0, services_count - 1),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT vehicle_id FROM service_requests WHERE id = OLD.request_id);
END;

-- Update Client TotalSpent when service records are added
CREATE TRIGGER IF NOT EXISTS update_client_total_spent
AFTER INSERT ON service_records
BEGIN
    UPDATE clients
    SET total_spent = (
        SELECT COALESCE(SUM(sr.total_price), 0)
        FROM service_records sr
        JOIN service_requests sreq ON sr.request_id = sreq.id
        WHERE sreq.client_id = (
            SELECT client_id FROM service_requests WHERE id = NEW.request_id
        )
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = (
        SELECT client_id FROM service_requests WHERE id = NEW.request_id
    );
END;

-- Recalculate Client TotalSpent when service records are updated
CREATE TRIGGER IF NOT EXISTS update_client_total_spent_on_update
AFTER UPDATE ON service_records
BEGIN
    UPDATE clients
    SET total_spent = (
        SELECT COALESCE(SUM(sr.total_price), 0)
        FROM service_records sr
        JOIN service_requests sreq ON sr.request_id = sreq.id
        WHERE sreq.client_id = (SELECT client_id FROM service_requests WHERE id = NEW.request_id)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT client_id FROM service_requests WHERE id = NEW.request_id);
END;

-- Recalculate Client TotalSpent when service records are deleted
CREATE TRIGGER IF NOT EXISTS update_client_total_spent_on_delete
AFTER DELETE ON service_records
BEGIN
    UPDATE clients
    SET total_spent = (
        SELECT COALESCE(SUM(sr.total_price), 0)
        FROM service_records sr
        JOIN service_requests sreq ON sr.request_id = sreq.id
        WHERE sreq.client_id = (SELECT client_id FROM service_requests WHERE id = OLD.request_id)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT client_id FROM service_requests WHERE id = OLD.request_id);
END;

-- Update DaysOpen for service requests
CREATE TRIGGER IF NOT EXISTS update_days_open
AFTER UPDATE ON service_requests
BEGIN
    UPDATE service_requests
    SET days_open = CAST((julianday('now') - julianday(request_date)) AS INTEGER)
    WHERE id = NEW.id;
END;

-- Calculate NextServiceDue (90 days after last service)
CREATE TRIGGER IF NOT EXISTS calculate_next_service_due
AFTER UPDATE OF last_service_date ON vehicles
BEGIN
    UPDATE vehicles
    SET next_service_due = date(NEW.last_service_date, '+90 days')
    WHERE id = NEW.id;
END;

-- ============================================
-- SERVICE HISTORY VIEW (Read-Only Reporting)
-- ============================================

CREATE VIEW IF NOT EXISTS service_history AS
SELECT 
    sr.id AS record_id,
    sr.service_date,
    c.id AS client_id,
    c.full_name AS client_name,
    c.email AS client_email,
    c.phone AS client_mobile,
    v.id AS vehicle_id,
    v.make || ' ' || v.model || ' (' || v.year || ')' AS vehicle_info,
    v.license_plate,
    v.vin,
    sr.mileage,
    si.item_name,
    si.item_name_ar,
    si.category,
    sr.quantity,
    sr.unit_price,
    sr.total_price,
    u.name AS serviced_by,
    sreq.id AS request_id,
    sreq.status AS request_status,
    ft.id AS invoice_id,
    ft.invoice_number,
    ft.payment_status,
    ft.service_fee,
    ft.spare_parts_markup,
    ft.total_amount_due
FROM service_records sr
JOIN service_requests sreq ON sr.request_id = sreq.id
JOIN clients c ON sreq.client_id = c.id
JOIN vehicles v ON sreq.vehicle_id = v.id
JOIN service_items si ON sr.item_id = si.id
LEFT JOIN users u ON sr.user_id = u.id
LEFT JOIN financial_transactions ft ON sreq.id = ft.request_id
ORDER BY sr.service_date DESC;
