# GoCar Auto - Deployment Runbook

> **ValdoZ Phase 8: Deploy Runbook**  
> **Status:** Production Architecture & Blueprint  
> **Cost Profile:** $0.00 / month (100% Free Tier Cloud Stack)

---

## Environments

### Zero-Cost Cloud Provider Matrix

| Tier | Environment | Provider | Hardware / Quota | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Edge DNS & CDN** | Production / Staging | Cloudflare | Unlimited bandwidth, Anycast edge, SSL | DDoS protection, SSL termination, global caching |
| **Customer Portal** | Production | Vercel | 100GB bandwidth, Global Edge Network | Client-side React 19 SPA (`customer-portal/dist`) |
| **Staff Interface** | Production | Vercel | 100GB bandwidth, Global Edge Network | Staff dashboard React 19 SPA (`staff-interface/dist`) |
| **Backend API** | Production | Render.com | 512MB RAM, 0.1 vCPU, 750 free hrs/mo | Express Node.js API with Puppeteer Chromium Docker container |
| **Primary Database** | Production | TiDB Cloud Serverless | 5GB storage, 50M RU/mo, TLS 1.2+ | Managed MySQL 8.0 wire-compatible relational database |
| **Asset Storage** | Production | Cloudflare R2 | 10GB storage, 1M writes/mo, $0 egress | Invoices, customer uploaded documents, inspection photos |
| **Keep-Alive Ping** | Production Monitoring | cron-job.org / UptimeRobot | Free 5-10 minute interval HTTP ping | Prevents Render free container from idling/sleeping |

### Secrets and Environment Configuration

#### Backend API (`.env.production`)
- `NODE_ENV`: `production`
- `PORT`: `3000` (automatically mapped by container host)
- `DB_TYPE`: `mysql`
- `DB_HOST`: Host from TiDB cluster (e.g. `gateway01.eu-central-1.prod.aws.tidbcloud.com`)
- `DB_PORT`: `4000`
- `DB_USER`: Username from TiDB cluster console
- `DB_PASSWORD`: Strong generated database user password
- `DB_NAME`: `gocar_auto` or default database
- `DB_SSL`: `true` (enforces TLS 1.2+ encryption with TiDB)
- `JWT_SECRET`: Minimum 64-character random hex string for authentication sessions
- `JWT_EXPIRES_IN`: `7d`
- `CORS_ORIGIN`: Comma-separated list of frontends (e.g. `https://gocarauto.vercel.app,https://gocarauto-3kpg.vercel.app`)
- `CUSTOMER_PORTAL_URL`: Base customer portal origin for magic link generation
- `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/chromium`

#### Frontend Applications (`.env.production`)
- `VITE_API_URL`: Backend public API base URL (e.g. `SERVER_URL/api`)

---

## Deployment Steps

### Phase A: Database Provisioning (TiDB Cloud Serverless)
1. Sign up at [TiDB Cloud](https://tidbcloud.com) (No credit card required).
2. Select **Create Cluster** -> **Serverless** -> Region (Frankfurt `eu-central-1` recommended for Middle East / Europe low latency).
3. Under cluster **Connect** tab:
   - Copy connection details: Host, Port (`4000`), User, and generate Password.
4. Schema initialization:
   - Import `database/schema.mysql.sql` using TiDB Web Console SQL Editor, or let GoCar backend auto-initialize tables on first startup via `database.isInitialized()`.

### Phase B: Backend API Service Deployment (Render.com)
1. Sign up at [Render](https://render.com).
2. Click **New +** -> **Web Service** and connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `gocar-backend`
   - **Environment:** `Docker` (points to root `./Dockerfile`)
   - **Branch:** `main`
   - **Plan:** `Free`
   - **Health Check Path:** `/api/health`
4. Add all environment variables from the Secrets matrix above in the Render Dashboard.
5. Deploy the service. Verify deployment logs show:
   - Chromium installed successfully.
   - `Connected to MySQL database`.
   - `GoCar Auto SFMS API Server running on port 3000`.

### Phase C: Keep-Alive Ping Setup
1. Create a free account at [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com).
2. Configure an HTTP monitor targeting `BACKEND_URL/api/health`.
3. Set the interval to **every 10 minutes**.
4. This ensures Render's free tier remains permanently warm with 0 cold-start delays for end users.

### Phase D: Customer Portal Frontend (Vercel)
1. Sign in to [Vercel Dashboard](https://vercel.com) -> **Add New...** -> **Project**.
2. Connect your Git repository.
3. Configure the build parameters:
   - **Project Name:** `gocarauto` (e.g. `https://gocarauto.vercel.app`)
   - **Framework Preset:** `Vite`
   - **Root Directory:** `customer-portal`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In Environment Variables:
   - Set `VITE_API_URL` to `BACKEND_URL/api` (e.g. `https://gocar-backend-crtx.onrender.com/api`).
5. Deploy. SPA client routing is preserved via `customer-portal/vercel.json`.

### Phase E: Staff Interface Frontend (Vercel)
1. In Vercel, click **Add New...** -> **Project**.
2. Connect the same Git repository.
3. Configure the build parameters:
   - **Project Name:** `gocarauto-3kpg` (or your chosen project name)
   - **Framework Preset:** `Vite`
   - **Root Directory:** `staff-interface`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In Environment Variables:
   - Set `VITE_API_URL` to `BACKEND_URL/api` (e.g. `https://gocar-backend-crtx.onrender.com/api`).
5. Deploy. SPA client routing is preserved via `staff-interface/vercel.json`.

---

## Liveness Proof

To verify complete end-to-end operational health, execute the following smoke verification sequence:

### 1. API Health Check
```bash
curl -i "$BACKEND_URL/api/health"
```
**Expected Output:**
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"OK","timestamp":"2026-11-05T12:00:00.000Z"}
```

### 2. CORS Policy Verification
```bash
curl -i -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: $PORTAL_ORIGIN" \
  -H "Access-Control-Request-Method: GET"
```
**Expected Output:**
```
Access-Control-Allow-Origin: $PORTAL_ORIGIN
Access-Control-Allow-Credentials: true
```

### 3. Customer Portal SPA Hard Refresh Test
```bash
curl -sI "$PORTAL_ORIGIN/login"
```
**Expected Output:**
```
HTTP/2 200
```
*(Verifies `vercel.json` rewrote non-static route to `/index.html` instead of HTTP 404)*

### 4. Staff Interface SPA Hard Refresh Test
```bash
curl -sI "$STAFF_ORIGIN/dashboard"
```
**Expected Output:**
```
HTTP/2 200
```

---

## Rollback Plan

### Instant Edge Frontend Rollback
1. If a frontend regression occurs, open the Vercel dashboard for `gocarauto` or `gocarauto-3kpg`.
2. Navigate to the **Deployments** tab.
3. Identify the last verified stable build and click **Instant Rollback**.
4. The edge CDN instantly routes all traffic to the prior build with zero downtime (< 3 seconds propagation).

### Backend API Rollback
1. In the Render Dashboard, navigate to the `gocar-backend` service -> **Deploys**.
2. Click on the commit hash of the previous stable deployment.
3. Click **Rollback to this deploy**. Render immediately redeploys the previous Docker image.

### Database Snapshot Restoration
1. TiDB Cloud Serverless maintains automated continuous daily snapshots with 7 days Point-in-Time Recovery (PITR) at zero cost.
2. In the TiDB Cloud Console -> **Backups & Restore**, select the desired point in time before the event and restore.
