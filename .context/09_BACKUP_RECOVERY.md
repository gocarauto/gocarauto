# Backup & Recovery

## 1. Branching Flow
- `main`: Production-ready, stable code.
- `develop`: Pre-production integration branch.
- `feature/*`: Scoped feature development branches.
- `hotfix/*`: Emergency fixes branching from `main`.

## 2. Background Snapshot Rollbacks
- **Database Backups**: Automated nightly cron jobs utilizing `mysqldump` (for MySQL) or `sqlite3 .backup` command to create daily snapshots.
- **Retention Policy**: Retain daily snapshots for 7 days, weekly snapshots for 4 weeks, and monthly snapshots for 1 year.
- **File Storage**: Backups stored securely in an isolated volume/directory, potentially mirrored to cloud storage (e.g., AWS S3).

## 3. Incident Response Protocol
- In the event of data corruption, deployment scripts include a rollback procedure pointing the orchestration engine to the last known healthy container image and database snapshot.
