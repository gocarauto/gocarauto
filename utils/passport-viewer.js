import fs from 'fs';
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

/**
 * Generate a standalone premium HTML Service Passport for browser display and native PDF print.
 * Follows the exact GoCar Auto Invoice Design Theme (Outfit & Cairo typography, luxury navy & amber/orange palette).
 *
 * @param {Object} data - Vehicle metadata, records, passportId, verificationUrl
 * @returns {string} - Complete HTML document
 */
export function generatePassportHTML(data) {
    const { vehicle = {}, records = [], passportId, verificationUrl } = data;

    const logoPath = path.join(__dirname, '../public/logo.png');
    const logoBase64 = fs.existsSync(logoPath) ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}` : '';

    const passportNumber = passportId || `GCP-${vehicle.id}-${(vehicle.vin || vehicle.license_plate || 'AUT').toString().replace(/[^a-zA-Z0-9]/g, '').slice(-4)}-${new Date().getFullYear()}`;
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const totalRecords = records.length;
    const vehicleName = `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Fleet Asset';
    const verifiedMileage = vehicle.current_mileage ? `${parseInt(vehicle.current_mileage, 10).toLocaleString()} KM` : '— KM';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Passport #${escapeHtml(passportNumber)} - ${escapeHtml(vehicleName)} | GoCar Auto</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        :root {
            --gocar-blue: #0b192c;
            --gocar-orange: #f97316;
            --gocar-amber: #fbbf24;
            --text-dark: #0f172a;
            --text-gray: #475569;
            --text-muted: #64748b;
            --border-light: #e2e8f0;
            --bg-light: #f8fafc;
            --emerald-bg: #ecfdf5;
            --emerald-border: #a7f3d0;
            --emerald-text: #065f46;
        }
        @page {
            size: A4;
            margin: 12mm 15mm;
        }
        body {
            font-family: 'Outfit', 'Cairo', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-dark);
            line-height: 1.4;
            background-color: var(--bg-light);
            font-size: 13px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @media screen {
            body {
                display: flex;
                justify-content: center;
                padding: 2.5rem 1rem;
            }
            .passport-wrapper {
                background: white;
                width: 210mm;
                min-height: 297mm;
                padding: 40px;
                box-shadow: 0 25px 35px -5px rgba(0, 0, 0, 0.08), 0 0 15px rgba(0, 0, 0, 0.03);
                border-radius: 16px;
                border: 1px solid var(--border-light);
            }
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .passport-wrapper {
                background: white;
                width: 100%;
                padding: 0;
                box-shadow: none;
                border: none;
                border-radius: 0;
            }
            .no-print {
                display: none !important;
            }
        }

        /* Top Action Bar (Screen Only) */
        .no-print-bar {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 10px;
        }
        .btn-print {
            background: var(--gocar-blue);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(11, 25, 44, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        .btn-print:hover {
            background: #152840;
            transform: translateY(-1px);
        }

        /* Header matching GoCar Invoice theme */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--border-light);
            padding-bottom: 24px;
            margin-bottom: 24px;
        }
        .brand-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .logo {
            max-height: 65px;
            max-width: 220px;
            object-fit: contain;
            margin-bottom: 8px;
        }
        .brand-fallback {
            font-size: 32px;
            font-weight: 900;
            color: var(--gocar-blue);
            letter-spacing: -1px;
            margin-bottom: 4px;
        }
        .company-details {
            font-size: 11.5px;
            color: var(--text-gray);
            line-height: 1.55;
            font-weight: 500;
        }
        .doc-meta {
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex-shrink: 0;
        }
        .doc-title {
            font-size: 36px;
            font-weight: 900;
            color: var(--gocar-blue);
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -1.5px;
            line-height: 1;
        }
        .passport-number {
            font-size: 16px;
            font-weight: 800;
            color: var(--gocar-orange);
            margin: 4px 0 0 0;
            letter-spacing: -0.3px;
        }
        .doc-date {
            font-size: 11px;
            color: var(--text-muted);
            margin: 2px 0 0 0;
            font-weight: 600;
        }

        /* Privacy Banner */
        .privacy-banner {
            background-color: var(--emerald-bg);
            border: 1px solid var(--emerald-border);
            border-radius: 10px;
            padding: 10px 16px;
            margin-bottom: 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: var(--emerald-text);
        }
        .privacy-badge {
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .privacy-text {
            font-weight: 600;
            opacity: 0.95;
        }

        /* Info Grid matching Invoice Block */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px 24px;
            margin-bottom: 30px;
            background: var(--bg-light);
            padding: 22px 26px;
            border-radius: 12px;
            border-left: 6px solid var(--gocar-orange);
            break-inside: avoid;
        }
        .info-block {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .info-label {
            font-size: 10px;
            text-transform: uppercase;
            color: var(--text-muted);
            font-weight: 800;
            letter-spacing: 0.8px;
        }
        .info-value {
            font-size: 14.5px;
            font-weight: 800;
            color: var(--gocar-blue);
        }
        .info-value-gold {
            font-size: 15px;
            font-weight: 800;
            color: #d97706;
        }
        .info-value-emerald {
            font-size: 13.5px;
            font-weight: 800;
            color: #059669;
        }

        /* Ledger Table */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 800;
            color: var(--gocar-blue);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0;
        }
        .section-subtitle {
            font-size: 11px;
            color: var(--text-muted);
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        thead th {
            text-align: left;
            padding: 12px 14px;
            border-bottom: 3px solid var(--gocar-blue);
            font-size: 10.5px;
            text-transform: uppercase;
            color: var(--text-gray);
            font-weight: 800;
            letter-spacing: 0.8px;
            background-color: transparent;
        }
        tbody td {
            padding: 12px 14px;
            border-bottom: 1px solid var(--border-light);
            font-size: 12.5px;
            font-weight: 600;
            vertical-align: middle;
        }
        tbody tr:nth-child(even) {
            background-color: #fafbfc;
        }
        .col-date {
            width: 110px;
            font-weight: 700;
            color: var(--text-muted);
            font-family: monospace;
            font-size: 12px;
        }
        .col-mileage {
            width: 110px;
            color: var(--text-dark);
            font-weight: 700;
        }
        .col-category {
            width: 100px;
            text-align: right;
        }
        .category-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #e0f2fe;
            color: #0369a1;
        }

        /* Native Clean Arabic Typography */
        .arabic-text {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            unicode-bidi: embed;
            text-align: left;
            font-size: 14px;
            font-weight: 700;
            color: var(--text-dark);
            line-height: 1.5;
        }

        /* Empty state */
        .empty-records {
            text-align: center;
            padding: 30px;
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 600;
            background: #ffffff;
        }

        /* Footer & Official Seal matching Invoice Stamp */
        .footer-seal-container {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--border-light);
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 25px;
            align-items: center;
            break-inside: avoid;
        }
        .attestation-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .attestation-title {
            font-size: 11px;
            font-weight: 800;
            color: var(--gocar-blue);
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }
        .attestation-body {
            font-size: 10.5px;
            color: var(--text-gray);
            line-height: 1.55;
            max-width: 480px;
        }
        .stamp-box {
            border: 2px dashed var(--gocar-orange);
            border-radius: 10px;
            padding: 12px 18px;
            text-align: center;
            min-width: 170px;
            background: #fffaf5;
        }
        .stamp-title {
            font-size: 9.5px;
            font-weight: 900;
            color: var(--gocar-orange);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stamp-code {
            font-size: 10.5px;
            font-family: monospace;
            font-weight: 800;
            color: var(--gocar-blue);
            margin-top: 3px;
        }

        .disclaimer-footer {
            margin-top: 25px;
            text-align: center;
            font-size: 10px;
            color: var(--text-muted);
            border-top: 1px solid var(--border-light);
            padding-top: 15px;
        }
    </style>
</head>
<body>
    <div class="no-print-bar no-print">
        <button onclick="window.print()" class="btn-print">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            PRINT / SAVE PDF
        </button>
    </div>

    <div class="passport-wrapper">
        <!-- Header -->
        <div class="header">
            <div class="brand-section">
                ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="GoCar Auto">` : `<div class="brand-fallback">GOCAR AUTO</div>`}
                <div class="company-details">
                    <strong>Certified Automotive Maintenance & Service Center</strong><br>
                    Cairo, Egypt • Registered Workshop Network<br>
                    +20 106 661 5092 | +20 106 780 0008<br>
                    go2carauto@gmail.com • gocarauto.vercel.app
                </div>
            </div>
            <div class="doc-meta">
                <h1 class="doc-title">SERVICE PASSPORT</h1>
                <p class="passport-number">#${escapeHtml(passportNumber)}</p>
                <p class="doc-date">Certified on: ${escapeHtml(generatedDate)}</p>
            </div>
        </div>

        <!-- Privacy Shield Banner -->
        <div class="privacy-banner">
            <div class="privacy-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                </svg>
                PRIVACY SHIELD VERIFIED
            </div>
            <div class="privacy-text">
                Owner Identity Confidential • Redacted for vehicle resale protection & GDPR compliance
            </div>
        </div>

        <!-- Vehicle Identity Info Grid (matching Invoice 6px orange border theme) -->
        <div class="info-grid">
            <div class="info-block">
                <div class="info-label">VEHICLE</div>
                <div class="info-value">${escapeHtml(vehicleName)}</div>
            </div>
            <div class="info-block">
                <div class="info-label">YEAR MODEL</div>
                <div class="info-value">${escapeHtml(vehicle.year || '—')}</div>
            </div>
            <div class="info-block">
                <div class="info-label">PLATE / LICENSE</div>
                <div class="info-value">${escapeHtml(vehicle.license_plate || '—')}</div>
            </div>
            <div class="info-block">
                <div class="info-label">CHASSIS (VIN)</div>
                <div class="info-value">${escapeHtml(vehicle.vin || '—')}</div>
            </div>

            <div class="info-block">
                <div class="info-label">VERIFIED ODOMETER</div>
                <div class="info-value-gold">${escapeHtml(verifiedMileage)}</div>
            </div>
            <div class="info-block">
                <div class="info-label">COMPLETED VISITS</div>
                <div class="info-value">${totalRecords} Logged Entries</div>
            </div>
            <div class="info-block">
                <div class="info-label">LAST INSPECTION</div>
                <div class="info-value">${escapeHtml(vehicle.last_service_date || generatedDate)}</div>
            </div>
            <div class="info-block">
                <div class="info-label">PEDIGREE STATUS</div>
                <div class="info-value-emerald">✓ Certified Active</div>
            </div>
        </div>

        <!-- Service History Ledger Table -->
        <div class="section-header">
            <h2 class="section-title">CERTIFIED SERVICE & INSPECTION LOGBOOK</h2>
            <div class="section-subtitle">${totalRecords} itemized operational records</div>
        </div>

        <table>
            <thead>
                <tr>
                    <th class="col-date">DATE</th>
                    <th class="col-mileage">ODOMETER</th>
                    <th>SERVICE & REPLACEMENT PARTS</th>
                    <th class="col-category">CATEGORY</th>
                </tr>
            </thead>
            <tbody>
                ${records.length === 0 ? `
                    <tr>
                        <td colspan="4" class="empty-records">
                            No recorded service items found for this vehicle.
                        </td>
                    </tr>
                ` : records.map(r => {
                    const rawTitle = r.item_name_ar || r.item_name || r.service_type || 'General Service';
                    const isArabic = /[\u0600-\u06FF]/.test(rawTitle);
                    const mileageDisplay = r.mileage ? `${parseInt(r.mileage, 10).toLocaleString()} KM` : '—';
                    const formattedDate = r.service_date ? escapeHtml(r.service_date) : '—';
                    const category = r.category || 'Service';

                    return `
                    <tr>
                        <td class="col-date">${formattedDate}</td>
                        <td class="col-mileage">${escapeHtml(mileageDisplay)}</td>
                        <td class="${isArabic ? 'arabic-text' : ''}">${escapeHtml(rawTitle)}</td>
                        <td class="col-category">
                            <span class="category-pill">${escapeHtml(category)}</span>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <!-- Footer Attestation & Ledger Stamp -->
        <div class="footer-seal-container">
            <div class="attestation-block">
                <div class="attestation-title">OFFICIAL GOCAR QUALITY ATTESTATION</div>
                <div class="attestation-body">
                    This document certifies that the vehicle identified above has undergone routine preventative maintenance, certified parts replacements, and mechanical diagnostics under the supervision of GoCar Auto. All recorded maintenance intervals are verified against original workshop ledger tickets.
                </div>
            </div>
            <div class="stamp-box">
                <div class="stamp-title">AUTHENTICATED LEDGER</div>
                <div class="stamp-code">${escapeHtml(passportNumber)}</div>
            </div>
        </div>

        <div class="disclaimer-footer">
            GoCar Auto Certified Vehicle Ledger • Cairo, Egypt • Independent Buyer Verification Available
        </div>
    </div>
</body>
</html>`;
}
