import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { 
    Bell, MessageCircle, Search, Trash2, CheckCircle2, ChevronRight, Filter, AlertTriangle, Send,
    Scan, Users, Zap, RefreshCw, BarChart3, ChevronDown, ChevronUp, TrendingUp,
    Download, FileText, Globe, Sheet
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const ServiceRemindersModule = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, overdue, due
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Single Template Modal
    const [activeTemplateReminder, setActiveTemplateReminder] = useState(null);
    const [customMessage, setCustomMessage] = useState('');

    // Bulk WhatsApp State
    const [bulkQueue, setBulkQueue] = useState([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [isBulkSending, setIsBulkSending] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState("");

    // Smart Scan state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [activeTab, setActiveTab] = useState('reminders'); // 'reminders' | 'prospects'
    const [prospects, setProspects] = useState([]);
    const [showAnalytics, setShowAnalytics] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef(null);

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reminders/all');
            setReminders(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        } finally {
            setLoading(false);
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
            // Refresh reminders list
            await fetchReminders();
            // Auto-clear toast after 8 seconds
            setTimeout(() => setScanResult(null), 8000);
        } catch (error) {
            console.error('Smart scan failed:', error);
            setScanResult({ error: true });
            setTimeout(() => setScanResult(null), 5000);
        } finally {
            setIsScanning(false);
        }
    };

    const getWhatsAppTemplate = (reminder) => {
        const customerName = reminder.client_name || '';
        const carModel = `${reminder.make} ${reminder.model}`;
        const serviceType = reminder.service_type || '';
        
        let lastDate = 'غير متوفر';
        if (reminder.notes) {
            // Format 1 (smart scan): "Last done: 2026-06-30"
            let match = reminder.notes.match(/Last done:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
            // Format 2 (legacy auto-generated): "Auto-generated. Last: 2025-09-19."
            if (!match) match = reminder.notes.match(/Last:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
            // Format 3: any ISO date anywhere in notes as final fallback
            if (!match) match = reminder.notes.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);

            if (match) {
                const d = new Date(`${match[1]}T00:00:00`);
                lastDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
            }
        }

        
        return `🚗 GoCar Auto Maintenance Reminder

👤 عميلنا العزيز ${customerName}، حابين نفكرك إن عربيتك ${carModel} محتاجة صيانة ${serviceType}.

🔹 آخر صيانة ${serviceType} كانت ${lastDate}


📅 Book Now / احجز ميعادك:

👉 http://localhost:5173/appointments`;
    };

    const getFormattedPhone = (phone) => {
        if (!phone) return '';
        let clean = phone.replace(/[^0-9+]/g, '');
        if (clean.startsWith('01')) {
            clean = '+20' + clean.slice(1);
        } else if (!clean.startsWith('+')) {
            clean = '+' + clean;
        }
        return clean;
    };

    const handleSaveDate = async (rem) => {
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
            fetchReminders();
        } catch (error) {
            console.error('Failed to update due date:', error);
            alert('Failed to update date');
        }
    };

    const handleSingleWhatsAppClick = (reminder) => {
        setActiveTemplateReminder(reminder);
        setCustomMessage(getWhatsAppTemplate(reminder));
    };

    const sendWhatsAppMessage = (phone, text) => {
        const cleanPhone = getFormattedPhone(phone);
        const url = `https://web.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleSendSingle = () => {
        if (!activeTemplateReminder) return;
        sendWhatsAppMessage(activeTemplateReminder.client_phone, customMessage);
        
        // Log notification to DB
        api.post('/reminders', {
            clientId: activeTemplateReminder.client_id,
            vehicleId: activeTemplateReminder.vehicle_id,
            serviceType: activeTemplateReminder.service_type,
            status: 'Sent',
            dueDate: activeTemplateReminder.due_date,
            notes: `WhatsApp Sent manually: ${customMessage.slice(0, 100)}`
        }).catch(err => console.error(err));

        // Mark as sent
        handleMarkSent(activeTemplateReminder.id);
        setActiveTemplateReminder(null);
    };

    const handleMarkSent = async (id) => {
        try {
            await api.put(`/reminders/${id}`, {
                status: 'Sent'
            });
            setReminders(prev => prev.filter(r => r.id !== id));
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this reminder?')) return;
        try {
            await api.delete(`/reminders/${id}`);
            setReminders(prev => prev.filter(r => r.id !== id));
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Failed to delete reminder:', error);
        }
    };

    // Bulk operations
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredReminders.map(r => r.id));
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
            setReminders(prev => prev.filter(r => !selectedIds.includes(r.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Bulk mark sent failed:', error);
            alert('Failed to update some reminders');
        }
    };

    const handleStartBulkWhatsApp = () => {
        const selectedReminders = reminders.filter(r => selectedIds.includes(r.id));
        const queue = selectedReminders.map(r => ({
            reminder: r,
            message: getWhatsAppTemplate(r)
        }));
        setBulkQueue(queue);
        setCurrentQueueIndex(0);
        setShowBulkModal(true);
    };

    const handleSendBulkCurrent = () => {
        const item = bulkQueue[currentQueueIndex];
        if (!item) return;

        sendWhatsAppMessage(item.reminder.client_phone, item.message);

        // Mark current as sent locally and on server
        handleMarkSent(item.reminder.id);

        if (currentQueueIndex + 1 < bulkQueue.length) {
            setCurrentQueueIndex(prev => prev + 1);
        } else {
            setShowBulkModal(false);
            setBulkQueue([]);
            alert('Bulk Queue Finished!');
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

    // Filter logic
    const filteredReminders = reminders.filter(r => {
        const matchesSearch = 
            r.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.make && r.make.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (r.model && r.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
            r.service_type.toLowerCase().includes(searchQuery.toLowerCase());

        const isOverdue = new Date(r.due_date) < new Date();
        
        if (filterStatus === 'overdue') return matchesSearch && isOverdue;
        if (filterStatus === 'due') return matchesSearch && !isOverdue;
        return matchesSearch;
    });

    // Analytics calculations
    const totalActive = reminders.length;
    const overdueCount = reminders.filter(r => new Date(r.due_date) < new Date()).length;
    const now = new Date();
    const next30 = new Date();
    next30.setDate(now.getDate() + 30);
    const dueSoonCount = reminders.filter(r => {
        const d = new Date(r.due_date);
        return d >= now && d <= next30;
    }).length;
    const prospectsCount = prospects.length;

    const engineOilCount = reminders.filter(r => r.service_type === 'تغيير زيت الموتور').length;
    const transOilCount = reminders.filter(r => r.service_type === 'تغيير زيت الفتيس').length;
    const otherCount = Math.max(0, totalActive - engineOilCount - transOilCount);

    const engineOilPct = totalActive > 0 ? Math.round((engineOilCount / totalActive) * 100) : 0;
    const transOilPct = totalActive > 0 ? Math.round((transOilCount / totalActive) * 100) : 0;
    const otherPct = totalActive > 0 ? Math.round((otherCount / totalActive) * 100) : 0;

    // ─── Export Helpers ────────────────────────────────────────────────────────
    const getLastServiceLabel = (notes) => {
        if (!notes) return '—';
        let m = notes.match(/Last done:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
             || notes.match(/Last:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
             || notes.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        if (!m) return notes.substring(0, 40);
        const d = new Date(m[1] + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
    };

    const getExportRows = () => filteredReminders.map(r => ({
        customer:    r.client_name || '',
        vehicle:     ((r.make || '') + ' ' + (r.model || '')).trim(),
        plate:       r.license_plate || '—',
        serviceType: r.service_type || '',
        dueDate:     formatDate(r.due_date),
        lastService: getLastServiceLabel(r.notes),
        status:      new Date(r.due_date) < now ? 'Overdue' : new Date(r.due_date) <= next30 ? 'Due Soon' : 'Upcoming',
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
        const dataJson = JSON.stringify(rows);
        const now = new Date();
        const dateStr = (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear() + ', ' +
                        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        const docId = 'GCR-' + now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0');

        const scriptContent = [
            'const DATA = ' + dataJson + ';',
            'let sortCol = "dueDate", sortDir = 1;',
            'const types = [...new Set(DATA.map(r=>r.serviceType).filter(Boolean))];',
            'const sel = document.getElementById("typeFilter");',
            'types.forEach(t=>{ const o=document.createElement("option"); o.value=t; o.textContent=t; sel.appendChild(o); });',
            'function sortBy(col){ sortDir = (sortCol===col)? -sortDir : 1; sortCol=col; render(); }',
            'function render(){',
            '  const q = document.getElementById("search").value.toLowerCase();',
            '  const st = document.getElementById("statusFilter").value;',
            '  const tp = document.getElementById("typeFilter").value;',
            '  let rows = DATA.filter(r=>{',
            '    const match = !q || [r.customer,r.vehicle,r.plate,r.serviceType,r.phone].join(" ").toLowerCase().includes(q);',
            '    return match && (!st||r.status===st) && (!tp||r.serviceType===tp);',
            '  });',
            '  rows.sort((a,b)=>{ const av=a[sortCol]||""; const bv=b[sortCol]||""; return av<bv?-sortDir:av>bv?sortDir:0; });',
            '  document.getElementById("c-total").textContent=rows.length;',
            '  document.getElementById("c-over").textContent=rows.filter(r=>r.status==="Overdue").length;',
            '  document.getElementById("c-soon").textContent=rows.filter(r=>r.status==="Due Soon").length;',
            '  document.getElementById("count").textContent=rows.length + " listings compiled";',
            '  const tbody=document.getElementById("tbody");',
            '  if(!rows.length){ tbody.innerHTML="<tr><td colspan=8 class=empty>No records match your filters.</td></tr>"; return; }',
            '  tbody.innerHTML=rows.map(r=>"<tr><td><strong>"+r.customer+"</strong></td><td>"+r.vehicle+"</td><td>"+r.plate+"</td><td>"+r.serviceType+"</td><td>"+r.lastService+"</td><td>"+r.dueDate+"</td><td><span class=\'badge "+r.status+"\'>"+r.status+"</span></td><td>"+r.phone+"</td></tr>").join("");',
            '}',
            'render();'
        ].join('\n');

        const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
            '<title>GoCar Auto — Service Reminders Ledger</title>' +
            '<style>' +
            '  *{box-sizing:border-box;margin:0;padding:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}' +
            '  body{background:#f8fafc;color:#1e293b;padding:40px 30px;min-height:100vh;font-size:15px;}' +
            '  .header-wrapper{display:flex;justify-content:between;align-items:flex-end;margin-bottom:12px;width:100%;}' +
            '  .header-left{flex:1;}' +
            '  .header-left img{max-height:55px;display:block;margin-bottom:6px;}' +
            '  .header-left .logo-fallback{font-size:28px;font-weight:900;letter-spacing:-1px;color:#0b1320;margin-bottom:4px;}' +
            '  .header-left .logo-fallback span{color:#e05c1a;}' +
            '  .header-left .subtitle{font-size:14px;color:#64748b;font-weight:500;}' +
            '  .header-right{display:flex;gap:24px;text-align:right;}' +
            '  .meta-item{display:flex;flex-direction:column;}' +
            '  .meta-label{font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;}' +
            '  .meta-val{font-size:15px;font-weight:700;color:#0b1320;}' +
            '  .divider{border:none;border-top:2px solid #0b1320;margin-bottom:24px;}' +
            '  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}' +
            '  .card{background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:22px 26px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.02);min-height:115px;}' +
            '  .card.overdue{border-left:4px solid #ef4444;}' +
            '  .card.soon{border-left:4px solid #f59e0b;}' +
            '  .card-num{font-size:38px;font-weight:800;color:#0b1320;line-height:1;margin-bottom:6px;}' +
            '  .card-lbl{font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;}' +
            '  .controls-wrapper{background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;display:flex;gap:12px;flex-wrap:wrap;}' +
            '  .controls-wrapper input,.controls-wrapper select{background:#ffffff;border:1px solid #cbd5e1;border-radius:6px;color:#1e293b;padding:14px 18px;font-size:15px;outline:none;flex:1;min-width:200px;transition:all 0.2s;}' +
            '  .controls-wrapper input:focus,.controls-wrapper select:focus{border-color:#0b1320;box-shadow:0 0 0 2px rgba(11,19,32,0.05);}' +
            '  .count{font-size:13px;font-weight:600;color:#64748b;margin-bottom:8px;margin-left:4px;}' +
            '  table{width:100%;border-collapse:collapse;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.02);border:1px solid #e2e8f0;}' +
            '  th{background:#0b1320;color:#ffffff;padding:16px 20px;text-align:left;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;user-select:none;border-right:1px solid rgba(255,255,255,0.05);}' +
            '  th:hover{background:#111e32;}td{padding:16px 20px;border-bottom:1px solid #e2e8f0;font-size:15px;color:#334155;}' +
            '  tr:last-child td{border-bottom:none;}tr:nth-child(even) td{background:#f8fafc;}' +
            '  .badge{display:inline-block;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.02em;}' +
            '  .badge.Overdue{background:#fee2e2;color:#ef4444;}' +
            '  .badge.Due\\ Soon{background:#fef3c7;color:#d97706;}' +
            '  .badge.Upcoming{background:#dcfce7;color:#15803d;}' +
            '  .empty{text-align:center;padding:48px;color:#64748b;font-weight:500;}' +
            '  @media(max-width:900px){.cards{grid-template-columns:repeat(2,1fr);}}' +
            '  @media(max-width:600px){.header-wrapper{flex-direction:column;align-items:flex-start;gap:16px;}.header-right{text-align:left;}.cards{grid-template-columns:1fr;}th:nth-child(3),td:nth-child(3),th:nth-child(8),td:nth-child(8){display:none;}}' +
            '</style></head><body>' +
            '<div class="header-wrapper">' +
            '  <div class="header-left">' +
            '    <img src="' + window.location.origin + '/logo.png" alt="GoCar Auto" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\';" />' +
            '    <div class="logo-fallback" style="display:none;">🚗 GoCar <span>Auto</span></div>' +
            '    <div class="subtitle">Automotive Fleet Service Maintenance Ledger</div>' +
            '  </div>' +
            '  <div class="header-right">' +
            '    <div class="meta-item"><span class="meta-label">Document ID</span><span class="meta-val">' + docId + '</span></div>' +
            '    <div class="meta-item"><span class="meta-label">Generated Date</span><span class="meta-val">' + dateStr + '</span></div>' +
            '  </div>' +
            '</div>' +
            '<hr class="divider" />' +
            '<div class="cards">' +
            '  <div class="card"><div class="card-num" id="c-total">0</div><div class="card-lbl">Active Scope</div></div>' +
            '  <div class="card overdue"><div class="card-num" id="c-over">0</div><div class="card-lbl">Immediate Breach</div></div>' +
            '  <div class="card soon"><div class="card-num" id="c-soon">0</div><div class="card-lbl">Due &lt; 30 Days</div></div>' +
            '  <div class="card"><div class="card-num">' + prospectsCount + '</div><div class="card-lbl">Prospect Phase</div></div>' +
            '</div>' +
            '<div class="controls-wrapper">' +
            '  <input type="text" id="search" placeholder="Filter sheet by keyword, license tag, phone entry…" oninput="render()" />' +
            '  <select id="statusFilter" onchange="render()">' +
            '    <option value="">All Account Statuses</option>' +
            '    <option value="Overdue">Immediate Breach</option>' +
            '    <option value="Due Soon">Due &lt; 30 Days</option>' +
            '    <option value="Upcoming">Upcoming Scope</option>' +
            '  </select>' +
            '  <select id="typeFilter" onchange="render()"><option value="">All Action Types</option></select>' +
            '</div>' +
            '<div class="count" id="count">0 listings compiled</div>' +
            '<table><thead><tr>' +
            '<th onclick="sortBy(\'customer\')">Customer ↕</th>' +
            '<th onclick="sortBy(\'vehicle\')">Vehicle Model ↕</th>' +
            '<th onclick="sortBy(\'plate\')">Plate ID ↕</th>' +
            '<th onclick="sortBy(\'serviceType\')">Service Requirement ↕</th>' +
            '<th onclick="sortBy(\'lastService\')">Last Confirmed ↕</th>' +
            '<th onclick="sortBy(\'dueDate\')">Target Limit ↕</th>' +
            '<th onclick="sortBy(\'status\')">Status Status ↕</th>' +
            '<th>Direct Contact</th>' +
            '</tr></thead><tbody id="tbody"></tbody></table>' +
            '<script>' + scriptContent + '<\/script>' +
            '</body></html>';

        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = 'GoCar_Reminders_Interactive_' + new Date().toISOString().split('T')[0] + '.html';
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
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Operation Vault</p>
                    <h2 className="text-3xl font-display font-black text-white tracking-tighter uppercase mt-1">Service Reminders</h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-black text-[11px] uppercase tracking-widest transition-all"
                    >
                        <BarChart3 size={14} />
                        {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                        {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                        onClick={handleSmartScan}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Scan size={14} />}
                        {isScanning ? 'Scanning...' : 'Run Smart Scan'}
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setShowExportMenu(v => !v)}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-black text-[11px] uppercase tracking-widest transition-all"
                        >
                            <Download size={14} />
                            Export
                            <ChevronDown size={12} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button
                                    onClick={exportInteractiveHTML}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-bold text-gray-200 hover:bg-white/5 transition-all"
                                >
                                    <Globe size={15} className="text-blue-400" />
                                    <div>
                                        <div className="text-[12px] font-black">Interactive HTML</div>
                                        <div className="text-[10px] text-gray-500">Filterable, shareable file</div>
                                    </div>
                                </button>
                                <div className="h-px bg-white/5" />
                                <button
                                    onClick={exportPDF}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-bold text-gray-200 hover:bg-white/5 transition-all"
                                >
                                    <FileText size={15} className="text-red-400" />
                                    <div>
                                        <div className="text-[12px] font-black">PDF Report</div>
                                        <div className="text-[10px] text-gray-500">Print or save as PDF</div>
                                    </div>
                                </button>
                                <div className="h-px bg-white/5" />
                                <button
                                    onClick={exportCSV}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-bold text-gray-200 hover:bg-white/5 transition-all"
                                >
                                    <Sheet size={15} className="text-green-400" />
                                    <div>
                                        <div className="text-[12px] font-black">CSV Spreadsheet</div>
                                        <div className="text-[10px] text-gray-500">Open in Excel / Sheets</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsible Analytics Panel */}
            {showAnalytics && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="glass-card p-5 bg-primary/5 border-primary/10 flex flex-col justify-between min-h-[110px]">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Pool</span>
                            <h3 className="text-3xl font-black text-white mt-2">{totalActive}</h3>
                            <span className="text-[9px] text-gray-500 font-bold uppercase mt-1">Total Reminders</span>
                        </div>
                        <div className={`glass-card p-5 flex flex-col justify-between min-h-[110px] ${
                            overdueCount > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/5 border-green-500/10'
                        }`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">Critical Alert</span>
                            <h3 className="text-3xl font-black text-white mt-2">{overdueCount}</h3>
                            <span className="text-[9px] font-bold uppercase mt-1">Overdue Action Needed</span>
                        </div>
                        <div className="glass-card p-5 bg-blue-500/5 border-blue-500/10 flex flex-col justify-between min-h-[110px]">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Due Soon</span>
                            <h3 className="text-3xl font-black text-white mt-2">{dueSoonCount}</h3>
                            <span className="text-[9px] text-gray-500 font-bold uppercase mt-1">Next 30 Days</span>
                        </div>
                        <div className="glass-card p-5 bg-orange-500/5 border-orange-500/10 flex flex-col justify-between min-h-[110px]">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">New Leads</span>
                            <h3 className="text-3xl font-black text-white mt-2">{prospectsCount}</h3>
                            <span className="text-[9px] text-gray-500 font-bold uppercase mt-1">Never Serviced Oil</span>
                        </div>
                    </div>
                    <div className="glass-card p-5 bg-white/[0.02] border-white/5 flex flex-col justify-between min-h-[110px]">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Demand Breakdown</span>
                        <div className="space-y-2 mt-2">
                            <div>
                                <div className="flex justify-between text-[9px] font-bold text-gray-300 mb-0.5">
                                    <span>Engine Oil (موتور)</span>
                                    <span>{engineOilCount} ({engineOilPct}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${engineOilPct}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[9px] font-bold text-gray-300 mb-0.5">
                                    <span>Trans Oil (فتيس)</span>
                                    <span>{transOilCount} ({transOilPct}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400" style={{ width: `${transOilPct}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Scan Result Toast */}
            {scanResult && (
                <div className={`p-4 rounded-xl border flex items-start gap-4 animate-in slide-in-from-top duration-300 ${
                    scanResult.error 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-primary/10 border-primary/20'
                }`}>
                    <Zap size={18} className={scanResult.error ? 'text-red-400' : 'text-primary'} />
                    {scanResult.error ? (
                        <p className="text-xs font-bold">Scan failed. Please try again or check the server logs.</p>
                    ) : (
                        <div>
                            <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Smart Scan Complete ✓</p>
                            <p className="text-[11px] text-gray-300">
                                Scanned <strong>{scanResult.scanned}</strong> vehicle-service pairs &bull; 
                                <strong className="text-green-400"> {scanResult.created} new</strong> reminders created &bull; 
                                <strong className="text-blue-400"> {scanResult.updated} updated</strong> &bull; 
                                <strong className="text-yellow-400"> {scanResult.skipped} skipped</strong>
                                {scanResult.prospects_count > 0 && (
                                    <> &bull; <strong className="text-orange-400"> {scanResult.prospects_count} prospects</strong> (never serviced oil)</>  
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('reminders')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                        activeTab === 'reminders' ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                    }`}
                >
                    <Bell size={12} /> Active Reminders ({reminders.length})
                </button>
                <button
                    onClick={() => setActiveTab('prospects')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                        activeTab === 'prospects' ? 'bg-orange-500 text-black border-orange-500' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                    }`}
                >
                    <Users size={12} /> Prospects — Never Serviced {prospects.length > 0 && `(${prospects.length})`}
                </button>
            </div>

            {activeTab === 'reminders' && (
            <>
            {/* Filters bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text"
                        placeholder="Search customer, vehicle or service..."
                        className="input-glass pl-12 h-12 text-sm bg-black/40 border-white/5"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 h-12">
                    <button 
                        onClick={() => setFilterStatus('all')}
                        className={`flex-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center border transition-all ${filterStatus === 'all' ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                    >
                        ALL ({reminders.length})
                    </button>
                    <button 
                        onClick={() => setFilterStatus('overdue')}
                        className={`flex-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center border transition-all ${filterStatus === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                    >
                        OVERDUE ({reminders.filter(r => new Date(r.due_date) < new Date()).length})
                    </button>
                </div>
            </div>

            {/* Bulk actions strip */}
            {selectedIds.length > 0 && (
                <div className="glass-card p-4 bg-primary/10 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                        {selectedIds.length} Selected Reminders
                    </span>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleStartBulkWhatsApp}
                            className="flex-1 sm:flex-initial btn-primary py-2.5 px-6 text-[10px] bg-green-500 text-black border-none flex items-center justify-center gap-2 hover:bg-green-400"
                        >
                            <MessageCircle size={14} /> BULK WHATSAPP
                        </button>
                        <button 
                            onClick={handleBulkMarkSent}
                            className="flex-1 sm:flex-initial btn-secondary py-2.5 px-6 text-[10px] flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={14} /> MARK SENT
                        </button>
                        <button 
                            onClick={handleBulkDelete}
                            className="flex-1 sm:flex-initial bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 text-red-500 py-2.5 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} /> DELETE
                        </button>
                    </div>
                </div>
            )}

            {/* Reminders table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                        Synchronizing Active Reminders...
                    </div>
                ) : filteredReminders.length === 0 ? (
                    <div className="p-20 text-center border border-dashed border-white/5 rounded-2xl">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No matching reminders detected.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-5 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-white/10 bg-black/40 text-primary focus:ring-primary"
                                            checked={selectedIds.length === filteredReminders.length && filteredReminders.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Client / Contact</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Vehicle</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Service Task</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Due Date</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredReminders.map(rem => {
                                    const isOverdue = new Date(rem.due_date) < new Date();
                                    const isChecked = selectedIds.includes(rem.id);
                                    return (
                                        <tr key={rem.id} className={`hover:bg-white/[0.02] transition-colors group ${isChecked ? 'bg-primary/5' : ''}`}>
                                            <td className="px-8 py-5 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-white/10 bg-black/40 text-primary focus:ring-primary"
                                                    checked={isChecked}
                                                    onChange={() => handleSelectOne(rem.id)}
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-black text-white uppercase tracking-tight">{rem.client_name}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{rem.client_phone}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-gray-300">{rem.make} {rem.model}</div>
                                                <div className="text-[10px] text-gray-500 font-mono tracking-widest mt-0.5">{rem.license_plate || 'No Plate'}</div>
                                            </td>
                                            <td className="px-8 py-5 max-w-xs">
                                                <div className="font-black text-primary uppercase tracking-tight text-xs">{rem.service_type}</div>
                                                {rem.notes && (
                                                    <div className="text-[10px] text-gray-400 truncate mt-1" title={rem.notes}>
                                                        {rem.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                {editingId === rem.id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input 
                                                            type="date" 
                                                            value={editDate} 
                                                            onChange={(e) => setEditDate(e.target.value)}
                                                            className="input-glass text-xs p-2 text-white bg-black/40 border-primary/20"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleSaveDate(rem)} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/40">Save</button>
                                                            <button onClick={() => setEditingId(null)} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/40">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-80 ${isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}
                                                        onClick={() => { setEditingId(rem.id); setEditDate(rem.due_date.split('T')[0]); }}
                                                        title="Click to edit date"
                                                    >
                                                        {isOverdue && <AlertTriangle size={10} />}
                                                        {formatDate(rem.due_date)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleSingleWhatsAppClick(rem)}
                                                        className="p-2 bg-green-500/10 hover:bg-green-500 hover:text-black border border-green-500/20 text-green-500 rounded-lg transition-colors"
                                                        title="Customize & Send WhatsApp"
                                                    >
                                                        <MessageCircle size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleMarkSent(rem.id)}
                                                        className="p-2 bg-blue-500/10 hover:bg-blue-500 hover:text-black border border-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                        title="Mark as Sent"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(rem.id)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 text-red-500 rounded-lg transition-colors"
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

            {/* Prospects Tab */}
            {activeTab === 'prospects' && (
                <div className="glass-card overflow-hidden">
                    {prospects.length === 0 ? (
                        <div className="p-20 text-center">
                            <Users size={32} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No prospects found.</p>
                            <p className="text-[11px] text-gray-600 mt-2">Run a Smart Scan first to populate this list.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Vehicle</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Days Since Registered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {prospects.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="font-black text-white uppercase tracking-tight">{p.full_name}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-gray-300">{p.make} {p.model}</div>
                                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{p.license_plate || 'No Plate'}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-bold text-gray-300 font-mono">{p.phone}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                    {Math.round(p.days_since_registered)} days
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Single WhatsApp Template Modal */}
            {activeTemplateReminder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card p-8 max-w-lg w-full border-green-500/20">
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2 text-left text-green-400">
                            WhatsApp Message Template
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 text-left">
                            Customize the message scope for {activeTemplateReminder.client_name} ({activeTemplateReminder.make} {activeTemplateReminder.model}).
                        </p>
                        
                        <div className="space-y-4 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient Mobile</label>
                                <input 
                                    type="text" 
                                    className="input-glass font-mono text-xs" 
                                    value={getFormattedPhone(activeTemplateReminder.client_phone)} 
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Text</label>
                                <textarea 
                                    className="input-glass text-xs p-4 min-h-[140px]" 
                                    value={customMessage}
                                    onChange={e => setCustomMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                            <button className="flex-1 btn-secondary text-[10px]" onClick={() => setActiveTemplateReminder(null)}>CANCEL</button>
                            <button 
                                className="flex-2 btn-primary text-[10px] bg-green-500 text-black border-none flex items-center justify-center gap-2 hover:bg-green-400" 
                                onClick={handleSendSingle}
                            >
                                <Send size={12} /> OPEN IN WHATSAPP
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk WhatsApp Queue Modal */}
            {showBulkModal && bulkQueue.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card p-8 max-w-lg w-full border-primary/20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter text-primary">
                                WhatsApp Bulk Queue
                            </h3>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-400">
                                {currentQueueIndex + 1} OF {bulkQueue.length}
                            </span>
                        </div>

                        <p className="text-xs text-gray-400 mb-6 text-left">
                            Due to browser constraints, each message must be triggered one by one. Bookkeeping will mark each reminder as Sent as you proceed.
                        </p>

                        <div className="space-y-4 text-left mb-6">
                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Recipient</div>
                                <div className="text-sm font-black text-white uppercase">{bulkQueue[currentQueueIndex].reminder.client_name}</div>
                                <div className="text-xs text-primary font-bold mt-0.5">{getFormattedPhone(bulkQueue[currentQueueIndex].reminder.client_phone)}</div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Preview</label>
                                <textarea 
                                    className="input-glass text-xs p-4 min-h-[140px] bg-black/20" 
                                    value={bulkQueue[currentQueueIndex].message}
                                    onChange={e => {
                                        const updated = [...bulkQueue];
                                        updated[currentQueueIndex].message = e.target.value;
                                        setBulkQueue(updated);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-white/5">
                            <button 
                                className="flex-1 btn-secondary text-[10px] hover:text-red-400" 
                                onClick={() => { setShowBulkModal(false); setBulkQueue([]); }}
                            >
                                ABORT QUEUE
                            </button>
                            <button 
                                className="flex-1 btn-secondary text-[10px]" 
                                onClick={handleSkipBulkCurrent}
                            >
                                SKIP CURRENT
                            </button>
                            <button 
                                className="flex-2 btn-primary text-[10px] bg-green-500 text-black border-none flex items-center justify-center gap-2 hover:bg-green-400" 
                                onClick={handleSendBulkCurrent}
                            >
                                <Send size={12} /> SEND & NEXT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceRemindersModule;
