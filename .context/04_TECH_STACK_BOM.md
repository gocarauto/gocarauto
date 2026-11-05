# Tech Stack Bill of Materials (BOM)

## Core Infrastructure
- **Runtime**: Node.js (v18+)
- **Database**: SQLite3 (Development) / MySQL/PostgreSQL via `mysql2`/`pg` (Production)
- **Containerization**: Docker & Docker Compose (v20.10+)
- **Server Environment**: Linux (EndeavorOS/Ubuntu) & Nginx (Production reverse proxy)

## Backend Framework & Packages
- **Framework**: Express.js (`express^4.18.2`)
- **Security & Auth**: `jsonwebtoken^9.0.2`, `bcrypt^5.1.1`, `cors^2.8.5`
- **Data & Parsing**: `body-parser^1.20.2`, `multer^2.0.2` (Uploads), `csv-parse^6.1.0`
- **PDF Generation**: `pdfkit^0.13.0`
- **Bilingual Processing**: `arabic-reshaper^1.1.0`, `bidi-js^1.0.3`
- **Background Tasks**: `node-cron^4.2.1`
- **Notifications**: `nodemailer^6.9.7`, Twilio (SMS via external logic)
- **Environment**: `dotenv^16.3.1`

## Frontend Frameworks
- **Framework**: React.js 
- **Build Tool**: Vite
- **Styling**: Tailored CSS / CSS Modules (Adhering to Elite UI guidelines)

## Testing Frameworks
- **Unit/Integration**: Jest / Supertest (to be configured)
- **End-to-End**: Puppeteer (`puppeteer-core^24.37.5`) / Browser Subagent
