import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    Bell, MessageCircle, Search, Trash2, CheckCircle2, Filter, AlertTriangle, Send,
    Scan, Users, Zap, RefreshCw, BarChart3, ChevronDown, ChevronUp,
    Download, FileText, Globe, Sheet, Plus, Phone, Calendar, Clock, Wrench, X, Copy, Check,
    ExternalLink, ArrowRight, History, Sparkles
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

// ─── Normalization & Translation Helpers ──────────────────────────────────────────
export const normalizeServiceType = (type) => {
    if (!type) return 'صيانة دورية';
    const t = type.trim();
    if (t === 'ENGINE_OIL' || t.includes('موتور') || t.includes('محرك')) return 'تغيير زيت الموتور';
    if (t === 'TRANS_OIL' || t.includes('فتيس') || t.includes('جير')) return 'تغيير زيت الفتيس';
    if (t.toLowerCase() === 'maintenance') return 'صيانة دورية';
    return t;
};

export const getServiceTypeEn = (type) => {
    const norm = normalizeServiceType(type);
    if (norm === 'تغيير زيت الموتور') return 'Engine Oil Service';
    if (norm === 'تغيير زيت الفتيس') return 'Transmission Oil Service';
    if (norm === 'صيانة دورية') return 'Periodic Maintenance';
    return norm;
};

// Clean phone to numeric Egyptian international format (e.g. 201xxxxxxxxx) for WhatsApp API
export const getCleanWhatsAppPhone = (phone) => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('01')) {
        digits = '2' + digits; // 01012345678 -> 201012345678
    } else if (digits.startsWith('1') && digits.length === 10) {
        digits = '20' + digits;
    }
    return digits;
};

export const getDisplayPhone = (phone) => {
    if (!phone) return '—';
    return phone;
};

const ServiceRemindersModule = () => {
    const navigate = useNavigate();

    // Data states
    const [reminders, setReminders] = useState([]);
    const [sentReminders, setSentReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState('all'); // all, overdue, due_7d, due_30d, upcoming
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Tabs: 'active' | 'sent' | 'prospects'
    const [activeTab, setActiveTab] = useState('active');

    // Single Template Modal & Multi-template selection
    const [activeTemplateReminder, setActiveTemplateReminder] = useState(null);
    const [activeTemplateType, setActiveTemplateType] = useState('standard'); // 'standard' | 'urgent' | 'promo'
    const [customMessage, setCustomMessage] = useState('');
    const [copied, setCopied] = useState(false);

    // Bulk WhatsApp State
    const [bulkQueue, setBulkQueue] = useState([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Inline Date Reschedule State
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState("");

    // Smart Scan state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [prospects, setProspects] = useState([]);
    const [showAnalytics, setShowAnalytics] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef(null);

    // New Reminder Modal
    const [showNewReminderModal, setShowNewReminderModal] = useState(false);
    const [allClients, setAllClients] = useState([]);
    const [clientVehicles, setClientVehicles] = useState([]);
    const [newReminderForm, setNewReminderForm] = useState({
        clientId: '',
        vehicleId: '',
        serviceType: 'تغيير زيت الموتور',
        dueDate: '',
        intervalKm: 10000,
        intervalMonths: 6,
        notes: ''
    });
    const [isSavingNew, setIsSavingNew] = useState(false);

    useEffect(() => {
        fetchReminders();
        fetchSentReminders();
        fetchClientsList();
    }, []);

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reminders/all?status=Pending');
            const raw = response.data.data || [];
            const seen = new Set();
            const unique = [];
            for (const r of raw) {
                const key = `${r.vehicle_id}_${normalizeServiceType(r.service_type)}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(r);
                }
            }
            setReminders(unique);
        } catch (error) {
            console.error('Failed to fetch active reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSentReminders = async () => {
        try {
            const response = await api.get('/reminders/all?status=Sent');
            setSentReminders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch sent reminders:', error);
        }
    };

    const fetchClientsList = async () => {
        try {
            const response = await api.get('/clients');
            setAllClients(response.data.data || []);
        } catch (error) {
            console.error('Failed to load clients list:', error);
        }
    };

    const handleClientChange = async (clientId) => {
        setNewReminderForm(prev => ({ ...prev, clientId, vehicleId: '' }));
        if (!clientId) {
            setClientVehicles([]);
            return;
        }
        try {
            const res = await api.get(`/clients/${clientId}`);
            setClientVehicles(res.data.data?.vehicles || []);
        } catch (e) {
            console.error('Failed to load client vehicles', e);
        }
    };

    const handleCreateNewReminder = async (e) => {
        e.preventDefault();
        if (!newReminderForm.clientId || !newReminderForm.vehicleId || !newReminderForm.dueDate) {
            alert('Please select client, vehicle, and due date.');
            return;
        }
        setIsSavingNew(true);
        try {
            await api.post('/reminders', {
                clientId: newReminderForm.clientId,
                vehicleId: newReminderForm.vehicleId,
                serviceType: newReminderForm.serviceType,
                dueDate: newReminderForm.dueDate,
                notes: newReminderForm.notes,
                status: 'Pending',
                intervalKm: parseInt(newReminderForm.intervalKm) || null,
                intervalMonths: parseInt(newReminderForm.intervalMonths) || null
            });
            setShowNewReminderModal(false);
            setNewReminderForm({
                clientId: '',
                vehicleId: '',
                serviceType: 'تغيير زيت الموتور',
                dueDate: '',
                intervalKm: 10000,
                intervalMonths: 6,
                notes: ''
            });
            fetchReminders();
        } catch (err) {
            console.error('Failed to create reminder', err);
            alert('Failed to register reminder.');
        } finally {
            setIsSavingNew(false);
        }
    };

    const handleSmartScan = async () => {
        setIsScanning(true);
        setScanResult(null);
        try {
            const response = await api.post('/reminders/smart-scan');
            const data = response.data.data;
            setScanResult(data);
            setProspects(data.prospects || []);
            await fetchReminders();
            setTimeout(() => setScanResult(null), 8000);
        } catch (error) {
            console.error('Smart scan failed:', error);
            setScanResult({ error: true });
            setTimeout(() => setScanResult(null), 5000);
        } finally {
            setIsScanning(false);
        }
    };

    // ─── WhatsApp Template Builders ───────────────────────────────────────────
    const buildMessage = (reminder, templateType = 'standard') => {
        const customerName = reminder.client_name || '';
        const carModel = `${reminder.make || ''} ${reminder.model || ''}`.trim() || 'سيارتك';
        const serviceNameAr = normalizeServiceType(reminder.service_type);
        
        let lastDateFormatted = null;
        if (reminder.notes) {
            let match = reminder.notes.match(/Last done:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
                     || reminder.notes.match(/Last:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
                     || reminder.notes.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
            if (match) {
                const d = new Date(`${match[1]}T00:00:00`);
                lastDateFormatted = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
            }
        }

        const lastServiceLine = lastDateFormatted ? `\n🔹 آخر صيانة مسجلة: ${lastDateFormatted}` : '';

        if (templateType === 'urgent') {
            return `⚠️ تنبيه صيانة هامة من GoCar Auto\n\nعميلنا العزيز ${customerName}،\nنود إعلامك أن موعد ${serviceNameAr} لسيارتك ${carModel} قد تجاوز الفترة المحددة.${lastServiceLine}\n\nالحرص على استبدال الزيوت والفلاتر في موعدها يقي المحرك وناقل الحركة من التآكل وتكاليف الصيانة المرتفعة.\n\n📅 لحجز ميعادك المناسب تفضل بالرد على هذه الرسالة أو الاتصال بنا مباشرة.`;
        }

        if (templateType === 'promo') {
            return `🌟 عرض خاص من مركز GoCar Auto للصيانة\n\nعميلنا العزيز ${customerName}، بمناسبة موعد ${serviceNameAr} لسيارتك ${carModel}، يسعدنا تقديم:\n✅ فحص أمان مجاني شامل لـ 20 نقطة حيوية.\n✅ كشف سوائل الفرامل والرادياتير والبطارية مجاناً.\n\n📅 لحجز الميعاد والاستفادة من العرض، نسعد بتواصلك معنا بالرد على هذه الرسالة.`;
        }

        if (templateType === 'prospect') {
            return `🚗 تحية طيبة من مركز GoCar Auto لخدمات السيارات\n\nأهلاً بك عميلنا العزيز ${customerName}،\nنود الاطمئنان على سيارتك ${carModel}. يسعدنا دعوتك لزيارة المركز وعمل فحص مجاني لمستوى وحالة الزيوت وسوائل السيارة.\n\nنتشرف بزيارتك في أي وقت!`;
        }

        // Standard
        return `🚗 تذكير صيانة دورية من GoCar Auto\n\nعميلنا العزيز ${customerName}، حابين نفكرك إن سيارتك ${carModel} اقترب موعد ${serviceNameAr}.${lastServiceLine}\n\nنحن في خدمتك دائماً بأفضل زيوت وقطع غيار معتمدة وبأيدي فنيين متخصصين.\n\n📅 لحجز ميعاد الصيانة، يرجى الرد على هذه الرسالة وسيقوم فريق العمل بتأكيد حجزك فوراً.`;
    };

    const handleSingleWhatsAppClick = (reminder, initialType = 'standard') => {
        setActiveTemplateReminder(reminder);
        setActiveTemplateType(initialType);
        setCustomMessage(buildMessage(reminder, initialType));
        setCopied(false);
    };

    const handleSwitchTemplateType = (type) => {
        setActiveTemplateType(type);
        if (activeTemplateReminder) {
            setCustomMessage(buildMessage(activeTemplateReminder, type));
        }
    };

    const sendWhatsAppMessage = (phone, text) => {
        const cleanDigits = getCleanWhatsAppPhone(phone);
        if (!cleanDigits) {
            alert('Phone number missing or invalid.');
            return;
        }
        const url = `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSendSingle = () => {
        if (!activeTemplateReminder) return;
        sendWhatsAppMessage(activeTemplateReminder.client_phone, customMessage);
        
        // Log & update status to Sent
        handleMarkSent(activeTemplateReminder.id);
        setActiveTemplateReminder(null);
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(customMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleMarkSent = async (id) => {
        try {
            await api.put(`/reminders/${id}`, { status: 'Sent' });
            const item = reminders.find(r => r.id === id);
            setReminders(prev => prev.filter(r => r.id !== id));
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            if (item) {
                setSentReminders(prev => [{ ...item, status: 'Sent' }, ...prev]);
            }
        } catch (error) {
            console.error('Failed to update status to Sent:', error);
        }
    };

    const handleReactivateReminder = async (id) => {
        try {
            await api.put(`/reminders/${id}`, { status: 'Pending' });
            const item = sentReminders.find(r => r.id === id);
            setSentReminders(prev => prev.filter(r => r.id !== id));
            if (item) {
                setReminders(prev => [...prev, { ...item, status: 'Pending' }]);
            }
        } catch (error) {
            console.error('Failed to reactivate reminder:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this reminder?')) return;
        try {
            await api.delete(`/reminders/${id}`);
            setReminders(prev => prev.filter(r => r.id !== id));
            setSentReminders(prev => prev.filter(r => r.id !== id));
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Failed to delete reminder:', error);
        }
    };

    // Quick Date Reschedule Presets
    const handleQuickReschedule = async (rem, daysToAdd) => {
        try {
            const currentDue = new Date(rem.due_date);
            const targetDate = isNaN(currentDue.getTime()) ? new Date() : new Date(currentDue);
            targetDate.setDate(targetDate.getDate() + daysToAdd);
            const newDateStr = targetDate.toISOString().split('T')[0];

            await api.put(`/reminders/${rem.id}`, {
                serviceType: rem.service_type,
                dueDate: newDateStr,
                notes: rem.notes,
                status: rem.status,
                intervalKm: rem.interval_km,
                intervalMonths: rem.interval_months
            });

            setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, due_date: newDateStr } : r));
        } catch (e) {
            console.error('Failed to quick-reschedule', e);
            alert('Failed to update date');
        }
    };

    const handleSaveManualDate = async (rem) => {
        try {
            await api.put(`/reminders/${rem.id}`, {
                serviceType: rem.service_type,
                dueDate: editDate,
                notes: rem.notes,
                status: rem.status,
                intervalKm: rem.interval_km,
                intervalMonths: rem.interval_months
            });
            setEditingId(null);
            setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, due_date: editDate } : r));
        } catch (error) {
            console.error('Failed to update date:', error);
            alert('Failed to update date');
        }
    };

    // 1-Click Convert to Work Order
    const handleConvertToWorkOrder = (rem) => {
        const query = new URLSearchParams({
            clientId: rem.client_id,
            vehicleId: rem.vehicle_id,
            serviceType: normalizeServiceType(rem.service_type),
            notes: `Converted from Service Reminder #${rem.id}: ${rem.notes || ''}`
        });
        navigate(`/service-requests/new?${query.toString()}`);
    };

    // Bulk operations
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredActiveReminders.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} reminders?`)) return;
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/reminders/${id}`)));
            setReminders(prev => prev.filter(r => !selectedIds.includes(r.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Bulk delete failed:', error);
            alert('Failed to delete some reminders');
        }
    };

    const handleBulkMarkSent = async () => {
        if (!window.confirm(`Mark ${selectedIds.length} reminders as Sent?`)) return;
        try {
            await Promise.all(selectedIds.map(id => api.put(`/reminders/${id}`, { status: 'Sent' })));
            const moved = reminders.filter(r => selectedIds.includes(r.id));
            setReminders(prev => prev.filter(r => !selectedIds.includes(r.id)));
            setSentReminders(prev => [...moved.map(m => ({ ...m, status: 'Sent' })), ...prev]);
            setSelectedIds([]);
        } catch (error) {
            console.error('Bulk mark sent failed:', error);
            alert('Failed to update some reminders');
        }
    };

    const handleStartBulkWhatsApp = () => {
        const selected = reminders.filter(r => selectedIds.includes(r.id));
        const queue = selected.map(r => ({
            reminder: r,
            message: buildMessage(r, 'standard')
        }));
        setBulkQueue(queue);
        setCurrentQueueIndex(0);
        setShowBulkModal(true);
    };

    const handleSendBulkCurrent = () => {
        const item = bulkQueue[currentQueueIndex];
        if (!item) return;

        sendWhatsAppMessage(item.reminder.client_phone, item.message);
        handleMarkSent(item.reminder.id);

        if (currentQueueIndex + 1 < bulkQueue.length) {
            setCurrentQueueIndex(prev => prev + 1);
        } else {
            setShowBulkModal(false);
            setBulkQueue([]);
            alert('Bulk Queue Completed Successfully! All selected reminders marked as Sent.');
        }
    };

    const handleSkipBulkCurrent = () => {
        if (currentQueueIndex + 1 < bulkQueue.length) {
            setCurrentQueueIndex(prev => prev + 1);
        } else {
            setShowBulkModal(false);
            setBulkQueue([]);
            alert('Bulk Queue Finished!');
        }
    };

    // ─── Filter & Analytics Calculations ───────────────────────────────────────
    const now = new Date();
    const next7d = new Date();
    next7d.setDate(now.getDate() + 7);
    const next30d = new Date();
    next30d.setDate(now.getDate() + 30);

    const filteredActiveReminders = reminders.filter(r => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
            (r.client_name || '').toLowerCase().includes(q) ||
            (r.make || '').toLowerCase().includes(q) ||
            (r.model || '').toLowerCase().includes(q) ||
            (r.license_plate || '').toLowerCase().includes(q) ||
            (r.client_phone || '').toLowerCase().includes(q) ||
            normalizeServiceType(r.service_type).toLowerCase().includes(q);

        if (!matchesSearch) return false;

        const d = new Date(r.due_date);
        if (timeFilter === 'overdue') return d < now;
        if (timeFilter === 'due_7d') return d >= now && d <= next7d;
        if (timeFilter === 'due_30d') return d >= now && d <= next30d;
        if (timeFilter === 'upcoming') return d > next30d;

        if (typeFilter !== 'all') {
            const norm = normalizeServiceType(r.service_type);
            if (typeFilter === 'engine_oil' && norm !== 'تغيير زيت الموتور') return false;
            if (typeFilter === 'trans_oil' && norm !== 'تغيير زيت الفتيس') return false;
            if (typeFilter === 'other' && (norm === 'تغيير زيت الموتور' || norm === 'تغيير زيت الفتيس')) return false;
        }

        return true;
    });

    const filteredSentReminders = sentReminders.filter(r => {
        const q = searchQuery.toLowerCase();
        return (
            (r.client_name || '').toLowerCase().includes(q) ||
            (r.make || '').toLowerCase().includes(q) ||
            (r.model || '').toLowerCase().includes(q) ||
            (r.license_plate || '').toLowerCase().includes(q) ||
            (r.client_phone || '').toLowerCase().includes(q) ||
            normalizeServiceType(r.service_type).toLowerCase().includes(q)
        );
    });

    // Counts
    const totalActive = reminders.length;
    const overdueCount = reminders.filter(r => new Date(r.due_date) < now).length;
    const dueSoonCount = reminders.filter(r => {
        const d = new Date(r.due_date);
        return d >= now && d <= next30d;
    }).length;
    const prospectsCount = prospects.length;
    const sentCount = sentReminders.length;

    // Accurate demand distribution using normalization
    const engineOilCount = reminders.filter(r => normalizeServiceType(r.service_type) === 'تغيير زيت الموتور').length;
    const transOilCount = reminders.filter(r => normalizeServiceType(r.service_type) === 'تغيير زيت الفتيس').length;

    const engineOilPct = totalActive > 0 ? Math.round((engineOilCount / totalActive) * 100) : 0;
    const transOilPct = totalActive > 0 ? Math.round((transOilCount / totalActive) * 100) : 0;

    // ─── Export Functions ──────────────────────────────────────────────────────
    const getLastServiceLabel = (notes) => {
        if (!notes) return '—';
        let m = notes.match(/Last done:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
             || notes.match(/Last:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
             || notes.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        if (!m) return notes.substring(0, 40);
        const d = new Date(m[1] + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
    };

    const getExportRows = () => filteredActiveReminders.map(r => ({
        customer:    r.client_name || '',
        vehicle:     ((r.make || '') + ' ' + (r.model || '')).trim(),
        plate:       r.license_plate || '—',
        serviceType: normalizeServiceType(r.service_type),
        dueDate:     formatDate(r.due_date),
        lastService: getLastServiceLabel(r.notes),
        status:      new Date(r.due_date) < now ? 'Overdue' : new Date(r.due_date) <= next30d ? 'Due Soon' : 'Upcoming',
        phone:       r.client_phone || '—',
    }));

    const exportCSV = () => {
        const rows = getExportRows();
        const headers = ['Customer','Vehicle','Plate','Service Type','Due Date','Last Service','Status','Phone'];
        const csv = [
            headers.join(','),
            ...rows.map(r => [
                '"' + r.customer + '"', '"' + r.vehicle + '"', '"' + r.plate + '"',
                '"' + r.serviceType + '"', '"' + r.dueDate + '"', '"' + r.lastService + '"',
                '"' + r.status + '"', '"' + r.phone + '"'
            ].join(','))
        ].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = 'GoCar_Reminders_' + new Date().toISOString().split('T')[0] + '.csv';
        a.click(); URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    const exportPDF = () => {
        const rows = getExportRows();
        const sc = s => s === 'Overdue' ? '#ef4444' : s === 'Due Soon' ? '#f59e0b' : '#22c55e';
        const tableRows = rows.map(r =>
            '<tr><td>' + r.customer + '</td><td>' + r.vehicle + '</td><td>' + r.plate +
            '</td><td>' + r.serviceType + '</td><td>' + r.lastService + '</td><td>' + r.dueDate +
            '</td><td><span style="color:' + sc(r.status) + ';font-weight:700">' + r.status +
            '</span></td><td>' + r.phone + '</td></tr>'
        ).join('');
        const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GoCar Auto — Service Reminders</title>' +
            '<style>body{font-family:Arial,sans-serif;margin:24px;color:#111;font-size:12px;}' +
            'h1{font-size:20px;margin-bottom:4px;}.meta{color:#666;margin-bottom:16px;font-size:11px;}' +
            '.summary{display:flex;gap:16px;margin-bottom:20px;}' +
            '.card{border:1px solid #ddd;border-radius:8px;padding:12px 20px;text-align:center;}' +
            '.card-num{font-size:22px;font-weight:900;}.card-lbl{font-size:9px;text-transform:uppercase;color:#888;}' +
            'table{width:100%;border-collapse:collapse;}' +
            'th{background:#111;color:#fff;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;}' +
            'td{padding:7px 10px;border-bottom:1px solid #eee;}' +
            'tr:nth-child(even) td{background:#f9f9f9;}</style></head><body>' +
            '<div style="display:flex; align-items:center; gap:12px; margin-bottom: 24px;">' +
            '<img src="' + window.location.origin + '/logo.png" style="max-height:40px;" alt="GoCar Auto" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\';" />' +
            '<span style="display:none; font-size:24px; font-weight:900; letter-spacing:-0.5px;">🚗 GoCar <span style="color:#e05c1a">Auto</span></span>' +
            '<h1 style="margin:0; border-left:2px solid #eee; padding-left:12px; margin-left:4px; font-size:20px; color:#555;">Service Reminders Report</h1>' +
            '</div>' +
            '<p class="meta">Generated: ' + new Date().toLocaleString() + ' &nbsp;|&nbsp; ' + rows.length + ' record(s)</p>' +
            '<div class="summary">' +
            '<div class="card"><div class="card-num">' + totalActive + '</div><div class="card-lbl">Total Active</div></div>' +
            '<div class="card" style="border-color:#ef4444"><div class="card-num" style="color:#ef4444">' + overdueCount + '</div><div class="card-lbl">Overdue</div></div>' +
            '<div class="card" style="border-color:#f59e0b"><div class="card-num" style="color:#f59e0b">' + dueSoonCount + '</div><div class="card-lbl">Due in 30 Days</div></div>' +
            '<div class="card" style="border-color:#f97316"><div class="card-num" style="color:#f97316">' + prospectsCount + '</div><div class="card-lbl">Prospects</div></div>' +
            '</div><table><thead><tr><th>Customer</th><th>Vehicle</th><th>Plate</th><th>Service</th><th>Last Done</th><th>Due Date</th><th>Status</th><th>Phone</th></tr></thead>' +
            '<tbody>' + tableRows + '</tbody></table></body></html>';
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
        setShowExportMenu(false);
    };

    const exportInteractiveHTML = () => {
        const rows = getExportRows();
        const docId = 'GCR-' + now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0');

        const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <title>GoCar Auto — جدول تذكيرات الصيانة</title>
            <style>
              *{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;}
              body{background:#0b0f19;color:#f1f5f9;padding:30px;min-height:100vh;font-size:14px;}
              .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;border-bottom:1px solid #1e293b;padding-bottom:16px;}
              h1{font-size:22px;font-weight:900;color:#fbbf24;}
              .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
              .card{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;text-align:center;}
              .card.red{border-color:#ef4444;color:#ef4444;}
              .card.amber{border-color:#f59e0b;color:#f59e0b;}
              .num{font-size:28px;font-weight:900;margin-bottom:4px;}
              .lbl{font-size:11px;color:#94a3b8;text-transform:uppercase;}
              table{width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;}
              th{background:#1e293b;color:#fbbf24;padding:12px 14px;text-align:right;font-size:11px;}
              td{padding:12px 14px;border-bottom:1px solid #1f2937;font-size:13px;}
              .badge{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;}
              .badge.Overdue{background:rgba(239,68,68,0.2);color:#ef4444;}
              .badge.DueSoon{background:rgba(245,158,11,0.2);color:#f59e0b;}
              .badge.Upcoming{background:rgba(34,197,94,0.2);color:#22c55e;}
            </style></head><body>
            <div class="header">
              <h1>🚗 GoCar Auto — كشف تذكيرات الصيانة</h1>
              <div style="font-size:12px;color:#94a3b8;">معرّف التقرير: ${docId} | تاريخ الإصدار: ${now.toLocaleDateString('ar-EG')}</div>
            </div>
            <div class="cards">
              <div class="card"><div class="num">${totalActive}</div><div class="lbl">إجمالي النشطة</div></div>
              <div class="card red"><div class="num">${overdueCount}</div><div class="lbl">متأخرة عن الموعد</div></div>
              <div class="card amber"><div class="num">${dueSoonCount}</div><div class="lbl">مستحقة خلال 30 يوم</div></div>
              <div class="card"><div class="num">${prospectsCount}</div><div class="lbl">عملاء جدد</div></div>
            </div>
            <table><thead><tr>
              <th>العميل</th><th>السيارة</th><th>اللوحة</th><th>نوع الصيانة</th><th>آخر صيانة</th><th>تاريخ الاستحقاق</th><th>الحالة</th><th>رقم الهاتف</th>
            </tr></thead><tbody>
            ${rows.map(r => `<tr>
              <td><strong>${r.customer}</strong></td><td>${r.vehicle}</td><td>${r.plate}</td><td>${r.serviceType}</td><td>${r.lastService}</td><td>${r.dueDate}</td>
              <td><span class="badge ${r.status === 'Overdue' ? 'Overdue' : r.status === 'Due Soon' ? 'DueSoon' : 'Upcoming'}">${r.status}</span></td>
              <td dir="ltr" style="text-align:right;">${r.phone}</td>
            </tr>`).join('')}
            </tbody></table></body></html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = 'GoCar_Reminders_Ledger_' + new Date().toISOString().split('T')[0] + '.html';
        a.click(); URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    // Close export menu on outside click
    useEffect(() => {
        const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="space-y-6 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Maintenance Dispatch Hub</p>
                    </div>
                    <h2 className="text-3xl font-display font-black text-white tracking-tighter uppercase mt-1">Service Reminders</h2>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    <button
                        onClick={() => setShowNewReminderModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-[#f59e0b] text-black font-black text-[11px] uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
                    >
                        <Plus size={15} strokeWidth={3} />
                        New Reminder
                    </button>
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-black text-[11px] uppercase tracking-widest transition-all"
                    >
                        <BarChart3 size={14} />
                        {showAnalytics ? 'Hide Stats' : 'Show Stats'}
                        {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                        onClick={handleSmartScan}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50"
                        title="Auto-scan work order history to detect due oil & periodic services"
                    >
                        {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Scan size={14} />}
                        {isScanning ? 'Scanning...' : 'Smart Scan'}
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setShowExportMenu(v => !v)}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-black text-[11px] uppercase tracking-widest transition-all"
                        >
                            <Download size={14} />
                            Export
                            <ChevronDown size={12} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[#12141c] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                                <button
                                    onClick={exportInteractiveHTML}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/5 transition-all text-gray-200"
                                >
                                    <Globe size={15} className="text-blue-400" />
                                    <div>
                                        <div className="text-[12px] font-black">Interactive Ledger (HTML)</div>
                                        <div className="text-[10px] text-gray-400">Shareable, styled ledger file</div>
                                    </div>
                                </button>
                                <div className="h-px bg-white/5" />
                                <button
                                    onClick={exportPDF}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/5 transition-all text-gray-200"
                                >
                                    <FileText size={15} className="text-red-400" />
                                    <div>
                                        <div className="text-[12px] font-black">PDF Document</div>
                                        <div className="text-[10px] text-gray-400">Print or save as PDF report</div>
                                    </div>
                                </button>
                                <div className="h-px bg-white/5" />
                                <button
                                    onClick={exportCSV}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/5 transition-all text-gray-200"
                                >
                                    <Sheet size={15} className="text-green-400" />
                                    <div>
                                        <div className="text-[12px] font-black">Excel / CSV Spreadsheet</div>
                                        <div className="text-[10px] text-gray-400">Raw tabular export</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Interactive Stats Cards */}
            {showAnalytics && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Active Reminders Card */}
                        <div 
                            onClick={() => { setActiveTab('active'); setTimeFilter('all'); }}
                            className="glass-card p-5 bg-primary/5 hover:bg-primary/10 border-primary/20 cursor-pointer transition-all flex flex-col justify-between min-h-[115px] group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Pool</span>
                                <Bell size={14} className="text-primary group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-3xl font-black text-white mt-1">{totalActive}</h3>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Pending Reminders</span>
                        </div>

                        {/* Overdue Card */}
                        <div 
                            onClick={() => { setActiveTab('active'); setTimeFilter('overdue'); }}
                            className={`glass-card p-5 cursor-pointer transition-all flex flex-col justify-between min-h-[115px] group ${
                                overdueCount > 0 ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/5 border-green-500/10'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest">Critical Alert</span>
                                <AlertTriangle size={14} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-3xl font-black text-white mt-1">{overdueCount}</h3>
                            <span className="text-[9px] font-bold uppercase">Overdue Action Needed</span>
                        </div>

                        {/* Due Soon Card */}
                        <div 
                            onClick={() => { setActiveTab('active'); setTimeFilter('due_30d'); }}
                            className="glass-card p-5 bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 cursor-pointer transition-all flex flex-col justify-between min-h-[115px] group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Due Soon</span>
                                <Clock size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-3xl font-black text-white mt-1">{dueSoonCount}</h3>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Next 30 Days</span>
                        </div>

                        {/* Prospects Card */}
                        <div 
                            onClick={() => setActiveTab('prospects')}
                            className="glass-card p-5 bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20 cursor-pointer transition-all flex flex-col justify-between min-h-[115px] group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">New Leads</span>
                                <Users size={14} className="text-orange-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-3xl font-black text-white mt-1">{prospectsCount}</h3>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Never Serviced Oil</span>
                        </div>
                    </div>

                    {/* Service Type Breakdown Card */}
                    <div className="glass-card p-5 bg-white/[0.02] border-white/5 flex flex-col justify-between min-h-[115px]">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Service Distribution</span>
                        <div className="space-y-2.5 mt-2">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-300 mb-1">
                                    <span>Engine Oil (الموتور)</span>
                                    <span>{engineOilCount} ({engineOilPct}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${engineOilPct}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-300 mb-1">
                                    <span>Trans Oil (الفتيس)</span>
                                    <span>{transOilCount} ({transOilPct}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${transOilPct}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Scan Toast */}
            {scanResult && (
                <div className={`p-4 rounded-2xl border flex items-start gap-4 animate-in slide-in-from-top duration-300 ${
                    scanResult.error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-primary/10 border-primary/20'
                }`}>
                    <Zap size={18} className={scanResult.error ? 'text-red-400' : 'text-primary'} />
                    {scanResult.error ? (
                        <p className="text-xs font-bold">Smart scan failed. Please check server logs.</p>
                    ) : (
                        <div>
                            <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Smart Scan Synchronized ✓</p>
                            <p className="text-[11px] text-gray-300">
                                Analyzed <strong>{scanResult.scanned}</strong> past service entries &bull; 
                                <strong className="text-green-400"> {scanResult.created} new</strong> reminders registered &bull; 
                                <strong className="text-blue-400"> {scanResult.updated} updated</strong> &bull; 
                                <strong className="text-yellow-400"> {scanResult.skipped} skipped</strong>
                                {scanResult.prospects_count > 0 && (
                                    <> &bull; <strong className="text-orange-400"> {scanResult.prospects_count} prospect clients</strong> detected.</>  
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                            activeTab === 'active' 
                                ? 'bg-primary text-black border-primary shadow-lg shadow-yellow-500/10' 
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <Bell size={13} /> Active Reminders ({reminders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                            activeTab === 'sent' 
                                ? 'bg-blue-500 text-black border-blue-500' 
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <History size={13} /> Sent / History ({sentCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('prospects')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                            activeTab === 'prospects' 
                                ? 'bg-orange-500 text-black border-orange-500' 
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <Users size={13} /> Prospects ({prospectsCount})
                    </button>
                </div>
            </div>

            {/* ════════════════════════ ACTIVE TAB ════════════════════════ */}
            {activeTab === 'active' && (
                <>
                {/* Search & Sub-Filter Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-6 relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text"
                            placeholder="Search by customer name, mobile, plate, vehicle model, or service..."
                            className="input-glass pl-11 h-11 text-xs bg-black/40 border-white/10 w-full"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-6 flex gap-2 flex-wrap">
                        <button 
                            onClick={() => setTimeFilter('all')}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${timeFilter === 'all' ? 'bg-white/15 text-white border-white/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                        >
                            All ({reminders.length})
                        </button>
                        <button 
                            onClick={() => setTimeFilter('overdue')}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${timeFilter === 'overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                        >
                            Overdue ({overdueCount})
                        </button>
                        <button 
                            onClick={() => setTimeFilter('due_7d')}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${timeFilter === 'due_7d' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                        >
                            Next 7 Days
                        </button>
                        <button 
                            onClick={() => setTimeFilter('due_30d')}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${timeFilter === 'due_30d' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                        >
                            Next 30 Days
                        </button>
                        
                        {/* Service Type Pill Filter */}
                        <select 
                            value={typeFilter} 
                            onChange={e => setTypeFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 text-gray-300 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none ml-auto"
                        >
                            <option value="all" className="bg-[#12141c]">All Services</option>
                            <option value="engine_oil" className="bg-[#12141c]">Engine Oil (الموتور)</option>
                            <option value="trans_oil" className="bg-[#12141c]">Trans Oil (الفتيس)</option>
                            <option value="other" className="bg-[#12141c]">Other Periodic</option>
                        </select>
                    </div>
                </div>

                {/* Bulk Actions Strip */}
                {selectedIds.length > 0 && (
                    <div className="glass-card p-4 bg-primary/10 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-xs font-black text-white uppercase tracking-wider">
                                {selectedIds.length} Reminders Selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button 
                                onClick={handleStartBulkWhatsApp}
                                className="flex-1 sm:flex-initial btn-primary py-2 px-5 text-[10px] bg-green-500 text-black border-none flex items-center justify-center gap-2 hover:bg-green-400 font-black"
                            >
                                <MessageCircle size={14} /> Bulk WhatsApp Queue
                            </button>
                            <button 
                                onClick={handleBulkMarkSent}
                                className="flex-1 sm:flex-initial btn-secondary py-2 px-5 text-[10px] flex items-center justify-center gap-2 font-black"
                            >
                                <CheckCircle2 size={14} /> Mark As Sent
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                className="flex-1 sm:flex-initial bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 text-red-500 py-2 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* Reminders Table */}
                <div className="glass-card overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                            Synchronizing Active Reminders...
                        </div>
                    ) : filteredActiveReminders.length === 0 ? (
                        <div className="p-16 text-center border border-dashed border-white/5 rounded-2xl">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No matching reminders found.</p>
                            <p className="text-[11px] text-gray-600 mt-1">Try resetting filters or run a Smart Scan to auto-detect due services.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 w-10 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary cursor-pointer"
                                                checked={selectedIds.length === filteredActiveReminders.length && filteredActiveReminders.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Client / Contact</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vehicle</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Service Task</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Due Target</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Quick Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredActiveReminders.map(rem => {
                                        const isOverdue = new Date(rem.due_date) < now;
                                        const isChecked = selectedIds.includes(rem.id);
                                        const serviceAr = normalizeServiceType(rem.service_type);

                                        return (
                                            <tr key={rem.id} className={`hover:bg-white/[0.02] transition-colors group ${isChecked ? 'bg-primary/5' : ''}`}>
                                                <td className="px-6 py-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary cursor-pointer"
                                                        checked={isChecked}
                                                        onChange={() => handleSelectOne(rem.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-white uppercase tracking-tight">{rem.client_name}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <a 
                                                            href={`tel:${rem.client_phone}`} 
                                                            className="text-[11px] text-gray-400 hover:text-primary font-mono tracking-wider flex items-center gap-1"
                                                            title="Click to dial"
                                                        >
                                                            <Phone size={10} />
                                                            {getDisplayPhone(rem.client_phone)}
                                                        </a>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-200">{rem.make} {rem.model}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono tracking-wider mt-0.5 bg-white/5 inline-block px-1.5 py-0.5 rounded border border-white/5">
                                                        {rem.license_plate || 'No Plate'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <div className="font-black text-primary text-xs flex items-center gap-1.5">
                                                        <Wrench size={11} className="shrink-0" />
                                                        <span>{serviceAr}</span>
                                                    </div>
                                                    {rem.notes && (
                                                        <div className="text-[10px] text-gray-400 truncate mt-1" title={rem.notes}>
                                                            {rem.notes}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingId === rem.id ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            <input 
                                                                type="date" 
                                                                value={editDate} 
                                                                onChange={(e) => setEditDate(e.target.value)}
                                                                className="input-glass text-xs p-1.5 text-white bg-black/60 border-primary/30 rounded"
                                                            />
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => handleSaveManualDate(rem)} className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded hover:bg-green-500/40">Save</button>
                                                                <button onClick={() => setEditingId(null)} className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded hover:bg-red-500/40">Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div 
                                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer hover:opacity-80 transition-all ${
                                                                    isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                }`}
                                                                onClick={() => { setEditingId(rem.id); setEditDate(rem.due_date ? rem.due_date.split('T')[0] : ''); }}
                                                                title="Click to edit exact date"
                                                            >
                                                                {isOverdue && <AlertTriangle size={10} />}
                                                                {formatDate(rem.due_date)}
                                                            </div>

                                                            {/* Quick Reschedule Extension Chips */}
                                                            <div className="flex items-center gap-1 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                                                                <span className="text-[9px] text-gray-500 font-bold">Postpone:</span>
                                                                <button 
                                                                    onClick={() => handleQuickReschedule(rem, 7)}
                                                                    className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-1.5 py-0.5 rounded"
                                                                    title="Add 7 Days"
                                                                >
                                                                    +7d
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleQuickReschedule(rem, 30)}
                                                                    className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-1.5 py-0.5 rounded"
                                                                    title="Add 1 Month"
                                                                >
                                                                    +1m
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleQuickReschedule(rem, 90)}
                                                                    className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-1.5 py-0.5 rounded"
                                                                    title="Add 3 Months"
                                                                >
                                                                    +3m
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* WhatsApp Dispatch Button */}
                                                        <button 
                                                            onClick={() => handleSingleWhatsAppClick(rem, isOverdue ? 'urgent' : 'standard')}
                                                            className="p-2 bg-green-500/10 hover:bg-green-500 hover:text-black border border-green-500/20 text-green-400 rounded-xl transition-all"
                                                            title="Open WhatsApp Template"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </button>

                                                        {/* Convert to Work Order Button */}
                                                        <button 
                                                            onClick={() => handleConvertToWorkOrder(rem)}
                                                            className="p-2 bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 text-primary rounded-xl transition-all"
                                                            title="Convert to Work Order / Intake"
                                                        >
                                                            <Wrench size={14} />
                                                        </button>

                                                        {/* Mark Sent */}
                                                        <button 
                                                            onClick={() => handleMarkSent(rem.id)}
                                                            className="p-2 bg-blue-500/10 hover:bg-blue-500 hover:text-black border border-blue-500/20 text-blue-400 rounded-xl transition-all"
                                                            title="Mark as Sent / Contacted"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                        </button>

                                                        {/* Delete */}
                                                        <button 
                                                            onClick={() => handleDelete(rem.id)}
                                                            className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 text-red-500 rounded-xl transition-all"
                                                            title="Delete Reminder"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                </>
            )}

            {/* ════════════════════════ SENT / HISTORY TAB ════════════════════════ */}
            {activeTab === 'sent' && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History size={16} className="text-blue-400" />
                            <span className="text-xs font-black text-white uppercase tracking-wider">Contacted & Dispatched Reminders Ledger</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{sentReminders.length} Records</span>
                    </div>

                    {filteredSentReminders.length === 0 ? (
                        <div className="p-16 text-center">
                            <History size={32} className="mx-auto text-gray-600 mb-2" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No sent reminders recorded yet.</p>
                            <p className="text-[11px] text-gray-600 mt-1">Dispatched WhatsApp messages will appear here for audit and follow-up.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Client / Contact</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vehicle</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Service Task</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Original Due</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredSentReminders.map(r => (
                                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-white uppercase">{r.client_name}</div>
                                                <div className="text-[11px] text-gray-500 font-mono">{r.client_phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-300">{r.make} {r.model}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{r.license_plate || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-primary text-xs">{normalizeServiceType(r.service_type)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-400">
                                                {formatDate(r.due_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                                                    Sent / Contacted
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleReactivateReminder(r.id)}
                                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold rounded-xl border border-white/10 uppercase tracking-wider"
                                                        title="Re-open into active pool"
                                                    >
                                                        Re-activate
                                                    </button>
                                                    <button 
                                                        onClick={() => handleConvertToWorkOrder(r)}
                                                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-black text-primary text-[10px] font-bold rounded-xl border border-primary/20 uppercase tracking-wider"
                                                        title="Create Work Order"
                                                    >
                                                        Book Intake
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════ PROSPECTS TAB ════════════════════════ */}
            {activeTab === 'prospects' && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-black text-white uppercase tracking-wider">Registered Vehicles with No Oil Service History</span>
                            <p className="text-[11px] text-gray-400 mt-0.5">Vehicles registered over 60 days ago that have never undergone engine or transmission oil change at GoCar Auto.</p>
                        </div>
                        <span className="text-[10px] text-orange-400 font-bold uppercase">{prospects.length} Prospect Leads</span>
                    </div>

                    {prospects.length === 0 ? (
                        <div className="p-16 text-center">
                            <Users size={32} className="mx-auto text-gray-600 mb-3" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No unserviced prospect vehicles found.</p>
                            <p className="text-[11px] text-gray-600 mt-1">Click "Smart Scan" in the header to evaluate all vehicle profiles.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle Asset</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Contact</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration Age</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {prospects.map((p) => {
                                        const mockReminder = {
                                            client_name: p.full_name,
                                            client_phone: p.phone,
                                            make: p.make,
                                            model: p.model,
                                            service_type: 'فحص دوري وزيوت'
                                        };

                                        return (
                                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-white uppercase tracking-tight">{p.full_name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-200">{p.make} {p.model}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{p.license_plate || 'No Plate'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a 
                                                        href={`tel:${p.phone}`} 
                                                        className="text-xs font-bold text-gray-300 font-mono hover:text-primary flex items-center gap-1.5"
                                                    >
                                                        <Phone size={11} />
                                                        {getDisplayPhone(p.phone)}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                        {Math.round(p.days_since_registered)} Days Ago
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleSingleWhatsAppClick(mockReminder, 'prospect')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500 hover:text-black border border-green-500/20 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                        >
                                                            <MessageCircle size={12} /> WhatsApp Offer
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setNewReminderForm({
                                                                    clientId: p.client_id || '',
                                                                    vehicleId: p.id,
                                                                    serviceType: 'تغيير زيت الموتور',
                                                                    dueDate: new Date().toISOString().split('T')[0],
                                                                    intervalKm: 10000,
                                                                    intervalMonths: 6,
                                                                    notes: 'Prospect follow-up lead'
                                                                });
                                                                setShowNewReminderModal(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                        >
                                                            <Plus size={12} /> Create Reminder
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════ MODALS ════════════════════════ */}

            {/* 1. New Reminder Modal */}
            {showNewReminderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card p-7 max-w-lg w-full border-primary/30 shadow-2xl relative">
                        <button 
                            onClick={() => setShowNewReminderModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                        
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">
                                Schedule Service Reminder
                            </h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-6">
                            Register a proactive maintenance target for any customer vehicle.
                        </p>

                        <form onSubmit={handleCreateNewReminder} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Select Client</label>
                                <select 
                                    className="input-glass text-xs w-full bg-black/40 border-white/10"
                                    value={newReminderForm.clientId}
                                    onChange={e => handleClientChange(e.target.value)}
                                    required
                                >
                                    <option value="" className="bg-[#12141c]">-- Choose Customer --</option>
                                    {allClients.map(c => (
                                        <option key={c.id} value={c.id} className="bg-[#12141c]">
                                            {c.full_name} ({c.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Select Vehicle Asset</label>
                                <select 
                                    className="input-glass text-xs w-full bg-black/40 border-white/10"
                                    value={newReminderForm.vehicleId}
                                    onChange={e => setNewReminderForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                                    disabled={!newReminderForm.clientId || clientVehicles.length === 0}
                                    required
                                >
                                    <option value="" className="bg-[#12141c]">
                                        {!newReminderForm.clientId ? '-- First Select a Customer --' : clientVehicles.length === 0 ? 'No vehicles registered for client' : '-- Choose Vehicle --'}
                                    </option>
                                    {clientVehicles.map(v => (
                                        <option key={v.id} value={v.id} className="bg-[#12141c]">
                                            {v.make} {v.model} ({v.license_plate || 'No Plate'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Service Task</label>
                                    <select 
                                        className="input-glass text-xs w-full bg-black/40 border-white/10"
                                        value={newReminderForm.serviceType}
                                        onChange={e => setNewReminderForm(prev => ({ ...prev, serviceType: e.target.value }))}
                                    >
                                        <option value="تغيير زيت الموتور" className="bg-[#12141c]">Engine Oil (تغيير زيت الموتور)</option>
                                        <option value="تغيير زيت الفتيس" className="bg-[#12141c]">Trans Oil (تغيير زيت الفتيس)</option>
                                        <option value="تغيير تيل الفرامل" className="bg-[#12141c]">Brakes (تغيير تيل الفرامل)</option>
                                        <option value="تغيير سير المجموعة" className="bg-[#12141c]">Drive Belt (سير المجموعة)</option>
                                        <option value="صيانة دورية شاملة" className="bg-[#12141c]">Comprehensive Periodic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Due Date</label>
                                    <input 
                                        type="date" 
                                        className="input-glass text-xs w-full bg-black/40 border-white/10"
                                        value={newReminderForm.dueDate}
                                        onChange={e => setNewReminderForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Preset Due Chips */}
                            <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-[9px] text-gray-400 font-bold uppercase">Quick Set:</span>
                                {[
                                    { label: '+1 Month', months: 1 },
                                    { label: '+3 Months', months: 3 },
                                    { label: '+6 Months', months: 6 },
                                    { label: '+1 Year', months: 12 }
                                ].map(p => (
                                    <button
                                        type="button"
                                        key={p.label}
                                        onClick={() => {
                                            const d = new Date();
                                            d.setMonth(d.getMonth() + p.months);
                                            setNewReminderForm(prev => ({ ...prev, dueDate: d.toISOString().split('T')[0] }));
                                        }}
                                        className="text-[9px] font-bold px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/5"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Internal Notes</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Total 5W-40, check filter replacement"
                                    className="input-glass text-xs w-full bg-black/40 border-white/10"
                                    value={newReminderForm.notes}
                                    onChange={e => setNewReminderForm(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button 
                                    type="button"
                                    onClick={() => setShowNewReminderModal(false)}
                                    className="flex-1 btn-secondary text-xs py-3"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSavingNew}
                                    className="flex-2 btn-primary text-xs py-3 bg-primary text-black font-black uppercase tracking-wider"
                                >
                                    {isSavingNew ? 'Saving...' : 'Register Reminder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. WhatsApp Live Bubble Preview Modal */}
            {activeTemplateReminder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card p-7 max-w-xl w-full border-green-500/30 shadow-2xl relative">
                        <button 
                            onClick={() => setActiveTemplateReminder(null)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 mb-1">
                            <MessageCircle size={18} className="text-green-400" />
                            <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">
                                WhatsApp Dispatch Console
                            </h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                            Recipient: <strong className="text-white">{activeTemplateReminder.client_name}</strong> &bull; {activeTemplateReminder.make} {activeTemplateReminder.model}
                        </p>

                        {/* Template Type Selector Tabs */}
                        <div className="flex gap-1.5 mb-4 bg-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => handleSwitchTemplateType('standard')}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                    activeTemplateType === 'standard' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Polite Standard
                            </button>
                            <button
                                onClick={() => handleSwitchTemplateType('urgent')}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                    activeTemplateType === 'urgent' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Urgent Alert
                            </button>
                            <button
                                onClick={() => handleSwitchTemplateType('promo')}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                    activeTemplateType === 'promo' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Promo Offer
                            </button>
                        </div>

                        {/* WhatsApp Message Preview Bubble */}
                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-[#0b141a] border border-[#202c33] text-right" dir="rtl">
                                <div className="text-[11px] text-gray-400 mb-1 font-mono text-left" dir="ltr">
                                    To: +{getCleanWhatsAppPhone(activeTemplateReminder.client_phone)}
                                </div>
                                <textarea 
                                    className="w-full bg-transparent text-[#e9edef] text-xs leading-relaxed outline-none resize-none font-sans min-h-[140px]"
                                    value={customMessage}
                                    onChange={e => setCustomMessage(e.target.value)}
                                />
                                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-gray-500">
                                    <button 
                                        type="button" 
                                        onClick={handleCopyMessage}
                                        className="text-gray-400 hover:text-white flex items-center gap-1 font-sans"
                                    >
                                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                        {copied ? 'Copied to Clipboard!' : 'Copy Text'}
                                    </button>
                                    <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                            <button 
                                className="flex-1 btn-secondary text-xs py-3" 
                                onClick={() => setActiveTemplateReminder(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="flex-2 btn-primary text-xs py-3 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-wider flex items-center justify-center gap-2 border-none" 
                                onClick={handleSendSingle}
                            >
                                <Send size={14} /> Open in WhatsApp & Mark Sent
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Bulk WhatsApp Queue Modal */}
            {showBulkModal && bulkQueue.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card p-7 max-w-lg w-full border-green-500/20 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter text-green-400">
                                Bulk WhatsApp Dispatch
                            </h3>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-300">
                                {currentQueueIndex + 1} OF {bulkQueue.length}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/5 rounded-full h-1.5 mb-6 overflow-hidden">
                            <div 
                                className="bg-green-500 h-full transition-all duration-300"
                                style={{ width: `${Math.round(((currentQueueIndex + 1) / bulkQueue.length) * 100)}%` }}
                            />
                        </div>

                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-4">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Target</div>
                            <div className="text-sm font-black text-white">{bulkQueue[currentQueueIndex].reminder.client_name}</div>
                            <div className="text-xs text-green-400 font-mono mt-0.5">
                                +{getCleanWhatsAppPhone(bulkQueue[currentQueueIndex].reminder.client_phone)} &bull; {bulkQueue[currentQueueIndex].reminder.make} {bulkQueue[currentQueueIndex].reminder.model}
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Payload</label>
                            <textarea 
                                className="input-glass text-xs p-4 min-h-[140px] bg-black/40 text-right leading-relaxed" 
                                dir="rtl"
                                value={bulkQueue[currentQueueIndex].message}
                                onChange={e => {
                                    const updated = [...bulkQueue];
                                    updated[currentQueueIndex].message = e.target.value;
                                    setBulkQueue(updated);
                                }}
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button 
                                className="flex-1 btn-secondary text-xs hover:text-red-400" 
                                onClick={() => { setShowBulkModal(false); setBulkQueue([]); }}
                            >
                                Abort
                            </button>
                            <button 
                                className="flex-1 btn-secondary text-xs" 
                                onClick={handleSkipBulkCurrent}
                            >
                                Skip
                            </button>
                            <button 
                                className="flex-2 btn-primary text-xs bg-green-500 text-black border-none flex items-center justify-center gap-2 hover:bg-green-400 font-black uppercase" 
                                onClick={handleSendBulkCurrent}
                            >
                                <Send size={13} /> Send & Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceRemindersModule;
