import puppeteer from 'puppeteer-core';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let globalBrowser = null;
async function getBrowser() {
    if (!globalBrowser) {
        const candidates = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/home/akhalil/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
            '/home/akhalil/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
            '/usr/bin/chromium',
            '/usr/bin/google-chrome'
        ].filter(Boolean);

        const executablePath = candidates.find(p => existsSync(p)) || '/usr/bin/chromium';

        globalBrowser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        globalBrowser.on('disconnected', () => { globalBrowser = null; });
    }
    return globalBrowser;
}

export async function closePDFBrowser() {
    if (globalBrowser) {
        await globalBrowser.close();
        globalBrowser = null;
    }
}

/**
 * Generate a professional PDF invoice for a service transaction.
 * @param {Object} data - Transaction, customer, and record data.
 * @returns {Buffer} - PDF binary buffer.
 */
export async function generateInvoicePDF(data) {
    const { transaction, customer, records } = data;

    const logoPath = path.join(__dirname, '../public/logo.png');
    const logoBase64 = existsSync(logoPath) ? `data:image/png;base64,${(await fs.readFile(logoPath)).toString('base64')}` : '';

    const fontPath = path.join(__dirname, 'Arabic.ttf');
    const fontBoldPath = path.join(__dirname, 'Arabic-Bold.ttf');
    const fontBase64 = existsSync(fontPath) ? (await fs.readFile(fontPath)).toString('base64') : '';
    const fontBoldBase64 = existsSync(fontBoldPath) ? (await fs.readFile(fontBoldPath)).toString('base64') : '';

    const currencySymbol = transaction.currency || 'EGP';
    const subtotal = records.reduce((sum, record) => sum + parseFloat(record.total_price), 0);
    const serviceFee = parseFloat(transaction.service_fee || 0);
    const sparePartsMarkup = parseFloat(transaction.spare_parts_markup || 0);
    const totalServiceFee = serviceFee + sparePartsMarkup;
    const taxRate = transaction.tax_rate !== undefined ? parseFloat(transaction.tax_rate) : 0.0;
    const amountBeforeTax = subtotal + totalServiceFee;
    const totalAmount = amountBeforeTax;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @font-face {
            font-family: 'CairoLocal';
            src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
            font-weight: 400; font-style: normal;
        }
        @font-face {
            font-family: 'CairoLocal';
            src: url(data:font/truetype;charset=utf-8;base64,${fontBoldBase64}) format('truetype');
            font-weight: 700; font-style: normal;
        }
        :root {
            --gocar-blue: #1e3a5f; --gocar-orange: #e68a4b;
            --text-dark: #1e293b; --text-gray: #64748b;
        }
        * { box-sizing: border-box; }
        body { font-family: 'CairoLocal', sans-serif; margin: 0; padding: 0; color: var(--text-dark); line-height: 1.4; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .logo { height: 60px; }
        .invoice-title-block { text-align: right; }
        .invoice-title { font-size: 32px; font-weight: 700; color: var(--gocar-blue); margin: 0; }
        .invoice-number { font-size: 14px; font-weight: 700; color: var(--gocar-orange); margin: 5px 0; }
        .invoice-date { font-size: 10px; color: var(--text-gray); }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; border-left: 4px solid var(--gocar-orange); padding-left: 15px; }
        .client-info h3, .vehicle-info h3 { font-size: 10px; color: var(--text-gray); margin: 0 0 5px 0; text-transform: uppercase; }
        .client-info p, .vehicle-info p { margin: 2px 0; font-weight: 700; }
        .vehicle-info { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        thead { background-color: #f1f5f9; }
        th { padding: 12px 10px; text-align: left; font-size: 9px; color: var(--gocar-blue); text-transform: uppercase; }
        td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
        .td-qty { text-align: center; width: 60px; }
        .td-total { text-align: right; width: 100px; }
        .arabic-text { direction: rtl; unicode-bidi: embed; }
        .totals-section { display: flex; flex-direction: column; align-items: flex-end; margin-top: 20px; }
        .total-row { display: flex; justify-content: flex-end; width: 300px; margin-bottom: 8px; font-size: 10px; color: var(--text-gray); }
        .total-label { width: 150px; text-align: right; padding-right: 15px; }
        .total-value { width: 120px; text-align: right; font-weight: 700; color: var(--text-dark); }
        .grand-total-block { background-color: var(--gocar-blue); color: white; padding: 20px; margin-top: 30px; display: flex; justify-content: space-between; align-items: center; }
        .grand-total-label { font-size: 10px; opacity: 0.8; font-weight: 700; }
        .grand-total-value { font-size: 22px; font-weight: 700; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8px; color: var(--text-gray); border-top: 1px solid #f1f5f9; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="${logoBase64}" class="logo" alt="GoCar Auto">
        <div class="invoice-title-block">
            <h1 class="invoice-title">INVOICE</h1>
            <p class="invoice-number">#${escapeHtml(transaction.invoice_number)}</p>
            <p class="invoice-date">Date: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
    </div>
    <div class="info-section">
        <div class="client-info">
            <h3>Client</h3>
            <p>${escapeHtml(customer.full_name || 'Customer')}</p>
            <p style="font-weight: 400; color: var(--text-gray);">${escapeHtml(customer.phone || '')}</p>
        </div>
        <div class="vehicle-info">
            <h3>Vehicle Specs</h3>
            <p>${escapeHtml((transaction.vehicle_info || 'Vehicle').replace(/ \(null\)/g, ''))}</p>
            ${transaction.mileage ? `<p style="font-weight: 400; color: var(--text-gray);">Mileage: ${parseInt(transaction.mileage).toLocaleString()} KM</p>` : ''}
        </div>
    </div>
    <table>
        <thead>
            <tr><th style="width: 320px;">Service Description</th><th class="td-qty">Qty</th><th class="td-total">Total (${escapeHtml(currencySymbol)})</th></tr>
        </thead>
        <tbody>
            ${records.map(r => `
                <tr>
                    <td class="${/[\u0600-\u06FF]/.test(r.item_name || r.item_name_ar) ? 'arabic-text' : ''}">${escapeHtml(r.item_name_ar || r.item_name || '')}</td>
                    <td class="td-qty">${r.quantity}</td>
                    <td class="td-total">${parseFloat(r.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="totals-section">
        <div class="total-row"><div class="total-label">Subtotal:</div><div class="total-value">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}</div></div>
        ${totalServiceFee > 0 ? `<div class="total-row"><div class="total-label">Service Fee:</div><div class="total-value">${totalServiceFee.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}</div></div>` : ''}
    </div>
    <div class="grand-total-block">
        <div class="grand-total-label">GRAND TOTAL</div>
        <div class="grand-total-value">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}</div>
    </div>
</body>
</html>
    `;

    let page;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            preferCSSPageSize: true
        });
        return Buffer.from(pdfBuffer);
    } finally {
        if (page) await page.close();
    }
}

/**
 * Generate a certified, buyer-facing Vehicle Service Passport PDF.
 * Personal owner details are strictly redacted for privacy.
 * @param {Object} data - Vehicle metadata, service history records, and passport verification info.
 * @returns {Buffer} - PDF binary buffer.
 */
export async function generateServicePassportPDF(data) {
    const { vehicle, records = [], passportId, verificationUrl } = data;

    const logoPath = path.join(__dirname, '../public/logo.png');
    const logoBase64 = existsSync(logoPath) ? `data:image/png;base64,${(await fs.readFile(logoPath)).toString('base64')}` : '';

    const fontPath = path.join(__dirname, 'Arabic.ttf');
    const fontBoldPath = path.join(__dirname, 'Arabic-Bold.ttf');
    const fontBase64 = existsSync(fontPath) ? (await fs.readFile(fontPath)).toString('base64') : '';
    const fontBoldBase64 = existsSync(fontBoldPath) ? (await fs.readFile(fontBoldPath)).toString('base64') : '';

    const passportNumber = passportId || `GCP-${vehicle.id}-${(vehicle.vin || 'AUT').slice(-4)}-${new Date().getFullYear()}`;
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @font-face {
            font-family: 'CairoLocal';
            src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
            font-weight: 400; font-style: normal;
        }
        @font-face {
            font-family: 'CairoLocal';
            src: url(data:font/truetype;charset=utf-8;base64,${fontBoldBase64}) format('truetype');
            font-weight: 700; font-style: normal;
        }
        :root {
            --gocar-dark: #0b0f19;
            --gocar-gold: #fbbf24;
            --gocar-blue: #1e3a5f;
            --gocar-light: #f8fafc;
            --text-dark: #0f172a;
            --text-muted: #64748b;
            --border-light: #e2e8f0;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'CairoLocal', sans-serif;
            margin: 0; padding: 0;
            color: var(--text-dark);
            line-height: 1.45;
            background: #ffffff;
        }
        .passport-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 25px;
            border-bottom: 2px solid var(--border-light);
            margin-bottom: 25px;
        }
        .logo { height: 55px; }
        .passport-badge {
            text-align: right;
        }
        .badge-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--gocar-blue);
            margin: 0;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        .badge-subtitle {
            font-size: 13px;
            font-weight: 700;
            color: #d97706;
            margin: 2px 0;
            direction: rtl;
        }
        .passport-no {
            font-size: 10px;
            font-family: monospace;
            font-weight: 700;
            color: var(--text-muted);
            margin-top: 4px;
        }
        .privacy-banner {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 10px;
            color: #166534;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 25px;
        }
        .privacy-tag {
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .vehicle-identity-card {
            background: #f8fafc;
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        .spec-item {
            display: flex;
            flex-direction: column;
        }
        .spec-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted);
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }
        .spec-value {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-dark);
        }
        .spec-value-gold {
            color: #b45309;
            font-size: 15px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--gocar-blue);
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 11px;
        }
        thead {
            background-color: #0f172a;
            color: #ffffff;
        }
        th {
            padding: 10px 12px;
            text-align: left;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-light);
        }
        tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .arabic-text {
            direction: rtl;
            unicode-bidi: embed;
        }
        .category-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            background-color: #e0f2fe;
            color: #0369a1;
        }
        .certification-footer {
            margin-top: 35px;
            padding: 18px;
            background: #f8fafc;
            border-left: 4px solid var(--gocar-gold);
            border-radius: 0 10px 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cert-statement {
            font-size: 9px;
            color: var(--text-muted);
            max-width: 480px;
            line-height: 1.5;
        }
        .verification-stamp {
            text-align: right;
            border: 2px dashed #d97706;
            padding: 8px 12px;
            border-radius: 8px;
            background: #fffbeb;
        }
        .stamp-title {
            font-size: 9px;
            font-weight: 700;
            color: #b45309;
            text-transform: uppercase;
        }
        .stamp-code {
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            color: #78350f;
        }
    </style>
</head>
<body>
    <div class="passport-header">
        <img src="${logoBase64}" class="logo" alt="GoCar Auto">
        <div class="passport-badge">
            <h1 class="badge-title">SERVICE PASSPORT</h1>
            <p class="badge-subtitle">جواز الصيانة الفني المعتمد</p>
            <div class="passport-no">ID: ${escapeHtml(passportNumber)} • Date: ${escapeHtml(generatedDate)}</div>
        </div>
    </div>

    <div class="privacy-banner">
        <span class="privacy-tag">🛡️ Privacy Shield Verified</span>
        <span>Owner Identity: <strong>Confidential Registered Client</strong> (Redacted for resale protection)</span>
    </div>

    <div class="vehicle-identity-card">
        <div class="spec-item">
            <span class="spec-label">Vehicle</span>
            <span class="spec-value">${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Year Model</span>
            <span class="spec-value">${escapeHtml(vehicle.year || '—')}</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Plate / License</span>
            <span class="spec-value">${escapeHtml(vehicle.license_plate || '—')}</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Chassis (VIN)</span>
            <span class="spec-value font-mono" style="font-size: 11px;">${escapeHtml(vehicle.vin || '—')}</span>
        </div>
        <div class="spec-item" style="margin-top: 10px;">
            <span class="spec-label">Verified Odometer</span>
            <span class="spec-value spec-value-gold">${(vehicle.current_mileage || 0).toLocaleString()} KM</span>
        </div>
        <div class="spec-item" style="margin-top: 10px;">
            <span class="spec-label">Total Completed Visits</span>
            <span class="spec-value">${records.length || vehicle.services_count || 0} Visits</span>
        </div>
        <div class="spec-item" style="margin-top: 10px;">
            <span class="spec-label">Last Inspection</span>
            <span class="spec-value">${vehicle.last_service_date || generatedDate}</span>
        </div>
        <div class="spec-item" style="margin-top: 10px;">
            <span class="spec-label">Pedigree Status</span>
            <span class="spec-value" style="color: #16a34a;">Certified Active</span>
        </div>
    </div>

    <div class="section-title">
        <span>Verified Maintenance Ledger & Parts History</span>
        <span style="font-size: 9px; color: var(--text-muted); font-weight: 400;">Chronological Workshop Records</span>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 85px;">Date</th>
                <th style="width: 85px;">Mileage</th>
                <th>Service & Replacement Parts</th>
                <th style="width: 90px; text-align: center;">Category</th>
            </tr>
        </thead>
        <tbody>
            ${records.length > 0 ? records.map(r => `
                <tr>
                    <td style="font-weight: 700; color: var(--text-muted);">${escapeHtml(r.service_date || '—')}</td>
                    <td style="font-family: monospace; font-weight: 700;">${r.mileage ? parseInt(r.mileage).toLocaleString() + ' KM' : '—'}</td>
                    <td class="${/[\u0600-\u06FF]/.test(r.item_name || r.item_name_ar) ? 'arabic-text' : ''}">
                        <strong>${escapeHtml(r.item_name_ar || r.item_name || 'Routine Service')}</strong>
                        ${r.notes ? `<div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(r.notes)}</div>` : ''}
                    </td>
                    <td style="text-align: center;">
                        <span class="category-pill">${escapeHtml(r.category || 'Service')}</span>
                    </td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">
                        No recorded service items found for this vehicle.
                    </td>
                </tr>
            `}
        </tbody>
    </table>

    <div class="certification-footer">
        <div class="cert-statement">
            <strong>OFFICIAL GOCAR QUALITY ATTESTATION:</strong><br>
            This document certifies that the above-identified vehicle has undergone routine preventative maintenance, certified parts replacements, and mechanical diagnostics under the supervision of GoCar Auto. All recorded mileage intervals are verified against original workshop tickets.
        </div>
        <div class="verification-stamp">
            <div class="stamp-title">AUTHENTICATED LEDGER</div>
            <div class="stamp-code">${escapeHtml(passportNumber)}</div>
        </div>
    </div>
</body>
</html>
    `;

    let page;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: 10000 });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            },
            preferCSSPageSize: true
        });
        return Buffer.from(pdfBuffer);
    } catch (puppeteerErr) {
        console.warn('Puppeteer passport generation failed or unconfigured, falling back to PDFKit:', puppeteerErr.message);
        return await generatePassportPDFKit(data);
    } finally {
        if (page) {
            try { await page.close(); } catch {}
        }
    }
}

/**
 * Pure JavaScript PDFKit fallback for Service Passport generation.
 * Operates with 0 browser dependencies and 100% cloud reliability.
 */
function generatePassportPDFKit(data) {
    const { vehicle, records = [], passportId } = data;
    const passportNumber = passportId || `GCP-${vehicle.id}-${(vehicle.vin || 'AUT').slice(-4)}-${new Date().getFullYear()}`;
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 40, right: 40 }
            });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header
            doc.fillColor('#0b0f19').fontSize(22).font('Helvetica-Bold').text('GOCAR AUTO', 40, 40);
            doc.fillColor('#d97706').fontSize(16).text('SERVICE PASSPORT', 350, 40, { align: 'right' });
            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`ID: ${passportNumber} • Date: ${generatedDate}`, 350, 62, { align: 'right' });

            doc.moveTo(40, 85).lineTo(555, 85).strokeColor('#e2e8f0').lineWidth(1).stroke();

            // Privacy Banner
            doc.roundedRect(40, 95, 515, 26, 4).fillAndStroke('#f0fdf4', '#bbf7d0');
            doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold').text('PRIVACY SHIELD VERIFIED', 50, 103);
            doc.fillColor('#166534').fontSize(8).font('Helvetica').text('Owner Identity: Confidential Registered Client (Redacted for resale protection)', 200, 103, { align: 'right' });

            // Vehicle Specs Box
            doc.roundedRect(40, 130, 515, 75, 6).fillAndStroke('#f8fafc', '#e2e8f0');

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('VEHICLE', 55, 140);
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`${vehicle.make || ''} ${vehicle.model || ''}`, 55, 152);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('YEAR MODEL', 180, 140);
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`${vehicle.year || '—'}`, 180, 152);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PLATE / LICENSE', 280, 140);
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`${vehicle.license_plate || '—'}`, 280, 152);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('CHASSIS (VIN)', 400, 140);
            doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(`${vehicle.vin || '—'}`, 400, 152);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('VERIFIED ODOMETER', 55, 172);
            doc.fillColor('#b45309').fontSize(12).font('Helvetica-Bold').text(`${(vehicle.current_mileage || 0).toLocaleString()} KM`, 55, 184);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('COMPLETED VISITS', 180, 172);
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`${records.length || vehicle.services_count || 0} Visits`, 180, 184);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('LAST INSPECTION', 280, 172);
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`${vehicle.last_service_date || generatedDate}`, 280, 184);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PEDIGREE STATUS', 400, 172);
            doc.fillColor('#16a34a').fontSize(11).font('Helvetica-Bold').text('Certified Active', 400, 184);

            // Table Header
            let y = 225;
            doc.rect(40, y, 515, 20).fill('#0f172a');
            doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
            doc.text('DATE', 50, y + 6);
            doc.text('MILEAGE', 130, y + 6);
            doc.text('SERVICE & REPLACEMENT PARTS', 210, y + 6);
            doc.text('CATEGORY', 470, y + 6);

            y += 20;
            const recordsToShow = records.length > 0 ? records : [];
            if (recordsToShow.length === 0) {
                doc.rect(40, y, 515, 25).fill('#ffffff');
                doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('No recorded service items found for this vehicle.', 50, y + 8);
                y += 25;
            } else {
                for (let i = 0; i < recordsToShow.length; i++) {
                    const r = recordsToShow[i];
                    if (y > 720) {
                        doc.addPage();
                        y = 40;
                    }
                    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    doc.rect(40, y, 515, 22).fill(bg);
                    doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(r.service_date || '—', 50, y + 6);
                    doc.fillColor('#0f172a').fontSize(8).font('Helvetica').text(r.mileage ? `${parseInt(r.mileage).toLocaleString()} KM` : '—', 130, y + 6);

                    const itemDesc = r.item_name || r.item_name_ar || 'Routine Service';
                    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(String(itemDesc).slice(0, 50), 210, y + 6);

                    doc.fillColor('#0369a1').fontSize(7).font('Helvetica-Bold').text(r.category || 'Service', 475, y + 6);
                    y += 22;
                }
            }

            // Attestation Footer
            y += 15;
            if (y > 700) { doc.addPage(); y = 40; }
            doc.roundedRect(40, y, 515, 45, 6).fillAndStroke('#f8fafc', '#e2e8f0');
            doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('OFFICIAL GOCAR QUALITY ATTESTATION:', 50, y + 8);
            doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('This document certifies that this vehicle has undergone routine preventative maintenance, certified parts replacements, and mechanical diagnostics under the supervision of GoCar Auto. All recorded mileage intervals are verified against original workshop tickets.', 50, y + 20, { width: 340 });

            // Stamp
            doc.roundedRect(410, y + 6, 135, 33, 4).lineWidth(1.5).dash(4, { space: 2 }).strokeColor('#d97706').stroke();
            doc.undash();
            doc.fillColor('#b45309').fontSize(8).font('Helvetica-Bold').text('AUTHENTICATED LEDGER', 415, y + 12, { width: 125, align: 'center' });
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(passportNumber, 415, y + 24, { width: 125, align: 'center' });

            doc.end();
        } catch (e) {
            reject(e);
        }
    });
}
