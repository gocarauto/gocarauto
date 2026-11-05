import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a standalone premium HTML invoice for browser display.
 * @param {Object} data - Transaction, customer, and record data.
 * @returns {string} - Complete HTML document string.
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function generateInvoiceHTML(data) {
    const { transaction, customer, records } = data;

    const logoPath = path.join(__dirname, '../public/logo.png');
    const logoBase64 = fs.existsSync(logoPath) ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}` : '';

    const currencySymbol = escapeHtml(transaction.currency || 'EGP');
    const subtotal = records.reduce((sum, record) => sum + parseFloat(record.total_price), 0);
    const serviceFee = parseFloat(transaction.service_fee || 0);
    const sparePartsMarkup = parseFloat(transaction.spare_parts_markup || 0);
    const totalServiceFee = serviceFee + sparePartsMarkup;
    const totalAmount = subtotal + totalServiceFee;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${transaction.invoice_number} - GoCar Auto</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        :root { --gocar-blue: #0b192c; --gocar-orange: #f97316; --text-dark: #0f172a; --text-gray: #475569; --border-light: #e2e8f0; --bg-light: #f8fafc; }
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Outfit', 'Cairo', sans-serif; margin: 0; padding: 0; color: var(--text-dark); line-height: 1.3; background-color: var(--bg-light); font-size: 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media screen { body { display: flex; justify-content: center; padding: 3rem; } .invoice-wrapper { background: white; width: 210mm; padding: 40px; box-shadow: 0 20px 25px -5px rgb(0 0 0/0.1); border-radius: 12px; border: 1px solid var(--border-light); } }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--border-light); padding-bottom: 25px; margin-bottom: 35px; }
        .brand-section { display: flex; flex-direction: column; gap: 4px; }
        .logo { max-height: 70px; max-width: 220px; object-fit: contain; margin-bottom: 10px; }
        .company-details { font-size: 12px; color: var(--text-gray); line-height: 1.6; font-weight: 500; }
        .doc-meta { text-align: right; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .doc-title { font-size: 44px; font-weight: 900; color: var(--gocar-blue); margin: 0; text-transform: uppercase; letter-spacing: -2px; }
        .invoice-number { font-size: 20px; font-weight: 800; color: var(--gocar-orange); margin: 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 60px; background: var(--bg-light); padding: 30px; border-radius: 12px; border-left: 6px solid var(--gocar-orange); break-inside: avoid; }
        .info-block { display: flex; flex-direction: column; gap: 8px; }
        .info-label { font-size: 11px; text-transform: uppercase; color: var(--text-gray); font-weight: 800; letter-spacing: 1px; }
        .info-value { font-size: 17px; font-weight: 800; color: var(--gocar-blue); }
        .info-sub { font-size: 13px; font-weight: 600; color: var(--text-gray); margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        thead th { text-align: left; padding: 20px 0; border-bottom: 3px solid var(--gocar-blue); font-size: 12px; text-transform: uppercase; color: var(--text-gray); font-weight: 800; letter-spacing: 1px; }
        tbody td { padding: 25px 0; border-bottom: 1px solid var(--border-light); font-size: 15px; font-weight: 600; }
        .col-qty { text-align: center; }
        .col-price { text-align: right; font-weight: 800; }
        .arabic-text { font-family: 'Cairo', sans-serif; direction: rtl; unicode-bidi: embed; text-align: right; font-size: 19px; font-weight: 800; }

        .totals-container { display: flex; justify-content: flex-end; margin-top: 20px; }
        .totals-grid { min-width: 380px; display: grid; grid-template-columns: 1fr auto; gap: 18px 40px; break-inside: avoid; }
        .totals-label { font-size: 14px; font-weight: 600; color: var(--text-gray); text-align: right; }
        .totals-value { font-size: 16px; font-weight: 800; text-align: right; }
        .grand-total-label { font-size: 18px; font-weight: 900; color: var(--gocar-blue); border-top: 3px solid var(--gocar-blue); padding-top: 20px; text-align: right; }
        .grand-total-value { font-size: 32px; font-weight: 900; color: var(--gocar-orange); border-top: 3px solid var(--gocar-blue); padding-top: 20px; text-align: right; white-space: nowrap; }
        .currency { font-size: 18px; color: var(--text-gray); font-weight: 600; margin-left: 5px; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid var(--border-light); text-align: center; font-size: 11px; color: var(--text-gray); }
        @media print { 
            body { padding: 0; background: white; } 
            .invoice-wrapper { border: none; box-shadow: none; padding: 0; margin: 0; width: 100%; border-radius: 0; } 
            .no-print { display: none !important; } 
            .header { margin-top: 0; }
        }
    </style>
</head>
<body>
    <div class="invoice-wrapper">
        <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
            <button onclick="window.print()" style="background: var(--gocar-blue); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 800; cursor: pointer;">🖨️ PRINT PDF</button>
        </div>
        <div class="header">
            <div class="brand-section">
                ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="GoCar Auto">` : `<div style="font-size: 30px; font-weight: 900; color: var(--gocar-blue); margin-bottom: 5px;">GOCAR AUTO</div>`}
                <div class="company-details">
                    <strong>Premium Automotive Service Center</strong><br>
                    Cairo, Egypt<br>
                    +20 106 661 5092 | +20 106 780 0008<br>
                    go2carauto@gmail.com
                </div>
            </div>
            <div class="doc-meta">
                <h1 class="doc-title">INVOICE</h1>
                <p class="invoice-number">#${escapeHtml(transaction.invoice_number)}</p>
                <p class="invoice-date">Date: ${escapeHtml(transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'))}</p>
            </div>
        </div>
        <div class="info-grid">
            <div class="info-block">
                <div class="info-label">BILLED TO</div>
                <div class="info-value">${escapeHtml(customer.full_name || 'Guest User')}</div>
                <div class="info-sub">${escapeHtml(customer.phone || 'N/A Telemetry')}</div>
            </div>
            <div class="info-block">
                <div class="info-label">VEHICLE INFO</div>
                <div class="info-value">${escapeHtml((transaction.vehicle_info || 'Fleet Asset').split(' (null)')[0])}</div>
                <div class="info-sub">Mileage: ${(transaction.mileage || 0).toLocaleString()} KM</div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="width: 60%">SERVICE DESCRIPTION</th>
                    <th class="col-qty">QTY</th>
                    <th class="col-price">TOTAL (${currencySymbol})</th>
                </tr>
            </thead>
            <tbody>
                ${records.map(r => `
                    <tr>
                        <td class="${/[\u0600-\u06FF]/.test(r.item_name || r.item_name_ar) ? 'arabic-text' : ''}">${escapeHtml(r.item_name_ar || r.item_name || '')}</td>
                        <td class="col-qty">${parseFloat(r.quantity)}</td>
                        <td class="col-price">${parseFloat(r.total_price).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="totals-container">
            <div class="totals-grid">
                <div class="totals-label">Subtotal</div>
                <div class="totals-value">${subtotal.toLocaleString()}</div>
                
                ${totalServiceFee > 0 ? `
                    <div class="totals-label">GoCar Auto Service Fee</div>
                    <div class="totals-value">${totalServiceFee.toLocaleString()}</div>
                ` : ''}

                <div class="grand-total-label">TOTAL AMOUNT DUE</div>
                <div class="grand-total-value">
                    ${totalAmount.toLocaleString()} <span class="currency">${currencySymbol}</span>
                </div>
            </div>
        </div>
        <div class="footer">
            <p><strong>Thank you for trusting GoCar Auto.</strong> We appreciate your business.</p>
            <p>For any inquiries regarding this invoice, please contact <strong>go2carauto@gmail.com</strong></p>
        </div>
    </div>
</body>
</html>
    `;
}
