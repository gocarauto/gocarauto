import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import database from './database/db.js';
import routes from './routes/index.js';
import { verifyToken } from './middleware/auth.js';
import './scripts/cron.js'; // Initialize the cron jobs

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// GOCAR-SEC-03: Enable reverse proxy trust for proper IP extraction in rate limiting
app.set('trust proxy', 1);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : [])
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, origin || true);
        } else {
            callback(new Error('CORS: Origin not permitted'));
        }
    },
    credentials: true
}));

// HTTP Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// GOCAR-SEC-02: Private customer documents must require authenticated session and ownership check
app.get('/uploads/customer_documents/:filename', verifyToken, async (req, res) => {
    try {
        const safeFilename = path.basename(req.params.filename);
        const fileUrl = `/uploads/customer_documents/${safeFilename}`;

        const doc = await database.get('SELECT * FROM customer_documents WHERE file_url = ?', [fileUrl]);
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Must be document owner (customer) or staff member
        const isOwner = req.user.userType === 'customer' && doc.client_id === req.user.id;
        const isStaffUser = req.user.userType === 'staff' || ['Admin', 'Operator'].includes(req.user.role);

        if (!isOwner && !isStaffUser) {
            return res.status(403).json({ error: 'Access denied: Unauthorized to view this document' });
        }

        const storagePath = path.join(process.cwd(), 'storage/customer_documents', safeFilename);
        const legacyPath = path.join(__dirname, 'public/uploads/customer_documents', safeFilename);
        const targetPath = fs.existsSync(storagePath) ? storagePath : legacyPath;

        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ error: 'Document file not found' });
        }

        return res.sendFile(targetPath);
    } catch (error) {
        console.error('SERVER_DOC_ACCESS_ERROR:', error);
        res.status(500).json({ error: 'Failed to access document' });
    }
});

// Serve static uploaded public files (vehicles, misc, inspection photos)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Simple Request Logging (Centralized)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Centralized Route Mounting (Token-Optimized)
app.use('/api', routes);

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found', data: null });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER_FATAL_ERROR:', err);
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        data: null
    });
});

/**
 * System Startup Procedure
 * Ensures the database is healthy before accepting traffic.
 */
async function startServer() {
    try {
        await database.connect();
        console.log('Database connected successfully');

        const initialized = await database.isInitialized();

        if (!initialized) {
            console.log('Initializing database schema for first run...');
            await database.initSchema();
        }

        app.listen(PORT, () => {
            console.log(`\n🚀 GoCar Auto SFMS API Server running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
        });
    } catch (error) {
        console.error('SYSTEM_START_FAILED:', error);
        process.exit(1);
    }
}

// Graceful Shutdown Logic
process.on('SIGINT', async () => {
    console.log('\nGraceful shutdown signal received...');
    await database.close();
    process.exit(0);
});

startServer();

export default app;
