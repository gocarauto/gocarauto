import database from '../database/db.js';

const commentsController = {
    /**
     * Get all comments for a specific service request.
     */
    getComments: async (req, res) => {
        try {
            const comments = await database.query(
                'SELECT * FROM service_request_comments WHERE request_id = ? ORDER BY created_at ASC',
                [req.params.id]
            );
            res.json({ success: true, data: comments || [] });
        } catch (error) {
            console.warn('SERVER_COMMENTS_WARNING:', error.message);
            res.json({ success: true, data: [] });
        }
    },

    /**
     * Add a new comment to a service request.
     */
    addComment: async (req, res) => {
        try {
            const { content } = req.body;
            const author = req.user?.name || req.body.authorName || 'Staff Member';

            if (!content || !content.trim()) {
                return res.status(400).json({ error: 'Comment content is required' });
            }

            const result = await database.run(
                'INSERT INTO service_request_comments (request_id, author_name, content) VALUES (?, ?, ?)',
                [req.params.id, author, content.trim()]
            );

            // Fetch the newly created comment to return it
            const newComment = await database.get(
                'SELECT * FROM service_request_comments WHERE id = ?',
                [result.id]
            );

            res.status(201).json({ success: true, message: 'Comment added', data: newComment });
        } catch (error) {
            console.error('SERVER_COMMENTS_ERROR:', error);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    }
};

export default commentsController;
