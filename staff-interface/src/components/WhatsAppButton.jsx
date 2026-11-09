import React from 'react';
import { openWhatsApp, generatePortalInviteMessage } from '../utils/whatsapp';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ phone, customerName, customerId, size = 'sm', showText = true, magicLink = null }) => {

    const handleSendInvite = () => {
        if (!phone) {
            alert('No phone number available for this client.');
            return;
        }

        const encodedMessage = generatePortalInviteMessage(customerName, customerId, magicLink);
        openWhatsApp(phone, encodedMessage);
    };

    const isSmall = size === 'sm';
    
    return (
        <button
            onClick={handleSendInvite}
            title={`Send WhatsApp Invite to ${customerName}`}
            className={`
                flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm
                bg-[#25D366]/10 border border-[#25D366]/30 text-green-700 dark:text-[#25D366] 
                hover:bg-[#25D366]/20 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)]
                ${isSmall ? 'h-10 px-3 text-[10px]' : 'h-12 px-6 text-xs'}
                font-black uppercase tracking-widest
            `}
        >
            <MessageCircle size={isSmall ? 16 : 18} />
            {showText && <span>INVITE</span>}
        </button>
    );
};

export default WhatsAppButton;
