---
name: Deployment Manager
description: Guidelines and procedures for deploying GoCar Auto to production environments (Namecheap Shared/VPS, Docker).
---

# Deployment Manager Skill

This skill covers the end-to-end deployment process for GoCar Auto.

## Instructions

### 1. Frontend Build Process
- Run `npm run build` in both `staff-interface/` and `customer-portal/` directories.
- Verify that the `dist/` folder is generated correctly.

### 2. Namecheap Shared Hosting (cPanel)
- **Node.js App**: Configure "Setup Node.js App" in cPanel using `server.js` as the entry point.
- **Environment Variables**: Set `NODE_ENV=production`, `JWT_SECRET`, and `DB_TYPE` in the cPanel interface.
- **Frontend Routing**: Ensure `.htaccess` files are present in the frontend subdirectories to handle SPA routing.

### 3. VPS Deployment (Nginx + PM2)
- Use **PM2** to manage the backend process: `pm2 start server.js --name gocar-backend`.
- Configure **Nginx** as a reverse proxy for the backend and as a static file server for the frontends.
- Refer to `DEPLOYMENT.md` for specific Nginx configuration templates.

### 4. SSL/Security
- Always use HTTPS in production.
- Use Let's Encrypt (Certbot) for free SSL certificates on VPS.
