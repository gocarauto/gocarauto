/**
 * Example Controller
 * Logic separation for clean, token-efficient AI development.
 */
const exampleController = {
    /**
     * Handle basic data retrieval
     */
    getData: async (req, res) => {
        try {
            res.json({ success: true, message: 'HELLO_WORLD' });
        } catch (error) {
            res.status(500).json({ error: 'FAIL' });
        }
    }
};

export default exampleController;
