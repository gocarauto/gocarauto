/**
 * Date Utilities for GoCar Auto
 * Standardised "Mon D YYYY" display across all portals (e.g. Nov 1 2023).
 */

/**
 * Format any date string to "Mon D YYYY" (e.g. Nov 1 2023).
 * Handles ISO strings, plain YYYY-MM-DD, and datetime strings.
 * @param {string|null} dateStr
 * @returns {string}
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    // Append time to avoid timezone-shift issues with date-only strings
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
             .replace(',', '');
};

/**
 * Returns true if the given date string is in the past.
 * @param {string} dateStr
 * @returns {boolean}
 */
export const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    return d < new Date();
};
