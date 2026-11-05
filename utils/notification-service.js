import nodemailer from 'nodemailer';

let emailTransporter = null;

/**
 * Initialize the email transporter using environment credentials.
 */
export function initializeEmailTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        emailTransporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
}

// Initial session setup
initializeEmailTransporter();

/**
 * Send an email notification.
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} message - Email content.
 */
export async function sendEmail(to, subject, message) {
    if (!emailTransporter) {
        console.warn('Email transporter not configured. Email not sent.');
        return { success: false, message: 'Email service not configured' };
    }

    try {
        // GOCAR-SEC-07: Escape HTML special characters to prevent unescaped HTML injection in emails
        const safeHtmlMessage = String(message || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');

        const info = await emailTransporter.sendMail({
            from: `"${process.env.COMPANY_NAME || 'GoCar Auto'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: message,
            html: `<p>${safeHtmlMessage}</p>`
        });

        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('SERVER_NOTIFICATION_ERROR:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Main notification dispatcher.
 * @param {Object} options - Notification parameters.
 */
export async function sendNotification(options) {
    const { type, message, email } = options;

    const results = { email: null };

    if (email) {
        const subject = getSubjectForType(type);
        results.email = await sendEmail(email, subject, message);
    }

    return results;
}

/**
 * Helper: Map notification types to localized subjects.
 */
function getSubjectForType(type) {
    const subjects = {
        'NextServiceDue': 'Service Reminder - Your Vehicle is Due for Service',
        'PartArrival': 'Part Arrival Notification',
        'PaymentReminder': 'Payment Reminder',
        'Other': 'Notification from ' + (process.env.COMPANY_NAME || 'GoCar Auto')
    };

    return subjects[type] || subjects['Other'];
}

/**
 * Placeholder for automated reminder logic.
 */
export async function scheduleServiceReminders() {
    console.log('Service reminder scheduler triggered.');
}
