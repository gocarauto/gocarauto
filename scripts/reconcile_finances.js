import database from '../database/db.js';

/**
 * Financial Reconciliation
 * Recalculates all transaction totals based on the sum of service records + fees.
 */
async function reconcile() {
    try {
        console.log('--- STARTING FINANCIAL RECONCILIATION ---');
        await database.connect();

        const transactions = await database.query('SELECT * FROM financial_transactions');
        console.log(`Verifying ${transactions.length} transactions...`);

        for (const tx of transactions) {
            const records = await database.query('SELECT total_price FROM service_records WHERE request_id = ?', [tx.request_id]);
            const itemsSum = records.reduce((sum, r) => sum + parseFloat(r.total_price), 0);
            
            const serviceFee = parseFloat(tx.service_fee || 0);
            const markup = parseFloat(tx.spare_parts_markup || 0);
            const newTotal = itemsSum + serviceFee + markup;

            if (Math.abs(newTotal - tx.total_amount_due) > 0.01 || tx.tax_rate !== 0) {
                console.log(`RECONCILING REQ #${tx.request_id}: ${tx.total_amount_due} -> ${newTotal}`);
                await database.run(
                    'UPDATE financial_transactions SET total_amount_due = ?, tax_rate = 0.00, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [newTotal, tx.id]
                );
            }
        }

        console.log('--- RECONCILIATION COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('SERVER_RECONCILE_ERROR:', error);
        process.exit(1);
    }
}

reconcile();
