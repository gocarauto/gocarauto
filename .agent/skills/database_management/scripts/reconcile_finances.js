const database = require('../database/db');

async function reconcile() {
    try {
        console.log('--- STARTING FINANCIAL RECONCILIATION ---');
        await database.connect();

        // 1. Get all transactions
        const transactions = await database.query('SELECT * FROM financial_transactions');
        console.log(`Found ${transactions.length} transactions to verify.`);

        for (const tx of transactions) {
            // 2. Calculate sum of service records for this request
            const records = await database.query('SELECT total_price FROM service_records WHERE request_id = ?', [tx.request_id]);
            const itemsSum = records.reduce((sum, r) => sum + parseFloat(r.total_price), 0);

            const serviceFee = parseFloat(tx.service_fee || 0);
            const markup = parseFloat(tx.spare_parts_markup || 0);

            // 3. Calculate new total (0% tax)
            const newTotal = itemsSum + serviceFee + markup;

            // 4. Update if different or tax_rate is not 0
            if (Math.abs(newTotal - tx.total_amount_due) > 0.01 || tx.tax_rate !== 0) {
                console.log(`RECONCILING REQ #${String(tx.request_id).padStart(5, '0')}:`);
                console.log(`  Old Total: ${tx.total_amount_due} (Tax: ${tx.tax_rate}%)`);
                console.log(`  New Total: ${newTotal} (Sum: ${itemsSum} + Fees: ${serviceFee + markup})`);

                await database.run(
                    'UPDATE financial_transactions SET total_amount_due = ?, tax_rate = 0.00, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [newTotal, tx.id]
                );
            }
        }

        console.log('--- RECONCILIATION COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('Reconciliation failed:', error);
        process.exit(1);
    }
}

reconcile();
