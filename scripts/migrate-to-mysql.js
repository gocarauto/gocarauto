import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';

const sqliteDb = new sqlite3.Database('database/gocar_auto.db');

function sqliteQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrate() {
  const tidbConn = await mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'xLLXdNdGnsJaRoN.root',
    password: 'YgZZMTCaarW3fqIg',
    database: 'gocar_auto',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  console.log('Connected to TiDB (gocar_auto). Beginning batch migration...');
  await tidbConn.query('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'users',
    'clients',
    'vehicles',
    'service_items',
    'service_requests',
    'service_records',
    'financial_transactions',
    'customer_documents',
    'service_reminders',
    'consignment_requests',
    'consignment_listings'
  ];

  for (const table of tables) {
    try {
      const rows = await sqliteQuery(`SELECT * FROM ${table}`);
      if (rows.length === 0) {
        console.log(`Table ${table}: 0 rows (skipped)`);
        continue;
      }

      console.log(`Migrating ${table}: ${rows.length} rows...`);
      await tidbConn.query(`DELETE FROM ${table};`);

      const columns = Object.keys(rows[0]);
      const chunkSize = 100;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const rowPlaceholders = `(${columns.map(() => '?').join(', ')})`;
        const allPlaceholders = chunk.map(() => rowPlaceholders).join(', ');
        const insertSql = `INSERT INTO ${table} (\`${columns.join('`, `')}\`) VALUES ${allPlaceholders}`;

        const flatValues = [];
        for (const row of chunk) {
          for (const col of columns) {
            const val = row[col];
            flatValues.push(val === undefined ? null : val);
          }
        }

        await tidbConn.execute(insertSql, flatValues);
      }

      console.log(`✓ Table ${table} successfully migrated!`);
    } catch (err) {
      console.warn(`Notice on table ${table}:`, err.message);
    }
  }

  await tidbConn.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('\n--- TiDB Cloud Migration Summary ---');

  for (const table of tables) {
    try {
      const [countResult] = await tidbConn.query(`SELECT COUNT(*) as cnt FROM ${table}`);
      console.log(`✓ ${table}: ${countResult[0].cnt} records`);
    } catch (e) {
      // ignore
    }
  }

  await tidbConn.end();
  sqliteDb.close();
}

migrate().catch(console.error);
