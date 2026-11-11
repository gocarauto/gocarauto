#!/usr/bin/env node
/**
 * GoCar Auto - Database Server & Memory Performance Advisor
 * Inspired by Releem Agent (https://github.com/Releem/releem-agent)
 * & Releem MySQL Memory Calculator.
 *
 * Audits:
 * 1. Storage Engine Memory Allocations & Buffer Pool Sizing
 * 2. Per-thread Buffers vs Concurrency (OOM Risk Detection)
 * 3. Disk I/O, Journaling & Flush Durability Configurations
 * 4. Engine Health Pragmas (SQLite) & Performance Schema (MySQL)
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import database from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function runAdvisor() {
    console.log('='.repeat(72));
    console.log('   Releem Database Performance Advisor (GoCar Auto SFMS)');
    console.log('   Inspired by Releem Agent & MySQL Memory Calculator');
    console.log('='.repeat(72));

    const totalHostRam = os.totalmem();
    const freeHostRam = os.freemem();
    const cpuCount = os.cpus().length;

    console.log(`\nHost Environment:`);
    console.log(`  - CPU Cores:      ${cpuCount}`);
    console.log(`  - Total RAM:      ${formatBytes(totalHostRam)}`);
    console.log(`  - Available RAM:  ${formatBytes(freeHostRam)}`);
    console.log(`  - Active DB Mode: ${process.env.DB_TYPE || 'sqlite'}`);

    let healthScore = 100;
    const recommendations = [];

    await database.connect();

    if ((process.env.DB_TYPE || 'sqlite') === 'sqlite') {
        console.log('\n[1/3] Auditing SQLite Storage Engine & Memory Pragmas...');

        // 1. Journal Mode
        const [jm] = await database.query('PRAGMA journal_mode');
        const journalMode = (jm.journal_mode || '').toUpperCase();
        if (journalMode === 'WAL') {
            console.log(`  ✓ journal_mode:       WAL (Write-Ahead Logging enabled)`);
        } else {
            console.log(`  ✗ journal_mode:       ${journalMode} (Should be WAL)`);
            healthScore -= 20;
            recommendations.push('Set PRAGMA journal_mode = WAL to prevent read/write concurrency locks.');
        }

        // 2. Synchronous Mode
        const [syncRow] = await database.query('PRAGMA synchronous');
        const syncVal = Number(syncRow.synchronous);
        if (syncVal === 1) {
            console.log(`  ✓ synchronous:        NORMAL (1) - Optimal performance with crash-safety in WAL`);
        } else if (syncVal === 2) {
            console.log(`  ! synchronous:        FULL (2) - Safe but introduces redundant disk syncs`);
            recommendations.push('Set PRAGMA synchronous = NORMAL for ~3x write speedup in WAL mode.');
        } else {
            console.log(`  ✗ synchronous:        ${syncVal} (Unsafe)`);
            healthScore -= 15;
        }

        // 3. Cache Size
        const [cacheRow] = await database.query('PRAGMA cache_size');
        const cacheVal = Number(cacheRow.cache_size);
        const cacheBytes = cacheVal < 0 ? Math.abs(cacheVal) * 1024 : cacheVal * 4096;
        if (cacheBytes >= 16 * 1024 * 1024) {
            console.log(`  ✓ cache_size:         ${formatBytes(cacheBytes)} in-memory page cache`);
        } else {
            console.log(`  ! cache_size:         ${formatBytes(cacheBytes)} (Sub-optimal, default 2MB)`);
            healthScore -= 10;
            recommendations.push('Increase PRAGMA cache_size = -64000 (64MB) to keep hot pages in RAM.');
        }

        // 4. Temp Store
        const [tempStoreRow] = await database.query('PRAGMA temp_store');
        const tempStoreVal = Number(tempStoreRow.temp_store);
        if (tempStoreVal === 2) {
            console.log(`  ✓ temp_store:         MEMORY (In-memory transient sorting & aggregation)`);
        } else {
            console.log(`  ! temp_store:         ${tempStoreVal} (Disk fallback)`);
            healthScore -= 10;
            recommendations.push('Set PRAGMA temp_store = MEMORY to avoid disk I/O on temp tables.');
        }

        // 5. Memory-Mapped I/O (mmap_size)
        const [mmapRow] = await database.query('PRAGMA mmap_size');
        const mmapBytes = Number(mmapRow.mmap_size);
        if (mmapBytes >= 64 * 1024 * 1024) {
            console.log(`  ✓ mmap_size:          ${formatBytes(mmapBytes)} memory-mapped I/O window`);
        } else {
            console.log(`  ! mmap_size:          ${formatBytes(mmapBytes)} (Zero/Low MMAP)`);
            healthScore -= 10;
            recommendations.push('Set PRAGMA mmap_size = 268435456 (256MB) for direct kernel page mapping.');
        }

        // 6. Foreign Keys
        const [fkRow] = await database.query('PRAGMA foreign_keys');
        if (Number(fkRow.foreign_keys) === 1) {
            console.log(`  ✓ foreign_keys:       ON (Referential integrity enforced)`);
        } else {
            console.log(`  ✗ foreign_keys:       OFF (Integrity risk)`);
            healthScore -= 25;
            recommendations.push('Set PRAGMA foreign_keys = ON.');
        }

        // 7. Fragmentation & Freelist Analysis
        console.log('\n[2/3] Analyzing Storage Fragmentation & Freelist...');
        const [freelistRow] = await database.query('PRAGMA freelist_count');
        const [pageCountRow] = await database.query('PRAGMA page_count');
        const [pageSizeRow] = await database.query('PRAGMA page_size');

        const freelistCount = Number(freelistRow.freelist_count);
        const pageCount = Number(pageCountRow.page_count);
        const pageSize = Number(pageSizeRow.page_size);
        const dbFileSize = pageCount * pageSize;
        const wastedBytes = freelistCount * pageSize;
        const fragmentationPct = pageCount > 0 ? ((freelistCount / pageCount) * 100).toFixed(2) : 0;

        console.log(`  - Database File Size: ${formatBytes(dbFileSize)}`);
        console.log(`  - Active Pages:       ${pageCount} (${pageSize} bytes/page)`);
        console.log(`  - Free Pages:         ${freelistCount} (${formatBytes(wastedBytes)})`);
        console.log(`  - Fragmentation:      ${fragmentationPct}%`);

        if (parseFloat(fragmentationPct) > 15) {
            console.log(`  ! High fragmentation detected (${fragmentationPct}%). Reclaiming free pages...`);
            await database.run('VACUUM');
            console.log(`  ✓ Database VACUUM complete. Pages defragmented.`);
        } else {
            console.log(`  ✓ Storage density healthy (Fragmentation < 15%).`);
        }

    } else {
        console.log('\n[1/3] Auditing MySQL / MariaDB Server Variables & Metrics...');
        // MySQL live connection audit
        try {
            const variables = await database.query("SHOW VARIABLES WHERE Variable_name IN ('innodb_buffer_pool_size', 'max_connections', 'sort_buffer_size', 'join_buffer_size', 'read_buffer_size', 'innodb_flush_log_at_trx_commit', 'slow_query_log')");
            for (const v of variables) {
                console.log(`  - ${v.Variable_name}: ${v.Value}`);
            }
        } catch (e) {
            console.log(`  (Could not query live MySQL variables: ${e.message})`);
        }
    }

    // 3. Releem MySQL Configuration Profile Audit (config/mysql-tuned.cnf)
    console.log('\n[3/3] Auditing Releem Production Server Configuration (config/mysql-tuned.cnf)...');
    const cnfPath = path.join(__dirname, '../config/mysql-tuned.cnf');
    if (fs.existsSync(cnfPath)) {
        console.log(`  ✓ Found Releem configuration: ${path.relative(process.cwd(), cnfPath)}`);
        const cnfContent = fs.readFileSync(cnfPath, 'utf8');

        // Extract key parameters
        const getVal = (key) => {
            const m = cnfContent.match(new RegExp(`^\\s*${key}\\s*=\\s*([^#\\r\\n]+)`, 'm'));
            return m ? m[1].trim() : null;
        };

        const parseBytes = (str) => {
            if (!str) return 0;
            const unit = str.slice(-1).toUpperCase();
            const val = parseFloat(str);
            if (unit === 'G') return val * 1024 * 1024 * 1024;
            if (unit === 'M') return val * 1024 * 1024;
            if (unit === 'K') return val * 1024;
            return val;
        };

        const bufferPool = getVal('innodb_buffer_pool_size');
        const maxConns = parseInt(getVal('max_connections') || '151', 10);
        const sortBuf = parseBytes(getVal('sort_buffer_size') || '2M');
        const joinBuf = parseBytes(getVal('join_buffer_size') || '2M');
        const readBuf = parseBytes(getVal('read_buffer_size') || '1M');
        const readRndBuf = parseBytes(getVal('read_rnd_buffer_size') || '2M');
        const threadStack = parseBytes(getVal('thread_stack') || '256K');

        const perThread = sortBuf + joinBuf + readBuf + readRndBuf + threadStack;
        const globalBuffers = parseBytes(bufferPool) + parseBytes(getVal('innodb_log_buffer_size') || '16M');
        const maxTotalMem = globalBuffers + (maxConns * perThread);

        console.log(`  - Configured Buffer Pool:    ${bufferPool}`);
        console.log(`  - Max Connections:           ${maxConns}`);
        console.log(`  - Peak Per-Thread Memory:    ${formatBytes(perThread)}/thread`);
        console.log(`  - Calculated Max Memory:     ${formatBytes(maxTotalMem)}`);

        if (maxTotalMem > totalHostRam) {
            console.log(`  ! Warning: Potential OOM if all ${maxConns} connections simultaneously allocate max buffers.`);
            recommendations.push('Lower max_connections or per-thread buffers if deploying to an instance with < ' + formatBytes(maxTotalMem));
        } else {
            console.log(`  ✓ Peak MySQL memory footprint (${formatBytes(maxTotalMem)}) safely fits within host RAM (${formatBytes(totalHostRam)}).`);
        }

        const flushCommit = getVal('innodb_flush_log_at_trx_commit');
        const flushMethod = getVal('innodb_flush_method');
        const slowLog = getVal('slow_query_log');
        const perfSchema = getVal('performance_schema');

        console.log(`  - innodb_flush_method:        ${flushMethod || 'default'}`);
        console.log(`  - flush_log_at_trx_commit:    ${flushCommit}`);
        console.log(`  - slow_query_log:             ${slowLog === '1' ? 'ENABLED' : 'DISABLED'}`);
        console.log(`  - performance_schema:         ${perfSchema}`);

        if (flushCommit === '2') {
            console.log(`  ✓ Write IOPS optimized (flush_log_at_trx_commit = 2)`);
        }
        if (flushMethod === 'O_DIRECT') {
            console.log(`  ✓ Double buffering avoided (innodb_flush_method = O_DIRECT)`);
        }
        if (slowLog === '1') {
            console.log(`  ✓ Slow query diagnostics enabled for Releem telemetry`);
        }
    } else {
        console.log(`  ✗ Missing config/mysql-tuned.cnf configuration file.`);
        healthScore -= 20;
    }

    console.log('\n' + '='.repeat(72));
    console.log(`  Releem Performance & Memory Health Score: ${Math.max(0, healthScore)}/100`);
    if (recommendations.length > 0) {
        console.log('\n  Actionable Tuning Recommendations:');
        recommendations.forEach((r, idx) => console.log(`   ${idx + 1}. ${r}`));
    } else {
        console.log('  Status: EXCELLENT — Database engine and memory allocations are optimal!');
    }
    console.log('='.repeat(72) + '\n');

    await database.close();
    process.exit(healthScore >= 80 ? 0 : 1);
}

runAdvisor().catch(err => {
    console.error('Advisor execution error:', err);
    process.exit(1);
});
