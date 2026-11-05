import fs from 'fs';
import path from 'path';
import database from '../database/db.js';

const documentController = {
    getAllDocuments: async (req, res) => {
        try {
            const clientId = req.user.id;
            const documents = await database.query(
                'SELECT * FROM customer_documents WHERE client_id = ? ORDER BY uploaded_at DESC',
                [clientId]
            );
            res.json({ success: true, data: documents });
        } catch (error) {
            console.error('DOCUMENT_FETCH_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch documents' });
        }
    },

    uploadDocument: async (req, res) => {
        try {
            const clientId = req.user.id;
            let { title, documentType, fileUrl } = req.body;

            // Handle file uploaded via multipart/form-data
            if (req.file) {
                fileUrl = `/uploads/customer_documents/${path.basename(req.file.filename)}`;
                if (!title) {
                    title = path.parse(req.file.originalname).name;
                }
            } else if (fileUrl) {
                // GOCAR-SEC-02: Sanitize fileUrl to prevent arbitrary local or remote file injection
                const isSafeUrl = fileUrl.startsWith('/uploads/customer_documents/') && !fileUrl.includes('..');
                if (!isSafeUrl) {
                    return res.status(400).json({ error: 'Invalid document file URL' });
                }
            }

            if (!title || !fileUrl) {
                return res.status(400).json({ error: 'Missing required fields: title and file are required' });
            }

            if (!documentType) {
                documentType = 'Other';
            }

            const result = await database.run(
                `INSERT INTO customer_documents (client_id, title, document_type, file_url)
                 VALUES (?, ?, ?, ?)`,
                [clientId, title, documentType, fileUrl]
            );

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                data: { id: result.id, title, documentType, fileUrl }
            });
        } catch (error) {
            console.error('DOCUMENT_UPLOAD_ERROR:', error);
            res.status(500).json({ error: 'Failed to upload document' });
        }
    },

    deleteDocument: async (req, res) => {
        try {
            const clientId = req.user.id;
            const docId = req.params.id;

            // Fetch document to safely clean up physical file if stored locally
            const doc = await database.get(
                'SELECT file_url FROM customer_documents WHERE id = ? AND client_id = ?',
                [docId, clientId]
            );

            if (!doc) {
                return res.status(404).json({ error: 'Document not found or unauthorized' });
            }

            await database.run(
                'DELETE FROM customer_documents WHERE id = ? AND client_id = ?',
                [docId, clientId]
            );

            // GOCAR-SEC-02: Clean up physical file securely without path traversal risk
            if (doc.file_url && doc.file_url.startsWith('/uploads/customer_documents/')) {
                const safeFilename = path.basename(doc.file_url);
                const storagePath = path.join(process.cwd(), 'storage/customer_documents', safeFilename);
                const legacyPath = path.join(process.cwd(), 'public/uploads/customer_documents', safeFilename);
                const targetPath = fs.existsSync(storagePath) ? storagePath : legacyPath;

                if (fs.existsSync(targetPath)) {
                    fs.unlink(targetPath, (err) => {
                        if (err && err.code !== 'ENOENT') {
                            console.warn('Could not delete physical document file:', err.message);
                        }
                    });
                }
            }

            res.json({ success: true, message: 'Document deleted successfully' });
        } catch (error) {
            console.error('DOCUMENT_DELETE_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete document' });
        }
    }
};

export default documentController;
