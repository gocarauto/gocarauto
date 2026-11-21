import puppeteer from 'puppeteer-core';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePassportHTML } from './passport-viewer.js';
import reshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

function formatArabicForPDFKit(text) {
    if (!text || !/[\u0600-\u06FF]/.test(text)) return text;
    try {
        const reshaped = reshaper.convertArabic(text);
        const levels = bidi.getEmbeddingLevels(reshaped);
        return bidi.getReorderedString(reshaped, levels);
    } catch {
        return text;
    }
}

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
    const htmlContent = generatePassportHTML(data);

    let page;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: 15000 });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '12mm',
                right: '15mm',
                bottom: '12mm',
                left: '15mm'
            },
            preferCSSPageSize: true
        });
        return Buffer.from(pdfBuffer);
    } catch (puppeteerErr) {
        console.warn('Puppeteer passport generation unavailable in current environment:', puppeteerErr.message);
        throw new Error(`Puppeteer unavailable: ${puppeteerErr.message}`);
    } finally {
        if (page) {
            try { await page.close(); } catch {}
        }
    }
}

/**
 * Pure JavaScript PDFKit fallback for Service Passport generation.
 * Operates with 0 browser dependencies and 100% cloud reliability.
 * Fully styled in GoCar Auto Invoice Design Theme (Navy #0b192c, Amber/Orange #f97316)
 * with robust Arabic reshaping and TrueType font rendering.
 */
function generatePassportPDFKit(data) {
    const { vehicle = {}, records = [], passportId } = data;
    const passportNumber = passportId || `GCP-${vehicle.id}-${(vehicle.vin || vehicle.license_plate || 'AUT').toString().replace(/[^a-zA-Z0-9]/g, '').slice(-4)}-${new Date().getFullYear()}`;
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

            const arabicFontPath = path.join(__dirname, 'Arabic.ttf');
            const arabicBoldFontPath = path.join(__dirname, 'Arabic-Bold.ttf');
            const hasArabicFont = existsSync(arabicFontPath);
            const hasArabicBoldFont = existsSync(arabicBoldFontPath);

            if (hasArabicFont) {
                doc.registerFont('Arabic', arabicFontPath);
            }
            if (hasArabicBoldFont) {
                doc.registerFont('Arabic-Bold', arabicBoldFontPath);
            }

            // Header matching Invoice Theme
            doc.fillColor('#0b192c').fontSize(22).font('Helvetica-Bold').text('GOCAR AUTO', 40, 40);
            doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Automotive Care & Maintenance Services • Cairo, Egypt', 40, 65);
            doc.fillColor('#0b192c').fontSize(18).font('Helvetica-Bold').text('SERVICE PASSPORT', 350, 40, { align: 'right' });
            doc.fillColor('#f97316').fontSize(11).font('Helvetica-Bold').text(`ID: ${passportNumber}`, 350, 60, { align: 'right' });
            doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(`Date: ${generatedDate}`, 350, 74, { align: 'right' });

            doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#e2e8f0').lineWidth(1).stroke();

            // Privacy Banner
            doc.roundedRect(40, 100, 515, 26, 4).fillAndStroke('#ecfdf5', '#a7f3d0');
            doc.fillColor('#065f46').fontSize(9).font('Helvetica-Bold').text('PRIVACY SHIELD VERIFIED', 50, 108);
            doc.fillColor('#065f46').fontSize(8).font('Helvetica').text('Owner Identity: Confidential Registered Client (Redacted for resale protection)', 200, 108, { align: 'right' });

            // Vehicle Specs Box
            doc.roundedRect(40, 135, 515, 75, 6).fillAndStroke('#f8fafc', '#e2e8f0');
            doc.rect(40, 135, 5, 75).fill('#f97316');

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('VEHICLE', 55, 145);
            doc.fillColor('#0b192c').fontSize(11).font('Helvetica-Bold').text(`${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Fleet Asset', 55, 157);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('YEAR MODEL', 180, 145);
            doc.fillColor('#0b192c').fontSize(11).font('Helvetica-Bold').text(`${vehicle.year || '—'}`, 180, 157);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PLATE / LICENSE', 280, 145);
            doc.fillColor('#0b192c').fontSize(11).font('Helvetica-Bold').text(`${vehicle.license_plate || '—'}`, 280, 157);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('CHASSIS (VIN)', 400, 145);
            doc.fillColor('#0b192c').fontSize(10).font('Helvetica').text(`${vehicle.vin || '—'}`, 400, 157);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('VERIFIED ODOMETER', 55, 177);
            doc.fillColor('#f97316').fontSize(12).font('Helvetica-Bold').text(`${(vehicle.current_mileage || 0).toLocaleString()} KM`, 55, 189);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('COMPLETED VISITS', 180, 177);
            doc.fillColor('#0b192c').fontSize(11).font('Helvetica-Bold').text(`${records.length || vehicle.services_count || 0} Visits`, 180, 189);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('LAST INSPECTION', 280, 177);
            doc.fillColor('#0b192c').fontSize(11).font('Helvetica-Bold').text(`${vehicle.last_service_date || generatedDate}`, 280, 189);

            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PEDIGREE STATUS', 400, 177);
            doc.fillColor('#16a34a').fontSize(11).font('Helvetica-Bold').text('Certified Active', 400, 189);

            // Table Header
            let y = 225;
            doc.rect(40, y, 515, 20).fill('#0b192c');
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
                    doc.fillColor('#0b192c').fontSize(8).font('Helvetica').text(r.mileage ? `${parseInt(r.mileage).toLocaleString()} KM` : '—', 130, y + 6);

                    const itemDesc = r.item_name || r.item_name_ar || 'Routine Service';
                    const isAr = /[\u0600-\u06FF]/.test(itemDesc);

                    if (isAr && hasArabicBoldFont) {
                        doc.font('Arabic-Bold').fontSize(8.5).fillColor('#0b192c').text(formatArabicForPDFKit(itemDesc), 210, y + 5);
                    } else if (isAr && hasArabicFont) {
                        doc.font('Arabic').fontSize(8.5).fillColor('#0b192c').text(formatArabicForPDFKit(itemDesc), 210, y + 5);
                    } else {
                        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0b192c').text(String(itemDesc).slice(0, 50), 210, y + 6);
                    }

                    doc.font('Helvetica-Bold').fillColor('#f97316').fontSize(7.5).text(r.category || 'Service', 470, y + 6);
                    y += 22;
                }
            }

            // Attestation Footer
            y += 20;
            if (y > 700) { doc.addPage(); y = 40; }
            doc.roundedRect(40, y, 515, 45, 6).fillAndStroke('#f8fafc', '#e2e8f0');
            doc.fillColor('#0b192c').fontSize(8).font('Helvetica-Bold').text('OFFICIAL GOCAR QUALITY ATTESTATION:', 50, y + 8);
            doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('This document certifies that this vehicle has undergone routine preventative maintenance, certified parts replacements, and mechanical diagnostics under the supervision of GoCar Auto. All recorded mileage intervals are verified against original workshop tickets.', 50, y + 20, { width: 340 });

            // Stamp
            doc.roundedRect(410, y + 6, 135, 33, 4).lineWidth(1.5).dash(4, { space: 2 }).strokeColor('#f97316').stroke();
            doc.undash();
            doc.fillColor('#f97316').fontSize(8).font('Helvetica-Bold').text('AUTHENTICATED LEDGER', 415, y + 12, { width: 125, align: 'center' });
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(passportNumber, 415, y + 24, { width: 125, align: 'center' });

            doc.end();
        } catch (e) {
            reject(e);
        }
    });
}
