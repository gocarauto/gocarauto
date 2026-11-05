import express from 'express';
import multer from 'multer';
import path from 'path';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Configure Persistent Storage for Uploads
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = 'public/uploads/misc/';
        if (req.body.type === 'vehicle') dest = 'public/uploads/vehicles/';
        else if (req.body.type === 'service_request') dest = 'public/uploads/service_requests/';
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

/**
 * Handle Single Image Upload
 */
router.post('/', verifyToken, isStaff, upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const typeDir = req.body.type === 'vehicle' ? 'vehicles/' : (req.body.type === 'service_request' ? 'service_requests/' : 'misc/');
        const fileUrl = `/uploads/${typeDir}${req.file.filename}`;

        res.json({
            success: true,
            message: 'Uploaded successfully',
            data: { filename: req.file.filename, url: fileUrl }
        });
    } catch (error) {
        console.error('SERVER_UPLOAD_ERROR:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;
