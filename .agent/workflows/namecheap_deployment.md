---
description: Deploy GoCar Auto to Namecheap Shared Hosting
---

This workflow automates the build process and provides instructions for deploying to Namecheap shared hosting based on the `DEPLOYMENT.md` guidelines.

// turbo-all

1. Build the Staff Interface frontend
cd "staff-interface" && npm run build

2. Build the Customer Portal frontend
cd "customer-portal" && npm run build

3. Deploy the application to your Namecheap shared hosting via FTP/SFTP or cPanel File Manager according to Option 1 in `DEPLOYMENT.md`. (Upload `gocar-backend` to the home directory and the frontend `dist` folders to `public_html`).
