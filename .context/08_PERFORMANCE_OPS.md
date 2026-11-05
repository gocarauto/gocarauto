# Performance Ops

## 1. Caching Layers
- **Database Level**: Indexes on frequently queried columns (e.g., `customer_id` on Vehicles, `vehicle_id` on Service Requests).
- **Application Level**: Future implementation of Redis for caching static lists (e.g., service item master lists) and session data to reduce DB load.

## 2. Frontend Optimization
- React/Vite builds utilizing code-splitting.
- Image assets compressed and served via CDN in production.

## 3. Automated CI/CD Configurations
- **Build Pipeline**: Docker images built automatically.
- **Testing**: Automated test suite (Jest/Supertest) runs on pull requests to the `main` branch.
- **Deployment**: Push to `main` triggers deployment scripts pulling latest Docker images to the production server (e.g., Namecheap VPS) and running `docker-compose up -d --build`.

## 4. Monitoring & Logging
- Output application logs to `server.log`, `backend.log`, and `system.log`.
- Log rotation to prevent disk space exhaustion.
