-- Initial Data Seeds (Refactored)

-- ============================================
-- USERS (Admins & Operators)
-- ============================================

-- Admin User: admin@gocar.com / password123 (hashed)
INSERT INTO users (name, role, email, password_hash)
VALUES ('System Admin', 'Admin', 'admin@gocar.com', '$2b$10$q2CBks8rr5dOf74pyaUPrOokEOiGNQBMieauzCnOertWjTqKmW096'); 

-- Operator User
INSERT INTO users (name, role, email, password_hash)
VALUES ('Staff Operator', 'Operator', 'staff@gocar.com', '$2b$10$q2CBks8rr5dOf74pyaUPrOokEOiGNQBMieauzCnOertWjTqKmW096');

-- ============================================
-- SERVICE ITEMS (Master List)
-- ============================================

INSERT INTO service_items (item_name, item_name_ar, category, sale_price) VALUES 
('Oil Change (Synthetic)', '???? ?? (?????)', 'Oil', 1500.00),
('Oil Change (Regular)', '???? ?? (????)', 'Oil', 800.00),
('Brake Pads Replacement (Front)', '????? ???? (????)', 'Parts', 1200.00),
('Brake Pads Replacement (Rear)', '????? ???? (???)', 'Parts', 1100.00),
('Air Filter Replacement', '????? ???? ????', 'Parts', 350.00),
('Tire Rotation', '????? ?????', 'Service', 200.00),
('Wheel Alignment', '??? ?????', 'Service', 400.00),
('Battery Replacement', '????? ???????', 'Parts', 2500.00),
('Full Inspection', '?? ????', 'Service', 500.00),
('Spark Plugs Replacement', '????? ??????', 'Parts', 800.00),
('Coolant Flush', '????? ???? ??????', 'Service', 600.00),
('Transmission Fluid Change', '????? ?? ???', 'Oil', 1800.00),
('Diagnostic Scan', '???? ??? ??????', 'Service', 300.00),
('Labour (Hourly)', '????? (??????)', 'Service', 200.00);

-- ============================================
-- CLIENTS (Sample Data)
-- ============================================

INSERT INTO clients (full_name, email, phone, address, referral_source, notes) VALUES
('John Doe', 'john@example.com', '01012345678', '123 Main St, Cairo', 'Google', 'VIP Client'),
('Jane Smith', 'jane@example.com', '01298765432', '456 Nile Corniche, Giza', 'Facebook', 'Preferred customer');

-- ============================================
-- VEHICLES (Sample Data)
-- ============================================

INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, vin) VALUES
(1, 'John Doe', 'Toyota', 'Corolla', 2020, 'ABC-123', 'VIN1234567890'),
(2, 'Jane Smith', 'Hyundai', 'Elantra', 2019, 'XYZ-789', 'VIN0987654321');

-- ============================================
-- SERVICE REQUESTS (Sample Data)
-- ============================================

INSERT INTO service_requests (client_id, vehicle_id, client_name, vehicle_info, service_type, status, notes, mileage) VALUES
(1, 1, 'John Doe', 'Toyota Corolla 2020 (ABC-123)', 'Maintenance', 'Complete', 'Routine maintenance', 15000),
(2, 2, 'Jane Smith', 'Hyundai Elantra 2019 (XYZ-789)', 'Repair', 'Open', 'Brake noise', 25000);

-- ============================================
-- SERVICE RECORDS (Sample Data)
-- ============================================

-- For Request 1 (John)
INSERT INTO service_records (request_id, service_date, mileage, user_id, item_id, quantity, unit_price, total_price, notes) VALUES
(1, DATE('now', '-30 days'), 15000, 2, 1, 1, 1500.00, 1500.00, 'Oil change done'),
(1, DATE('now', '-30 days'), 15000, 2, 5, 1, 350.00, 350.00, 'Filter replaced');

-- ============================================
-- FINANCIAL TRANSACTIONS (Sample Data)
-- ============================================

INSERT INTO financial_transactions (request_id, invoice_number, total_amount_due, amount_paid, payment_status, payment_date, payment_method) VALUES
(1, 'INV-2024-001', 1850.00, 1850.00, 'Paid', DATE('now', '-30 days'), 'Cash');
