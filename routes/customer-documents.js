import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import documentController from '../controllers/customerDocumentController.js';
import { verifyToken, isCustomer } from '../middleware/auth.js';

const router = express.Router();

// GOCAR-SEC-02: Store private customer documents in non-public storage directory
const uploadDir = path.join(process.cwd(), 'storage/customer_documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// WHY: Safe local disk storage for customer documents (PDFs, registrations, licenses)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `doc-${unique}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
            return cb(new Error('Only PDF, JPG, PNG, and WEBP files are allowed!'), false);
        }
        cb(null, true);
    }
});

// GOCAR-SEC-05: Customer vault endpoints must strictly require customer role
router.use(verifyToken, isCustomer);

router.get('/', documentController.getAllDocuments);

// Allow both multipart/form-data file uploads and direct JSON (for external links / backwards compatibility)
router.post('/', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'File upload error' });
        }
        next();
    });
}, documentController.uploadDocument);

router.delete('/:id', documentController.deleteDocument);

export default router;
