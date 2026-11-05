// staff-interface/src/utils/whatsapp.js

/**
 * Formats a raw phone number string to a standard WhatsApp-ready format.
 * Prepends the Egypt country code (+20) by default if it's missing.
 * @param {string} phone - The raw phone number
 * @param {string} defaultCountryCode - The default country code to prepend
 * @returns {string} The formatted phone number
 */
export const formatWhatsAppNumber = (phone, defaultCountryCode = '20') => {
    if (!phone) return '';

    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If the number starts with '01', it's likely an Egyptian mobile number
    // Remove the leading '0' and prepend the country code
    if (cleaned.startsWith('01') && cleaned.length === 11) {
        cleaned = `${defaultCountryCode}${cleaned.substring(1)}`;
    }
    // If it's exactly 10 digits and starts with 1, assume it's Egyptian missing the 0
    else if (cleaned.startsWith('1') && cleaned.length === 10) {
        cleaned = `${defaultCountryCode}${cleaned}`;
    }
    // If it doesn't start with the default code and isn't a short code, prepend it
    // Wait, let's just do a simple check: if it's 10 digits or 11 starting with 0, prepend 20

    return cleaned;
};

/**
 * Generates the Customer Portal Invite Message
 * @param {string} customerName
 * @param {string} customerId
 * @param {string} customUrl - Optional magic link or custom URL
 * @returns {string} The URL-encoded message
 */
export const generatePortalInviteMessage = (customerName, customerId, customUrl = null) => {
    // Assuming the portal is hosted on a specific domain. For local testing, we use localhost or a placeholder.
    // In production, this should come from an environment variable.
    const portalUrl = customUrl || import.meta.env.VITE_CUSTOMER_PORTAL_URL || window.location.origin.replace('5173', '5174');

    // Using WhatsApp Markdown: *Bold* _Italic_ ~Strikethrough~
    const message =
        `*Welcome to GoCar Auto, ${customerName}!* 🚗💨

We've set up your personal Customer Portal where you can:
📋 View your service history
💸 Download invoices
🔔 Get maintenance reminders

*Access your portal here:*
${portalUrl}

(If you need to log in, please use this number or your registered email).

We're always here to keep your vehicle running smoothly!
_The GoCar Auto Team_`;

    return encodeURIComponent(message);
};

/**
 * Opens a WhatsApp Web chat in a new tab with a pre-filled message.
 * @param {string} phone - The raw phone number
 * @param {string} message - The unencoded message text
 */
export const openWhatsApp = (phone, message) => {
    const formattedPhone = formatWhatsAppNumber(phone);
    if (!formattedPhone) {
        alert('Valid phone number not found.');
        return;
    }

    const url = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
};
