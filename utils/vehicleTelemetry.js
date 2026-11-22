/**
 * Vehicle Telemetry & Fluid Longevity Calculation Engine
 * Calculates real-time engine oil and transmission fluid life percentages,
 * remaining distance, temporal decay, and inspection statuses based on
 * GoCar Auto service records and maintenance reminders.
 */

/**
 * Safely parse a date value which might be a Date object, an ISO string,
 * or an Excel serial number (e.g. 45489 from legacy spreadsheets).
 * @param {string|number|Date|null|undefined} val
 * @returns {Date|null}
 */
export function parseDateSafe(val) {
    if (!val) return null;
    if (val instanceof Date) {
        return isNaN(val.getTime()) ? null : val;
    }
    // Handle Excel serial date (e.g. numbers in range 30000 - 60000)
    if (typeof val === 'number' || (!isNaN(Number(val)) && !String(val).includes('-') && !String(val).includes('/'))) {
        const num = Number(val);
        if (num > 20000 && num < 80000) {
            // Excel epoch is 1899-12-30 (25569 days to 1970-01-01)
            const ms = Math.round((num - 25569) * 86400 * 1000);
            const d = new Date(ms);
            return isNaN(d.getTime()) ? null : d;
        }
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Compute the approximate number of months between two dates.
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number} Fractional months (>= 0)
 */
export function calculateMonthsDiff(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    const days = (endDate.getDate() - startDate.getDate()) / 30.4375;
    const total = years * 12 + months + days;
    return Math.max(0, total);
}

/**
 * Classify a service item or reminder by fluid type.
 * @param {object} item
 * @returns {'ENGINE_OIL'|'TRANS_OIL'|null}
 */
export function classifyFluidType(item) {
    if (!item) return null;

    if (item.tracking_point === 'ENGINE_OIL') return 'ENGINE_OIL';
    if (item.tracking_point === 'TRANS_OIL') return 'TRANS_OIL';

    const text = [
        item.service_type || '',
        item.item_name || '',
        item.item_name_ar || '',
        item.notes || ''
    ].join(' ').toLowerCase();

    // Check transmission first (to avoid false matching generic 'oil')
    if (
        text.includes('فتيس') ||
        text.includes('جير') ||
        text.includes('ناقل') ||
        text.includes('transmission') ||
        text.includes('trans fluid') ||
        text.includes('gear oil')
    ) {
        return 'TRANS_OIL';
    }

    if (
        text.includes('موتور') ||
        text.includes('محرك') ||
        text.includes('engine') ||
        text.includes('motor') ||
        text.includes('زيت 10000') ||
        text.includes('زيت ١٠٠٠٠') ||
        text.includes('زيت 5000') ||
        text.includes('زيت ٥٠٠٠') ||
        text.includes('زيت 7000') ||
        text.includes('زيت ٧٠٠٠') ||
        text.includes('oil change') ||
        text.includes('تغيير زيت') ||
        text.includes('فلتر زيت') ||
        text.includes('oil') ||
        text.includes('زيت')
    ) {
        return 'ENGINE_OIL';
    }

    return null;
}

/**
 * Extract rated kilometer interval from record/item details.
 * Defaults to 10,000 for engine oil and 40,000 for transmission oil.
 */
export function extractIntervalKm(item, fluidType) {
    if (item && Number(item.interval_km) > 0) return Number(item.interval_km);
    if (item && Number(item.km_interval) > 0) return Number(item.km_interval);

    const text = [
        item?.service_type || '',
        item?.item_name || '',
        item?.item_name_ar || '',
        item?.notes || ''
    ].join(' ');

    if (fluidType === 'ENGINE_OIL') {
        if (/5000|٥٠٠٠/.test(text)) return 5000;
        if (/7000|٧٠٠٠/.test(text)) return 7000;
        if (/10000|١٠٠٠٠/.test(text)) return 10000;
        return 10000;
    }

    if (fluidType === 'TRANS_OIL') {
        if (/50000|٥٠٠٠٠/.test(text)) return 50000;
        if (/60000|٦٠٠٠٠/.test(text)) return 60000;
        if (/30000|٣٠٠٠٠/.test(text)) return 30000;
        return 40000;
    }

    return fluidType === 'ENGINE_OIL' ? 10000 : 40000;
}

/**
 * Extract rated month interval from record/item details.
 * Defaults to 8 months for engine oil and 24 months for transmission oil.
 */
export function extractIntervalMonths(item, fluidType) {
    if (item && Number(item.interval_months) > 0) return Number(item.interval_months);
    if (item && Number(item.month_interval) > 0) return Number(item.month_interval);
    return fluidType === 'ENGINE_OIL' ? 8 : 24;
}

/**
 * Compute real telemetry for a vehicle given its service records and reminders.
 * 
 * @param {object} vehicle Vehicle row from database
 * @param {Array<object>} serviceRecords Itemized or request-level service records for this vehicle
 * @param {Array<object>} reminders Active or pending service reminders for this vehicle
 * @param {Date} [referenceDate=new Date()] Reference date for deterministic calculation
 * @returns {object} { engine_oil, transmission_oil }
 */
export function calculateVehicleTelemetry(vehicle = {}, serviceRecords = [], reminders = [], referenceDate = new Date()) {
    const currentMileage = Number(vehicle.current_mileage) || 0;
    const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

    // Filter and group by fluid type
    const engineRecords = [];
    const transRecords = [];

    for (const rec of serviceRecords) {
        const type = classifyFluidType(rec);
        if (type === 'ENGINE_OIL') engineRecords.push(rec);
        else if (type === 'TRANS_OIL') transRecords.push(rec);
    }

    const engineReminders = [];
    const transReminders = [];

    for (const rem of reminders) {
        const type = classifyFluidType(rem);
        if (type === 'ENGINE_OIL') engineReminders.push(rem);
        else if (type === 'TRANS_OIL') transReminders.push(rem);
    }

    // Helper to calculate fluid metrics for a single fluid type
    const computeFluidMetric = (records, remList, fluidType) => {
        const defaultKm = fluidType === 'ENGINE_OIL' ? 10000 : 40000;
        const defaultMonths = fluidType === 'ENGINE_OIL' ? 8 : 24;

        // 1. Identify most recent service event
        let lastDate = null;
        let lastMileage = null;
        let intervalKm = defaultKm;
        let intervalMonths = defaultMonths;
        let matchedItem = null;
        let hasHistory = false;

        // Sort records descending by date
        const sortedRecords = [...records].sort((a, b) => {
            const dA = parseDateSafe(a.service_date || a.created_at) || new Date(0);
            const dB = parseDateSafe(b.service_date || b.created_at) || new Date(0);
            return dB.getTime() - dA.getTime();
        });

        if (sortedRecords.length > 0) {
            const latest = sortedRecords[0];
            matchedItem = latest;
            lastDate = parseDateSafe(latest.service_date || latest.created_at);
            lastMileage = Number(latest.mileage) > 0 ? Number(latest.mileage) : null;
            intervalKm = extractIntervalKm(latest, fluidType);
            intervalMonths = extractIntervalMonths(latest, fluidType);
            hasHistory = true;
        }

        // Check reminders if no direct service record was found, or to enrich interval
        if (remList.length > 0) {
            const latestRem = remList[0];
            if (!hasHistory) {
                // If reminder contains parsed 'Last done' in notes, extract it
                if (latestRem.notes) {
                    const matchDate = latestRem.notes.match(/Last done:\s*(\d{4}-\d{2}-\d{2})/i);
                    if (matchDate) {
                        lastDate = parseDateSafe(matchDate[1]);
                        hasHistory = true;
                    }
                    const matchKm = latestRem.notes.match(/Mileage:\s*([\d,]+)\s*km/i);
                    if (matchKm) {
                        lastMileage = Number(matchKm[1].replace(/,/g, ''));
                    }
                }
                if (latestRem.due_date && !lastDate) {
                    // Estimate service date from due date minus interval
                    const due = parseDateSafe(latestRem.due_date);
                    if (due) {
                        const estMonths = latestRem.interval_months || defaultMonths;
                        lastDate = new Date(due);
                        lastDate.setMonth(lastDate.getMonth() - estMonths);
                        hasHistory = true;
                    }
                }
            }

            if (latestRem.interval_km && Number(latestRem.interval_km) > 0) {
                intervalKm = Number(latestRem.interval_km);
            }
            if (latestRem.interval_months && Number(latestRem.interval_months) > 0) {
                intervalMonths = Number(latestRem.interval_months);
            }
        }

        // Fallback: If vehicle has last_service_date but no explicit oil record,
        // and vehicle has logged services, use vehicle.last_service_date for engine oil
        if (!hasHistory && fluidType === 'ENGINE_OIL' && vehicle.last_service_date && Number(vehicle.services_count) > 0) {
            lastDate = parseDateSafe(vehicle.last_service_date);
            lastMileage = Number(vehicle.last_service_mileage) > 0 ? Number(vehicle.last_service_mileage) : null;
            if (lastDate) {
                hasHistory = true;
            }
        }

        // If no history at all for this vehicle
        if (!hasHistory || !lastDate) {
            return {
                fluid_type: fluidType,
                has_history: false,
                life_percent: null,
                km_remaining: null,
                km_driven: null,
                last_service_date: null,
                last_service_mileage: null,
                interval_km: intervalKm,
                interval_months: intervalMonths,
                due_date: null,
                status: 'untracked'
            };
        }

        // 2. Compute degradation by Distance
        let kmDriven = null;
        let mileageLifePct = null;
        if (lastMileage !== null && currentMileage >= lastMileage) {
            kmDriven = Math.max(0, currentMileage - lastMileage);
            const remainingKm = Math.max(0, intervalKm - kmDriven);
            mileageLifePct = Math.max(0, Math.min(100, Math.round((remainingKm / intervalKm) * 100)));
        }

        // 3. Compute degradation by Time
        const monthsElapsed = calculateMonthsDiff(lastDate, now);
        const remainingMonths = Math.max(0, intervalMonths - monthsElapsed);
        const timeLifePct = Math.max(0, Math.min(100, Math.round((remainingMonths / intervalMonths) * 100)));

        // 4. Combined Life Percentage
        let lifePercent;
        if (mileageLifePct !== null) {
            // Both distance and time are tracked: oil degrades with whichever comes first
            // If vehicle has barely been driven since service (<= 50 km) and under 15 days elapsed, preserve 100%
            if (kmDriven <= 50 && monthsElapsed <= 0.5) {
                lifePercent = 100;
            } else {
                lifePercent = Math.min(mileageLifePct, timeLifePct);
            }
        } else {
            // Distance not tracked or odometer not yet updated: use time decay with fresh grace window
            if (monthsElapsed <= 0.25) {
                lifePercent = 100;
            } else {
                lifePercent = timeLifePct;
            }
        }

        // 5. Remaining Km & Due Date
        let kmRemaining;
        if (kmDriven !== null) {
            kmRemaining = Math.max(0, intervalKm - kmDriven);
        } else {
            kmRemaining = Math.max(0, Math.round(intervalKm * (lifePercent / 100)));
        }

        const dueDateObj = new Date(lastDate);
        dueDateObj.setMonth(dueDateObj.getMonth() + intervalMonths);
        const dueDate = dueDateObj.toISOString().split('T')[0];

        // 6. Status Classification
        let status = 'good';
        if (lifePercent <= 10 || kmRemaining <= 0 || now > dueDateObj) {
            status = 'critical';
        } else if (lifePercent <= 30 || kmRemaining <= (intervalKm * 0.2)) {
            status = 'warning';
        }

        return {
            fluid_type: fluidType,
            has_history: true,
            life_percent: lifePercent,
            km_remaining: kmRemaining,
            km_driven: kmDriven,
            last_service_date: lastDate.toISOString().split('T')[0],
            last_service_mileage: lastMileage,
            interval_km: intervalKm,
            interval_months: intervalMonths,
            due_date: dueDate,
            status
        };
    };

    return {
        engine_oil: computeFluidMetric(engineRecords, engineReminders, 'ENGINE_OIL'),
        transmission_oil: computeFluidMetric(transRecords, transReminders, 'TRANS_OIL')
    };
}
