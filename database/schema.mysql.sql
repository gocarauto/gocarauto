-- GoCar Auto Service and Financial Management System
-- Production Schema for MySQL / TiDB Cloud (100% Mirror of Live SQLite Schema)

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
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
    INDEX idx_clients_referred_by (referred_by_client_id)
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
    license_plate VARCHAR(50) NULL,
    vin VARCHAR(100) NULL,
    current_mileage INT DEFAULT 0,
    last_service_date VARCHAR(50) NULL,
    last_service_mileage INT NULL,
    next_service_due VARCHAR(50) NULL,
    services_count INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vehicles_client (client_id)
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
    tracking_point VARCHAR(255) NULL
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
    INDEX idx_sr_scheduled (scheduled_date)
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
    INDEX idx_srec_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FINANCIAL TRANSACTIONS
-- ============================================
CREATE TABLE financial_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NULL,
    invoice_number VARCHAR(100) NULL,
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
    INDEX idx_ft_payment_status (payment_status)
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
    INDEX idx_cd_client (client_id)
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
    INDEX idx_srem_status (status)
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
    INDEX idx_cr_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONSIGNMENT LISTINGS
-- ============================================
CREATE TABLE consignment_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
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
    INDEX idx_cl_status (listing_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
