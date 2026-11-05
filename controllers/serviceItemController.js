import database from '../database/db.js';

/**
 * Service Item Controller
 * Manages the canonical list of services, parts, and labor operations.
 */
const serviceItemController = {
    /**
     * Retrieve all items in the service catalog with filtering.
     */
    getAllItems: async (req, res) => {
        try {
            const { category, active } = req.query;

            let query = 'SELECT * FROM service_items WHERE 1=1';
            const params = [];

            if (category) { query += ' AND category = ?'; params.push(category); }
            if (active !== undefined) { query += ' AND is_active = ?'; params.push(active === 'true' ? 1 : 0); }

            query += ' ORDER BY category, item_name';

            const items = await database.query(query, params);
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('SERVER_CATALOG_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch catalog' });
        }
    },

    /**
     * Get details of a specific service item.
     */
    getItemById: async (req, res) => {
        try {
            const item = await database.get('SELECT * FROM service_items WHERE id = ?', [req.params.id]);

            if (!item) return res.status(404).json({ error: 'Item not found' });
            res.json({ success: true, data: item });
        } catch (error) {
            console.error('SERVER_CATALOG_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch item' });
        }
    },

    /**
     * Register a new service or part in the catalog.
     */
    createItem: async (req, res) => {
        try {
            const { itemName, itemNameAr, category, salePrice } = req.body;

            // Protocol: itemName is primary, itemNameAr is secondary but mandatory in schema
            const name = itemName || itemNameAr;
            const nameAr = itemNameAr || itemName;

            if (!name || !category || salePrice === undefined) {
                return res.status(400).json({ error: 'Item name, category, and price required' });
            }

            const result = await database.run(
                `INSERT INTO service_items (item_name, item_name_ar, category, sale_price)
                 VALUES (?, ?, ?, ?)`,
                [name, nameAr, category, salePrice]
            );

            res.status(201).json({ success: true, data: { id: result.id } });
        } catch (error) {
            console.error('SERVER_CATALOG_ERROR:', error);
            res.status(500).json({ error: 'Failed to create catalog item' });
        }
    },

    /**
     * Update an existing catalog item.
     */
    updateItem: async (req, res) => {
        try {
            const { itemName, itemNameAr, category, salePrice, isActive } = req.body;

            const result = await database.run(
                `UPDATE service_items 
                 SET item_name = ?, item_name_ar = ?, category = ?, sale_price = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [itemName, itemNameAr, category, salePrice, isActive ? 1 : 0, req.params.id]
            );

            if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
            res.json({ success: true, message: 'Item updated' });
        } catch (error) {
            console.error('SERVER_CATALOG_ERROR:', error);
            res.status(500).json({ error: 'Failed to update catalog item' });
        }
    },

    /**
     * Bulk ensure or create catalog items (prevents duplicate catalog bloat & reduces N HTTP requests to 1)
     */
    bulkCreateOrEnsure: async (req, res) => {
        try {
            const { items } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Items array is required' });
            }

            const results = [];
            for (const item of items) {
                const name = (item.itemName || item.itemNameAr || '').trim();
                const nameAr = (item.itemNameAr || item.itemName || '').trim();
                if (!name) continue;

                const category = item.category || 'Service';
                const price = parseFloat(item.salePrice !== undefined ? item.salePrice : item.unitPrice) || 0;

                // Check if exact item exists in catalog
                const existing = await database.get(
                    'SELECT id FROM service_items WHERE item_name = ? OR item_name_ar = ? LIMIT 1',
                    [name, nameAr]
                );

                let itemId = existing?.id;
                if (!itemId) {
                    const insertResult = await database.run(
                        `INSERT INTO service_items (item_name, item_name_ar, category, sale_price)
                         VALUES (?, ?, ?, ?)`,
                        [name, nameAr, category, price]
                    );
                    itemId = insertResult.id;
                }

                results.push({
                    itemId,
                    itemName: name,
                    quantity: parseFloat(item.quantity) || 1,
                    unitPrice: price,
                    notes: item.notes || ''
                });
            }

            res.json({ success: true, data: results });
        } catch (error) {
            console.error('SERVER_CATALOG_BULK_ERROR:', error);
            res.status(500).json({ error: 'Failed to process bulk items' });
        }
    }
};

export default serviceItemController;
