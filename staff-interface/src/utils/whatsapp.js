// staff-interface/src/utils/whatsapp.js

/**
 * Formats a raw phone number string to a standard WhatsApp-ready format.
 * Prepends the Egypt country code (20) by default if it's missing.
 * @param {string} phone - The raw phone number
 * @param {string} defaultCountryCode - The default country code to prepend
 * @returns {string} The formatted phone number (digits only, e.g. 201012345678)
 */
export const formatWhatsAppNumber = (phone, defaultCountryCode = '20') => {
    if (!phone) return '';

    // Remove all non-numeric characters
    let cleaned = phone.toString().replace(/\D/g, '');

    // Egyptian mobile numbers start with '01' and are 11 digits (e.g. 01012345678)
    // Strip leading '0' and prepend country code 20 -> 201012345678
    if (cleaned.startsWith('01') && cleaned.length === 11) {
        cleaned = `${defaultCountryCode}${cleaned.substring(1)}`;
    }
    // Egyptian mobile missing leading zero (10 digits starting with 1) -> 201012345678
    else if (cleaned.startsWith('1') && cleaned.length === 10) {
        cleaned = `${defaultCountryCode}${cleaned}`;
    }
    // Egyptian numbers starting with '0020'
    else if (cleaned.startsWith('0020')) {
        cleaned = cleaned.substring(2);
    }

    return cleaned;
};

/**
 * Formats raw phone number into clean local Egyptian mobile display (e.g. 01001721019)
 * for customer-friendly username display.
 * @param {string} rawPhone
 * @returns {string} Local 11-digit phone format
 */
export const formatDisplayPhone = (rawPhone) => {
    if (!rawPhone) return '';
    const digits = rawPhone.toString().replace(/\D/g, '');
    if (digits.startsWith('201') && digits.length === 12) {
        return `0${digits.substring(2)}`;
    }
    if (digits.startsWith('01') && digits.length === 11) {
        return digits;
    }
    if (digits.startsWith('1') && digits.length === 10) {
        return `0${digits}`;
    }
    return rawPhone.toString().trim();
};

/**
 * Builds the unencoded, cleanly formatted bilingual WhatsApp onboarding message.
 * Strict WhatsApp Markdown:
 *   *bold* (single asterisk)
 *   _italic_ (single underscore)
 *   `code` (inline monospace for phone/username)
 * Clean BMP Unicode symbols (►, •, ━) that NEVER corrupt during browser/wa.me redirects.
 *
 * @param {string} customerName
 * @param {string} customerPhone
 * @param {string} magicLink
 * @returns {string} Clean plain text ready for WhatsApp without corrupted emojis
 */
export const buildPortalInviteMessage = (customerName, customerPhone, magicLink = null) => {
    const livePortalUrl = 'https://gocarauto.vercel.app';
    const directAccessLink = magicLink || `${livePortalUrl}/login`;
    const localPhone = formatDisplayPhone(customerPhone);
    const rawPhone = (customerPhone || '').toString().trim();
    const phoneDisplay = localPhone && rawPhone && localPhone !== rawPhone
        ? `\`${localPhone}\` (أو \`${rawPhone}\`)`
        : `\`${localPhone || rawPhone}\``;
    const phoneDisplayEn = localPhone && rawPhone && localPhone !== rawPhone
        ? `\`${localPhone}\` (or \`${rawPhone}\`)`
        : `\`${localPhone || rawPhone}\``;

    const arName = customerName && customerName.trim() ? customerName.trim() : 'عميلنا العزيز';
    const enName = customerName && customerName.trim() ? customerName.trim() : 'Valued Customer';

    return (
`مرحباً بك في جوكار أوتو، *${arName}*

تم تجهيز حسابك على بوابة العملاء لمتابعة سياراتك وخدمات الصيانة بسهولة:
• سجل الصيانة الشامل
• فواتير الصيانة والضمان
• حجز وتحديد مواعيد الصيانة

► *رابط الدخول المباشر (سري لمرة واحدة):*
${directAccessLink}

► *رابط بوابة العملاء الدائم:*
${livePortalUrl}

► *اسم المستخدم لتسجيل الدخول مستقبلاً:*
رقم هاتفك: ${phoneDisplay}

*(عند أول دخول عبر الرابط، يرجى تعيين كلمة المرور الخاصة بك لتأمين حسابك)*

━━━━━━━━━━━━━━━━━━━━

*Welcome to GoCar Auto, ${enName}!*

Your personal customer portal is ready for your vehicle maintenance:
• Complete service records
• Maintenance invoices & warranties
• Service scheduling & appointments

► *Your 1-Tap Direct Access Link:*
${directAccessLink}

► *Permanent Customer Portal URL:*
${livePortalUrl}

► *Your Future Login Username:*
Mobile: ${phoneDisplayEn}

*(Upon your first login, you will be prompted to set your personal password)*

فريق جوكار أوتو | GoCar Auto Team`
    );
};

/**
 * Generates the URL-encoded Customer Portal Invite Message.
 * @param {string} customerName
 * @param {string} customerPhone
 * @param {string} magicLink - Optional magic link or custom URL
 * @returns {string} The URL-encoded message
 */
export const generatePortalInviteMessage = (customerName, customerPhone, magicLink = null) => {
    const rawMessage = buildPortalInviteMessage(customerName, customerPhone, magicLink);
    return encodeURIComponent(rawMessage);
};

/**
 * Opens a WhatsApp Web / App chat in a new tab with a pre-filled message.
 * Uses direct api.whatsapp.com/send to prevent wa.me HTTP 302 redirect character truncation.
 * @param {string} phone - The raw phone number
 * @param {string} message - The encoded or plain message text
 */
export const openWhatsApp = (phone, message) => {
    const formattedPhone = formatWhatsAppNumber(phone);
    if (!formattedPhone) {
        alert('Valid phone number not found.');
        return;
    }

    // Determine if the message needs encoding
    const encodedText = (typeof message === 'string' && (message.includes('%20') || message.includes('%0A')))
        ? message
        : encodeURIComponent(message || '');

    // Direct API endpoint bypasses wa.me redirect hop that causes 302 header character corruption
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
};
