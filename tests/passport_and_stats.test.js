import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { generatePassportHTML } from '../utils/passport-viewer.js';
import { generateServicePassportPDF, closePDFBrowser } from '../utils/pdf-generator.js';

test('Service Passport HTML & PDF Generation', async (t) => {
    after(async () => {
        await closePDFBrowser();
    });

    await t.test('generatePassportHTML renders invoice theme styling and Arabic items without mojibake', () => {
        const sampleData = {
            vehicle: {
                id: 41,
                make: 'Hyundai',
                model: 'Elantra HD',
                year: 2017,
                license_plate: '—',
                vin: '—',
                current_mileage: 276808,
                last_service_date: '2026-09-12'
            },
            records: [
                { service_date: '2026-09-12', mileage: 276808, item_name: 'الاكسدام كامل', category: 'Bodywork' },
                { service_date: '2026-09-12', mileage: 276808, item_name: 'اوكرة باب امامي داخلي', category: 'Parts' }
            ],
            passportId: 'GCP-41-AUT-2026'
        };

        const html = generatePassportHTML(sampleData);
        assert.ok(html.includes('SERVICE PASSPORT'), 'Contains document title');
        assert.ok(html.includes('#0b192c'), 'Contains GoCar navy theme color');
        assert.ok(html.includes('#f97316'), 'Contains GoCar amber/orange theme color');
        assert.ok(html.includes('Cairo'), 'Includes Cairo Arabic font');
        assert.ok(html.includes('الاكسدام كامل'), 'Includes Arabic item text intact');
        assert.ok(html.includes('276,808 KM'), 'Includes formatted mileage');
        assert.ok(html.includes('window.print()'), 'Includes print button action');
    });

    await t.test('generateServicePassportPDF outputs valid PDF buffer', async () => {
        const sampleData = {
            vehicle: { id: 41, make: 'Hyundai', model: 'Elantra HD', year: 2017, current_mileage: 276808 },
            records: [
                { service_date: '2026-09-12', mileage: 276808, item_name: 'الاكسدام كامل', category: 'Bodywork' }
            ],
            passportId: 'GCP-41-AUT-2026'
        };

        const pdfBuffer = await generateServicePassportPDF(sampleData);
        assert.ok(Buffer.isBuffer(pdfBuffer), 'Result is a Buffer');
        assert.ok(pdfBuffer.length > 1000, 'PDF buffer has content');
        assert.equal(pdfBuffer.slice(0, 4).toString(), '%PDF', 'Buffer starts with %PDF header');
    });
});
