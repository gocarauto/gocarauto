#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { getVehicleSketch } from '../customer-portal/src/utils/sketchHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/gocar_auto.db');
const customerPublic = path.resolve(__dirname, '../customer-portal/public');
const staffPublic = path.resolve(__dirname, '../staff-interface/public');

const dbJson = JSON.parse(
    execSync(`sqlite3 -json "${dbPath}" "SELECT id, make, model, year, license_plate FROM vehicles ORDER BY make, model, year;"`).toString()
);

console.log(`\n======================================================`);
console.log(`       GOCAR AUTO - FLEET SKETCH VERIFICATION         `);
console.log(`======================================================`);
console.log(`Testing all ${dbJson.length} registered fleet vehicles in database...\n`);

let passed = 0;
let failed = 0;

const genericSketches = new Set([
    '/sketches/generic-car.webp',
    '/sketches/sedan.webp',
    '/sketches/suv.webp',
    '/sketches/van.webp',
    '/sketches/hatchback.webp',
    '/sketches/coupe.webp'
]);

for (const v of dbJson) {
    const sketchUrl = getVehicleSketch(v.make, v.model, v.year);
    const customerFile = path.join(customerPublic, sketchUrl);
    const staffFile = path.join(staffPublic, sketchUrl);

    const existsCustomer = fs.existsSync(customerFile);
    const existsStaff = fs.existsSync(staffFile);
    const isSpecific = !genericSketches.has(sketchUrl);

    if (existsCustomer && existsStaff && isSpecific) {
        passed++;
        console.log(`✓ [${v.make} ${v.model} (${v.year})] -> ${sketchUrl}`);
    } else {
        failed++;
        console.error(`✗ [${v.make} ${v.model} (${v.year})] FAILED:`);
        console.error(`    Resolved URL: ${sketchUrl}`);
        console.error(`    Customer exists: ${existsCustomer}`);
        console.error(`    Staff exists: ${existsStaff}`);
        console.error(`    Specific model match: ${isSpecific}`);
    }
}

console.log(`\n------------------------------------------------------`);
console.log(`Verification Summary:`);
console.log(`Total Vehicles: ${dbJson.length}`);
console.log(`Specific Matches: ${passed}/${dbJson.length} (${((passed/dbJson.length)*100).toFixed(1)}%)`);
console.log(`Failed / Fallbacks: ${failed}`);
console.log(`------------------------------------------------------\n`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log(`SUCCESS: 100% of fleet vehicles resolve to exact, optimized technical sketches!`);
    process.exit(0);
}
