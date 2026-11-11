# Database Performance, Audit & SQL Auto-Optimization Guide

## Overview
This document outlines the database auditing, fixing, cleaning, and performance enhancement strategy for **GoCar Auto SFMS**, designed in alignment with the [SQL Auto Optimization - Postgres/MySQL/MariaDB/Aurora GitHub Marketplace Application](https://github.com/marketplace/sql-auto-optimization-postgres-mysql-mariadb-aurora) (powered by EverSQL).

---

## 1. Audit Findings & Remediations

| Category | Issue Identified | Remediation Applied | Impact |
| :--- | :--- | :--- | :--- |
| **Index Gaps** | Customer searches by `phone` performed full table scans. | Added `idx_clients_phone` on `clients(phone)`. | Direct index seek on customer intake & portal login. |
| **Document Vault** | Document download by `file_url` triggered a full table scan on `customer_documents`. | Added `idx_customer_documents_file_url` on `customer_documents(file_url)`. | `O(1)` index lookup for all document downloads. |
| **Feed Sorting** | `service_requests` & `financial_transactions` feeds sorted by `request_date DESC` and `created_at DESC` caused disk/memory filesorts. | Added `idx_service_requests_request_date`, `idx_ft_created_at`, `idx_service_requests_client_date`. | Eliminated filesorts; data is retrieved in pre-indexed B-Tree order. |
| **Composite Filtering** | Reminders and Worklists filtered by status and sorted by dates (`(status, due_date)`, `(payment_status, payment_date)`). | Added composite indexes: `idx_service_reminders_status_due`, `idx_ft_status_date`, `idx_ft_status_created`. | Direct B-Tree range scan; zero residual row filtering. |
| **Referential Integrity** | `database/schema.mysql.sql` lacked formal `FOREIGN KEY` constraints on child tables. | Added comprehensive foreign key constraints (`ON DELETE CASCADE` / `SET NULL`) matching `database/schema.sql`. | Guarantees referential integrity without orphan records. |
| **Schema Parity Drift** | `service_items` in SQLite was missing `km_interval`, `month_interval`, and `tracking_point`. | Added missing columns to `database/schema.sql` matching MySQL. | Full parity across development (SQLite) and production (MySQL/MariaDB/Aurora/PostgreSQL). |
| **Cross-DB Portability** | SQLite-specific functions (`date('now')`, `strftime`) were used in cron jobs and reports without MySQL fallback. | Migrated cron to ANSI standard `CURRENT_DATE`; abstracted date aggregation in `reportController.js` via `formatDateSql()`. | Seamless cross-database execution on SQLite, MySQL, MariaDB, Aurora, and PostgreSQL. |
| **SQLite WAL Hygiene** | `init-db.js` unlinked the `.db` file without clearing stale `-wal` and `-shm` sidecars, causing `SQLITE_IOERR`. | Enhanced `init-db.js` to synchronously unlink stale `-wal` and `-shm` files on rebuild. | Eliminates database corruption risks during automated re-initialization. |

---

## 2. Complete Performance Index Catalog

### Clients
* `idx_clients_phone`: Fast lookup by mobile number.
* `idx_clients_join_date`: Chronological cohort analytics and retention reporting.
* `idx_clients_referred_by`: Referential attribution join.

### Vehicles
* `idx_vehicles_client`: Fast retrieval of client fleet.
* `idx_vehicles_license`: Unique license plate searches.
* `idx_vehicles_vin`: Vehicle pedigree and VIN lookup.
* `idx_vehicles_next_service_due`: Maintenance scanner and overdue queries.
* `idx_vehicles_client_make_model`: Sorted customer portal fleet display.

### Service Items
* `idx_service_items_category`: Filter by category and active status (`Parts`, `Oil`, `Service`).
* `idx_service_items_tracking`: Fast scanner lookup on `ENGINE_OIL`, `TRANS_OIL`.

### Service Requests
* `idx_service_requests_client`: Requests by customer.
* `idx_service_requests_vehicle`: Requests by vehicle history.
* `idx_service_requests_status`: Status filter for operations board.
* `idx_service_requests_scheduled_date`: Calendar view scheduling.
* `idx_service_requests_request_date`: Reverse-chronological timeline.
* `idx_service_requests_client_date`: Customer portal service history (`client_id + request_date DESC`).
* `idx_service_requests_vehicle_date`: Vehicle timeline (`vehicle_id + request_date DESC`).
* `idx_service_requests_status_date`: Active board sorting (`status + request_date DESC`).
* `idx_service_requests_assigned`: Technician assigned work queue (`assigned_to_id + status`).

### Service Records
* `idx_service_records_request`: Child items for request.
* `idx_service_records_item`: Master catalog item join.
* `idx_service_records_service_date`: Historical date-range reports.
* `idx_service_records_req_item`: Composite lookup for duplicate prevention and invoice calculation.
* `idx_service_records_user`: Technician labor attribution.

### Financial Transactions
* `idx_financial_transactions_request`: Invoices by service request.
* `idx_financial_transactions_invoice`: Invoice number lookup.
* `idx_financial_transactions_status`: Status filtering (`Paid`, `Pending`, `Partial`).
* `idx_financial_transactions_created_at`: Invoices feed reverse order.
* `idx_financial_transactions_status_date`: Revenue reports by status and payment date.
* `idx_financial_transactions_status_created`: Unpaid worklist sorted by age.

### Customer Documents
* `idx_customer_documents_client`: Documents by client ID.
* `idx_customer_documents_file_url`: Fast O(1) lookup on download.

### Service Reminders
* `idx_service_reminders_vehicle`: Reminders by vehicle.
* `idx_service_reminders_client`: Reminders by client.
* `idx_service_reminders_status`: Pending reminders list.
* `idx_service_reminders_status_due`: Daily cron dispatcher (`status = 'Pending' AND due_date <= CURRENT_DATE`).
* `idx_unique_pending_vehicle_service`: Unique pending reminder guard per vehicle + service type.

### Consignment Requests & Listings
* `idx_consignment_requests_client`: Inbound consignment requests by client.
* `idx_consignment_requests_vehicle`: Requests by vehicle.
* `idx_consignment_requests_status`: Status filter.
* `idx_consignment_requests_status_created`: Reverse-chronological intake queue.
* `idx_consignment_listings_status`: Marketplace listing stage.
* `idx_consignment_listings_vehicle`: Listing by vehicle.
* `idx_consignment_listings_client`: Listing by seller.
* `idx_consignment_listings_status_created`: Active listings feed.

### Notification Logs
* `idx_notification_logs_client`: Customer notification history.
* `idx_notification_logs_vehicle`: Vehicle notification audit trail.
* `idx_notification_logs_status_sent`: Dispatch status and timestamps.

---

## 3. Automated Performance Audit Tool

Run the automated performance audit anytime via:

```bash
npm run audit:db
```

This script (`scripts/audit-db-performance.js`) verifies:
1. Presence of all 46 critical performance indexes.
2. `EXPLAIN QUERY PLAN` verification on 15 core production workloads, verifying zero full table scans.
3. Foreign key referential integrity checks via `PRAGMA foreign_key_check`.
4. Schema parity verification between SQLite and MySQL/Postgres/Aurora.

---

## 4. GitHub Marketplace Integration (EverSQL)

This repository includes a dedicated GitHub Actions workflow:
- **`.github/workflows/sql-optimization.yml`**

It connects CI pull requests and pushes to:
* Automated schema linting and query plan verification.
* Integration hooks for the [SQL Auto Optimization - Postgres/MySQL/MariaDB/Aurora GitHub Marketplace App](https://github.com/marketplace/sql-auto-optimization-postgres-mysql-mariadb-aurora).

To enable direct automated PR comments from EverSQL:
1. Install the [SQL Auto Optimization GitHub App](https://github.com/marketplace/sql-auto-optimization-postgres-mysql-mariadb-aurora) on the repository.
2. If using EverSQL API tokens, add `EVERSQL_API_KEY` to repository secrets.

---

## 5. Releem Agent Integration & Memory Calculator

In addition to query and index tuning, database server memory and storage engine settings are audited and hardened following the [Releem Agent](https://github.com/Releem/releem-agent) specification for MySQL, MariaDB, and Percona Server.

### Engine Configuration (`config/mysql-tuned.cnf`)
* **InnoDB Buffer Pool**: Sized to 1GB (scalable up to 70% of dedicated server RAM) with 2 buffer pool instances to eliminate mutex bottlenecks.
* **Disk I/O & Flushing**: Configured with `innodb_flush_method = O_DIRECT` (preventing double buffering between InnoDB and the Linux page cache) and `innodb_flush_log_at_trx_commit = 2` for high write IOPS.
* **Connection & Thread Sizing**: `max_connections = 150`, `thread_cache_size = 16`, `table_open_cache = 4000`.
* **Telemetry & Query Tracking**: `slow_query_log = 1`, `log_queries_not_using_indexes = 1`, `performance_schema = ON`.

### SQLite Engine Pragmas (`database/db.js`)
* `PRAGMA synchronous = NORMAL`: Yields 3x write throughput in WAL mode while remaining completely crash-safe.
* `PRAGMA cache_size = -64000`: Allocates 64MB memory page cache.
* `PRAGMA temp_store = MEMORY`: Processes temporary tables and intermediate sorts in RAM.
* `PRAGMA mmap_size = 268435456`: Enables 256MB memory-mapped I/O.

### Automated Server Advisor Script
Audit database engine health and calculate peak memory usage anytime:

```bash
npm run audit:server
```

### Docker Compose with Releem Agent Sidecar
Launch the full production stack with MySQL and the Releem monitoring agent:

```bash
# Start MySQL with Releem tuned config and Releem agent
docker compose --profile full up -d
```

