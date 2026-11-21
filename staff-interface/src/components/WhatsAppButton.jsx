import React, { useState } from 'react';
import { openWhatsApp, generatePortalInviteMessage } from '../utils/whatsapp';
import { MessageCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

const WhatsAppButton = ({
    phone,
    customerName,
    clientName,
    customerId,
    size = 'sm',
    showText = true,
    magicLink = null
}) => {
    const [loading, setLoading] = useState(false);
    const resolvedName = customerName || clientName || 'Client';

    const handleSendInvite = async (e) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }

        if (!phone) {
            alert('No phone number available for this client.');
            return;
        }

        let link = magicLink;

        // If magicLink wasn't pre-fetched, fetch a fresh 30-day token on the fly
        if (!link && customerId) {
            try {
                setLoading(true);
                const response = await api.get(`/clients/${customerId}/magic-link`);
                if (response.data?.data?.url) {
                    link = response.data.data.url;
                }
            } catch (err) {
                console.error('Failed to generate magic link on the fly:', err);
            } finally {
                setLoading(false);
            }
        }

        const encodedMessage = generatePortalInviteMessage(resolvedName, phone, link);
        openWhatsApp(phone, encodedMessage);
    };

    const isSmall = size === 'sm';

    return (
        <button
            type="button"
            onClick={handleSendInvite}
            disabled={loading}
            title={`Send WhatsApp Onboarding Invite to ${resolvedName}`}
            className={`
                flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm
                bg-[#25D366]/10 border border-[#25D366]/30 text-green-700 dark:text-[#25D366] 
                hover:bg-[#25D366]/20 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)]
                ${isSmall ? 'h-10 px-3 text-xs' : 'h-12 px-6 text-xs'}
                font-black uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            `}
        >
            {loading ? (
                <Loader2 size={isSmall ? 16 : 18} className="animate-spin text-green-600 dark:text-[#25D366]" />
            ) : (
                <MessageCircle size={isSmall ? 16 : 18} />
            )}
            {showText && <span>{loading ? 'LINKING...' : 'INVITE'}</span>}
        </button>
    );
};

export default WhatsAppButton;
