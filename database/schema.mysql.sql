-- GoCar Auto Service and Financial Management System
-- Production Schema for MySQL / MariaDB / Amazon Aurora (100% Optimized & Hardened)

DROP TABLE IF EXISTS service_request_comments;
DROP TABLE IF EXISTS external_services;
DROP TABLE IF EXISTS notification_logs;
DROP TABLE IF EXISTS vehicle_maintenance_ledger;
DROP TABLE IF EXISTS consignment_listings;
DROP TABLE IF EXISTS consignment_requests;
DROP TABLE IF EXISTS customer_documents;
DROP TABLE IF EXISTS service_reminders;
DROP TABLE IF EXISTS financial_transactions;
DROP TABLE IF EXISTS service_records;
DROP TABLE IF EXISTS service_requests;
DROP TABLE IF EXISTS service_items;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    join_date VARCHAR(50) NULL,
    referral_source VARCHAR(100),
    notes TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    password_hash VARCHAR(255) NULL,
    referred_by_client_id INT NULL,
    INDEX idx_clients_phone (phone),
    INDEX idx_clients_join_date (join_date),
    INDEX idx_clients_referred_by (referred_by_client_id),
    CONSTRAINT fk_clients_referred FOREIGN KEY (referred_by_client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NULL,
    license_plate VARCHAR(50) NULL UNIQUE,
    vin VARCHAR(100) NULL UNIQUE,
    current_mileage INT DEFAULT 0,
    last_service_date VARCHAR(50) NULL,
    last_service_mileage INT NULL,
    next_service_due VARCHAR(50) NULL,
    services_count INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vehicles_client (client_id),
    INDEX idx_vehicles_license (license_plate),
    INDEX idx_vehicles_vin (vin),
    INDEX idx_vehicles_next_service_due (next_service_due),
    INDEX idx_vehicles_client_make_model (client_id, make, model),
    CONSTRAINT fk_vehicles_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVICE ITEMS (Master Catalog)
-- ============================================
CREATE TABLE service_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_name_ar VARCHAR(255) NULL,
    category VARCHAR(100) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    km_interval INT NULL,
    month_interval INT NULL,
    tracking_point VARCHAR(255) NULL,
    INDEX idx_service_items_category (category, is_active),
    INDEX idx_service_items_tracking (tracking_point)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVICE REQUESTS
-- ============================================
CREATE TABLE service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    request_date VARCHAR(50) NULL,
    service_type VARCHAR(100) NULL,
    status VARCHAR(50) DEFAULT 'Open',
    client_name VARCHAR(255) NOT NULL,
    vehicle_info VARCHAR(255) NOT NULL,
    days_open INT DEFAULT 0,
    notes TEXT,
    mileage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'STAFF',
    scheduled_date VARCHAR(50) NULL,
    scheduled_time VARCHAR(50) NULL,
    assigned_to_id INT NULL,
    assigned_to_name VARCHAR(255) NULL,
    INDEX idx_sr_client (client_id),
    INDEX idx_sr_vehicle (vehicle_id),
    INDEX idx_sr_status (status),
    INDEX idx_sr_scheduled (scheduled_date),
    INDEX idx_sr_request_date (request_date),
    INDEX idx_sr_client_date (client_id, request_date),
    INDEX idx_sr_vehicle_date (vehicle_id, request_date),
    INDEX idx_sr_status_date (status, request_date),
    INDEX idx_sr_assigned (assigned_to_id, status),
    CONSTRAINT fk_sr_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_assigned FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVICE RECORDS
-- ============================================
CREATE TABLE service_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    service_date VARCHAR(50) NULL,
    mileage INT NULL,
    user_id INT NULL,
    item_id INT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_srec_request (request_id),
    INDEX idx_srec_item (item_id),
    INDEX idx_srec_service_date (service_date),
    INDEX idx_srec_req_item (request_id, item_id),
    INDEX idx_srec_user (user_id),
    CONSTRAINT fk_srec_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_srec_item FOREIGN KEY (item_id) REFERENCES service_items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_srec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FINANCIAL TRANSACTIONS
-- ============================================
CREATE TABLE financial_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NULL,
    invoice_number VARCHAR(100) NULL UNIQUE,
    total_amount_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    payment_date VARCHAR(50) NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    spare_parts_markup DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'EGP',
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    INDEX idx_ft_request (request_id),
    INDEX idx_ft_invoice (invoice_number),
    INDEX idx_ft_payment_status (payment_status),
    INDEX idx_ft_created_at (created_at),
    INDEX idx_ft_status_date (payment_status, payment_date),
    INDEX idx_ft_status_created (payment_status, created_at),
    CONSTRAINT fk_ft_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CUSTOMER DOCUMENTS
-- ============================================
CREATE TABLE customer_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    title VARCHAR(255) NULL,
    document_type VARCHAR(100) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cd_client (client_id),
    INDEX idx_cd_file_url (file_url),
    CONSTRAINT fk_cd_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVICE REMINDERS
-- ============================================
CREATE TABLE service_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    due_date VARCHAR(50) NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    interval_km INT NULL,
    interval_months INT NULL,
    INDEX idx_srem_vehicle (vehicle_id),
    INDEX idx_srem_client (client_id),
    INDEX idx_srem_status (status),
    INDEX idx_srem_status_due (status, due_date),
    CONSTRAINT fk_srem_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_srem_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONSIGNMENT REQUESTS
-- ============================================
CREATE TABLE consignment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    asking_price DECIMAL(12,2) NOT NULL,
    current_mileage INT DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cr_client (client_id),
    INDEX idx_cr_vehicle (vehicle_id),
    INDEX idx_cr_status (status),
    INDEX idx_cr_status_created (status, created_at),
    CONSTRAINT fk_cr_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_cr_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONSIGNMENT LISTINGS
-- ============================================
CREATE TABLE consignment_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NULL,
    vehicle_id INT NOT NULL,
    client_id INT NOT NULL,
    asking_price DECIMAL(12,2) NOT NULL,
    sold_price DECIMAL(12,2) NULL,
    commission_type VARCHAR(50) NULL,
    commission_rate DECIMAL(5,2) DEFAULT 2.50,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    listing_status VARCHAR(50) DEFAULT 'Active',
    fb_marketplace_url VARCHAR(500) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cl_request (request_id),
    INDEX idx_cl_vehicle (vehicle_id),
    INDEX idx_cl_client (client_id),
    INDEX idx_cl_status (listing_status),
    INDEX idx_cl_status_created (listing_status, created_at),
    CONSTRAINT fk_cl_request FOREIGN KEY (request_id) REFERENCES consignment_requests(id) ON DELETE SET NULL,
    CONSTRAINT fk_cl_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_cl_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VEHICLE MAINTENANCE LEDGER
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_maintenance_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    tracking_point VARCHAR(255) NOT NULL,
    last_service_id INT NULL,
    last_mileage INT NULL,
    last_date VARCHAR(50) NULL,
    next_due_mileage INT NULL,
    next_due_date VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_veh_tracking (vehicle_id, tracking_point),
    INDEX idx_vml_vehicle (vehicle_id),
    CONSTRAINT fk_vml_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVICE REQUEST COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS service_request_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_src_request (request_id),
    CONSTRAINT fk_src_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EXTERNAL SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS external_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    workshop_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NULL,
    service_date VARCHAR(50) NOT NULL,
    mileage INT NULL,
    total_amount DECIMAL(10,2) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ext_vehicle (vehicle_id),
    CONSTRAINT fk_ext_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTIFICATION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    vehicle_id INT NULL,
    notification_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    sent_via VARCHAR(50) DEFAULT 'Both',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Sent',
    INDEX idx_nl_client (client_id),
    INDEX idx_nl_vehicle (vehicle_id),
    INDEX idx_nl_status_sent (status, sent_at),
    CONSTRAINT fk_nl_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_nl_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVICE HISTORY VIEW (Reporting & Customer Portal)
-- ============================================
CREATE OR REPLACE VIEW service_history AS
SELECT 
    sr.id AS record_id,
    sr.service_date,
    c.id AS client_id,
    c.full_name AS client_name,
    c.email AS client_email,
    c.phone AS client_mobile,
    v.id AS vehicle_id,
    CONCAT(v.make, ' ', v.model, ' (', COALESCE(v.year, ''), ')') AS vehicle_info,
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
LEFT JOIN financial_transactions ft ON sreq.id = ft.request_id;
