---
name: Database Management
description: Procedures for managing the GoCar Auto SQLite/MySQL database, migrations, and schema design.
---

# Database Management Skill

This skill provides instructions for interacting with the GoCar Auto database system, which supports both SQLite (dev) and MySQL/PostgreSQL (prod).

## Instructions

### 1. Schema Modifications
- **Sequelize Models**: All schema changes should be reflected in the model definitions at `database/models/` (if using Sequelize) or documented in `database/SCHEMA.md`.
- **Primary Keys**: Ensure all tables have a consistent primary key naming convention (usually `id`).
- **Foreign Keys**: Always define relationships explicitly to maintain referential integrity.

### 2. Data Ingestion & Seeding
- Use the `/database_seeding` workflow to import CSV data.
- Ensure CSV headers match the database column names exactly.

### 3. Querying Standards
- **Parameterized Queries**: Never use string concatenation for queries. Always use placeholders to prevent SQL injection.
- **Efficient Joins**: Optimize queries by selecting only required columns and using proper indexes.

### 4. Database Switching
- The system uses `DB_TYPE` in `.env` to switch adapters. 
- When adding new features, verify compatibility for both `sqlite` and `mysql`.
