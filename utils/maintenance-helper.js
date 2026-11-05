import database from '../database/db.js';

/**
 * Update the vehicle maintenance ledger based on service job results.
 * Tracks operational thresholds (KM/Months) for individual tracking points.
 * @param {string|number} requestId - Unique ID of the completed service request.
 */
export async function updateMaintenanceLedger(requestId) {
    try {
        const request = await database.get(
            'SELECT vehicle_id, mileage, request_date, created_at FROM service_requests WHERE id = ?',
            [requestId]
        );

        if (!request) return;

        const vehicleId = request.vehicle_id;
        const currentMileage = request.mileage || 0;
        const currentDate = request.request_date || request.created_at.split(' ')[0];

        const records = await database.query(
            `SELECT sr.item_id, si.tracking_point, si.km_interval, si.month_interval
             FROM service_records sr
             JOIN service_items si ON sr.item_id = si.id
             WHERE sr.request_id = ? AND si.tracking_point IS NOT NULL`,
            [requestId]
        );

        if (records.length === 0) return;

        for (const record of records) {
            const { tracking_point, km_interval, month_interval } = record;

            let nextDueDate = null;
            if (month_interval > 0) {
                const date = new Date(currentDate);
                date.setMonth(date.getMonth() + month_interval);
                nextDueDate = date.toISOString().split('T')[0];
            }

            let nextDueMileage = null;
            if (km_interval > 0) {
                nextDueMileage = (currentMileage || 0) + km_interval;
            }

            await database.run(
                `INSERT INTO vehicle_maintenance_ledger (
                    vehicle_id, tracking_point, last_service_id, last_mileage, last_date, 
                    next_due_mileage, next_due_date, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(vehicle_id, tracking_point) DO UPDATE SET
                    last_service_id = excluded.last_service_id,
                    last_mileage = excluded.last_mileage,
                    last_date = excluded.last_date,
                    next_due_mileage = excluded.next_due_mileage,
                    next_due_date = excluded.next_due_date,
                    updated_at = CURRENT_TIMESTAMP`,
                [vehicleId, tracking_point, requestId, currentMileage, currentDate, nextDueMileage, nextDueDate]
            );
        }
    } catch (error) {
        console.error('SERVER_MAINTENANCE_LOGIC_ERROR:', error);
    }
}

/**
 * Canonicalize service type strings into standard Arabic category labels.
 * Ensures consistent matching across cron jobs, invoices, smart scans, and manual creation.
 * @param {string} type - Raw service type, tracking point, or service item description.
 * @returns {string} Canonical Arabic service label.
 */
export function canonicalizeServiceType(type) {
    if (!type) return 'صيانة دورية';
    const t = String(type).trim().replace(/^['\"]|['\"]$/g, '').trim();
    const lower = t.toLowerCase();

    // 1. Transmission Oil
    if (
        t === 'TRANS_OIL' ||
        t.includes('فتيس') ||
        t.includes('جير') ||
        lower.includes('trans') ||
        lower.includes('gear')
    ) {
        return 'تغيير زيت الفتيس';
    }

    // 2. Engine Mounts & Suspension
    if (t.includes('قواعد') || t.includes('مساعدين') || lower.includes('mount') || lower.includes('suspension')) {
        return 'تغيير قواعد الموتور والمساعدين';
    }

    // 3. Drive / Serpentine Belt
    if (t.includes('سير') || lower.includes('belt')) {
        return 'تغيير سير المجموعة';
    }

    // 4. Brake Fluid
    if (t.includes('فرامل') || lower.includes('brake')) {
        return 'تغيير زيت الفرامل';
    }

    // 5. Filters
    if (t.includes('فلاتر') || lower.includes('filter')) {
        return 'تغيير الفلاتر';
    }

    // 6. Engine Oil
    if (
        t === 'ENGINE_OIL' ||
        t.includes('زيت موتور') ||
        t.includes('زيت المحرك') ||
        t.includes('موتور') ||
        t.includes('محرك') ||
        t.includes('10000') ||
        t.includes('5000') ||
        t.includes('كاسترول') ||
        t.includes('توتال') ||
        t.includes('رزويل') ||
        lower.includes('engine') ||
        lower.includes('motor') ||
        lower.includes('oil')
    ) {
        return 'تغيير زيت الموتور';
    }

    // 7. General Periodic Maintenance
    if (lower === 'maintenance' || t === 'صيانة دورية' || lower.includes('periodic')) {
        return 'صيانة دورية';
    }

    return t;
}
