---
description: Seed the SQLite database with CSV data
---

This workflow provides instructions on how to seed the GoCar Auto SQLite database using the provided CSV files.

1. Create or identify a Node.js script to parse the provided `CSV` files in the project root.
2. Read the CSV data and insert the records into the appropriate tables in the SQLite database (`/home/akhalil/AntiGravity/GoCar Auto/database/gocar_auto.db`).
3. Run the seeding script.
// turbo
node scripts/seed-from-csv.js
