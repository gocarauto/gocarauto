import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatDate } from '../utils/dateUtils';
import {
    Search,
    Download,
    Eye,
    FileText,
    Droplet,
    Hexagon,
    Wind,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    CheckCircle2,
    Calendar,
    Wrench,
    Clock,
    Sparkles,
    SlidersHorizontal
} from 'lucide-react';

const ServiceHistory = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';

    const [searchParams] = useSearchParams();
    const querySearch = searchParams.get('search') || '';
    const [history, setHistory] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_history_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(() => {
        try {
            return !sessionStorage.getItem('gocar_history_cache');
        } catch {
            return true;
        }
    });
    const [searchTerm, setSearchTerm] = useState(querySearch);
    const [activeTab, setActiveTab] = useState('All');
    const [sortField, setSortField] = useState('service_date');
    const [sortDir, setSortDir] = useState('desc');
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (querySearch) setSearchTerm(querySearch);
    }, [querySearch]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/customer-portal/service-history');
                const list = response.data?.data || [];
                setHistory(list);
                try {
                    sessionStorage.setItem('gocar_history_cache', JSON.stringify(list));
                } catch {
                    // ignore storage quota issues
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Support both direct view columns and bilingual aliases
    const getItemTitle = (item) => {
        if (isAr) {
            return item.item_name_ar || item.item_name || item.service_type || 'صيانة عامة';
        }
        return item.item_name || item.item_name_ar || item.service_type || 'Maintenance';
    };

    const getItemVehicle = (item) => item.vehicle_info || item.vehicle_name || 'Vehicle';
    const getItemCost = (item) => parseFloat(item.total_price ?? item.total_cost ?? 0);
    const getItemStatus = (item) => {
        const raw = item.request_status || item.payment_status || item.status || 'Completed';
        if (isAr) {
            if (raw === 'Completed' || raw === 'Complete' || raw === 'Paid') return 'مكتمل';
            if (raw === 'Pending') return 'قيد المراجعة';
            if (raw === 'In Progress') return 'قيد الصيانة';
            return raw;
        }
        return raw;
    };

    const [toast, setToast] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const handleViewInvoice = (invoiceId) => {
        if (!invoiceId) {
            showToast(isAr ? 'لم تصدر فاتورة لهذا السجل بعد.' : 'No invoice generated for this record yet.');
            return;
        }
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
            ? 'https://gocar-backend-crtx.onrender.com/api'
            : 'http://localhost:3000/api');
        window.open(`${baseUrl}/financial/${invoiceId}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`, '_blank', 'noopener,noreferrer');
    };

    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
        if (!invoiceId) {
            showToast(isAr ? 'لم تصدر فاتورة لهذا السجل بعد.' : 'No invoice generated for this record yet.');
            return;
        }
        try {
            const response = await api.get(`/financial/${invoiceId}/pdf`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${invoiceNumber || 'invoice'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            window.open(`${baseUrl}/financial/${invoiceId}/pdf${token ? `?token=${token}` : ''}`, '_blank');
        }
    };

    const TAB_KEYWORDS = { All: '', Oil: 'oil', Brakes: 'brake', Tires: 'tire' };

    const filteredHistory = history
        .filter(item => {
            const kw = TAB_KEYWORDS[activeTab];
            const title = (item.item_name || item.item_name_ar || item.service_type || '').toLowerCase();
            const vehicle = getItemVehicle(item).toLowerCase();
            const matchesTab = !kw || title.includes(kw);
            const matchesSearch = title.includes(searchTerm.toLowerCase()) || vehicle.includes(searchTerm.toLowerCase());
            return matchesTab && matchesSearch;
        })
        .sort((a, b) => {
            const aVal = a[sortField] ?? '';
            const bVal = b[sortField] ?? '';
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
    const paginatedHistory = filteredHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
        setPage(1);
    };

    const handleTabChange = (tab) => { setActiveTab(tab); setPage(1); };

    const exportCSV = () => {
        const headers = ['Service Type', 'Date', 'Vehicle', 'Mileage (km)', 'Cost (EGP)', 'Status'];
        const rows = filteredHistory.map(item => [
            getItemTitle(item),
            item.service_date ? formatDate(item.service_date) : '',
            getItemVehicle(item),
            item.mileage || '0',
            getItemCost(item),
            item.request_status || item.payment_status || 'Completed'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = `service_history_${new Date().toISOString().split('T')[0]}.csv`; 
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalSpent = history.reduce((s, i) => s + getItemCost(i), 0);
    const uniqueVehicles = new Set(history.map(i => getItemVehicle(i))).size;

    const getIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('oil') || t.includes('زيت')) return { icon: Droplet, color: 'text-sky-500', bg: 'bg-sky-500/10' };
        if (t.includes('brake') || t.includes('فرامل')) return { icon: Hexagon, color: 'text-amber-500', bg: 'bg-amber-500/10' };
        if (t.includes('filter') || t.includes('فلتر')) return { icon: Wind, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
        return { icon: FileText, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-white/[0.06]' };
    };

    return (
        <div className="max-w-7xl mx-auto space-y-7 pb-16">
            
            {/* Header */}
            <header className="border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                    {isAr ? 'سجلات الصيانة ودفتر الخدمة' : 'Service Logbook & History'}
                </h1>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                    {isAr ? 'سجل رقمي موثق لكل زيارة وفحص وقطعة غيار معتمدة' : 'Official digital service ledger with itemized parts and verified invoices'}
                </p>
            </header>

            {/* Notification Toast */}
            {toast && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} />
                        <span>{toast}</span>
                    </div>
                    <button onClick={() => setToast(null)} className="text-xs underline cursor-pointer">
                        {isAr ? 'إغلاق' : 'Dismiss'}
                    </button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isAr ? 'إجمالي السجلات' : 'Total Records'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                                {history.length}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{isAr ? 'عملية' : 'Entries'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center font-bold">
                        <FileText size={20} />
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isAr ? 'إجمالي الاستثمار' : 'Maintenance Invested'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                                {totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-bold text-amber-500">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isAr ? 'المركبات المشمولة' : 'Vehicles Serviced'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                                {uniqueVehicles}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{isAr ? 'سيارات' : 'Cars'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                        <Wrench size={20} />
                    </div>
                </div>
            </div>

            {/* ── Table Container ── */}
            <div className="bg-white dark:bg-[#0c0d12] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
                
                {/* Table Toolbar */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input 
                            type="text" 
                            placeholder={isAr ? 'البحث بالخدمة، السيارة، أو التاريخ...' : 'Search by service or vehicle...'} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl py-3 ltr:pl-11 rtl:pr-11 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/[0.06]">
                            {[
                                { id: 'All', en: 'All', ar: 'الكل' },
                                { id: 'Oil', en: 'Oil', ar: 'الزيوت' },
                                { id: 'Brakes', en: 'Brakes', ar: 'الفرامل' },
                                { id: 'Tires', en: 'Tires', ar: 'الإطارات' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                                        tab.id === activeTab
                                            ? 'bg-white dark:bg-white/15 text-slate-950 dark:text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {isAr ? tab.ar : tab.en}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={exportCSV}
                            className="h-10 px-4 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                            title="Export records to CSV"
                        >
                            <Download size={15} />
                            <span>{isAr ? 'تصدير' : 'Export'}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Responsive Cards (< md screens) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {loading && history.length === 0 ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="p-4 space-y-2 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded w-1/2" />
                            </div>
                        ))
                    ) : paginatedHistory.length > 0 ? (
                        paginatedHistory.map((item, idx) => {
                            const title = getItemTitle(item);
                            const vehicle = getItemVehicle(item);
                            const cost = getItemCost(item);
                            const statusLabel = getItemStatus(item);
                            const rawStatus = item.request_status || item.payment_status || item.status || 'Completed';
                            const style = getIcon(title);
                            const vinDisplay = item.vin ? `VIN: ...${item.vin.slice(-4)}` : (item.license_plate ? `Plate: ${item.license_plate}` : '');

                            return (
                                <div key={item.record_id || item.id || idx} className="p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}>
                                                <style.icon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-slate-900 dark:text-white block text-base truncate">{title}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{formatDate(item.service_date)}</span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                                            ['Completed', 'Complete', 'Paid'].includes(rawStatus) 
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        }`}>
                                            {statusLabel}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100/60 dark:border-white/[0.04]">
                                        <div>
                                            <span className="text-slate-400 text-xs uppercase font-bold block">{isAr ? 'المركبة' : 'Vehicle'}</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{vehicle}</span>
                                            {vinDisplay && <span className="text-xs text-slate-400 block">{vinDisplay}</span>}
                                        </div>
                                        <div className="text-right rtl:text-left">
                                            <span className="text-slate-400 text-xs uppercase font-bold block">{isAr ? 'التكلفة' : 'Cost'}</span>
                                            <span className="font-semibold text-slate-950 dark:text-white text-sm tabular-nums">
                                                {cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-slate-500 tabular-nums font-medium">
                                            {(item.mileage || 0).toLocaleString()} km
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {item.invoice_id && (
                                                <>
                                                    <button 
                                                        onClick={() => handleViewInvoice(item.invoice_id)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 flex items-center gap-1 active:scale-95 transition-all"
                                                    >
                                                        <Eye size={13} />
                                                        <span>{isAr ? 'عرض' : 'View'}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownloadPDF(item.invoice_id, item.invoice_number)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1 active:scale-95 transition-all"
                                                    >
                                                        <Download size={13} />
                                                        <span>PDF</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            <FileText size={24} className="mx-auto mb-2 opacity-40" />
                            <span>{isAr ? 'لم يتم العثور على سجلات' : 'No maintenance records found'}</span>
                        </div>
                    )}
                </div>

                {/* Desktop Full Data Table (md+ screens) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse text-left rtl:text-right">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                                <th onClick={() => toggleSort('service_type')} className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                                    <div className="flex items-center gap-1.5">
                                        <span>{isAr ? 'نوع الخدمة' : 'Service Type'}</span>
                                        <ArrowUpDown size={13} className="opacity-60" />
                                    </div>
                                </th>
                                <th onClick={() => toggleSort('service_date')} className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                                    <div className="flex items-center gap-1.5">
                                        <span>{isAr ? 'التاريخ' : 'Date'}</span>
                                        <ArrowUpDown size={13} className="opacity-60" />
                                    </div>
                                </th>
                                <th onClick={() => toggleSort('vehicle_name')} className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                                    <div className="flex items-center gap-1.5">
                                        <span>{isAr ? 'المركبة' : 'Vehicle'}</span>
                                        <ArrowUpDown size={13} className="opacity-60" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'العداد' : 'Mileage'}</th>
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'التكلفة' : 'Amount'}</th>
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-4 ltr:text-right rtl:text-left text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'المستندات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-sm">
                            {loading && history.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-white/[0.04]">
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="h-5 bg-slate-200 dark:bg-white/[0.04] rounded-md w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedHistory.length > 0 ? paginatedHistory.map((item, idx) => {
                                const title = getItemTitle(item);
                                const vehicle = getItemVehicle(item);
                                const cost = getItemCost(item);
                                const statusLabel = getItemStatus(item);
                                const rawStatus = item.request_status || item.payment_status || item.status || 'Completed';
                                const style = getIcon(title);
                                const vinDisplay = item.vin ? `VIN: ...${item.vin.slice(-4)}` : (item.license_plate ? `Plate: ${item.license_plate}` : '');
                                return (
                                    <tr key={item.record_id || item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}>
                                                    <style.icon size={16} />
                                                </div>
                                                <span className="text-base font-bold">{title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 tabular-nums font-medium text-sm">
                                            {formatDate(item.service_date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-slate-900 dark:text-white">{vehicle}</span>
                                                {vinDisplay && (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{vinDisplay}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 tabular-nums text-slate-800 dark:text-slate-200 font-semibold text-sm">
                                            {(item.mileage || 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">km</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold tabular-nums text-slate-950 dark:text-white text-base">
                                            {cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-amber-500 font-bold">EGP</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                                                ['Completed', 'Complete', 'Paid'].includes(rawStatus) 
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${['Completed', 'Complete', 'Paid'].includes(rawStatus) ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                <span>{statusLabel}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 ltr:text-right rtl:text-left">
                                            <div className="flex items-center ltr:justify-end rtl:justify-start gap-1">
                                                <button 
                                                    onClick={() => handleViewInvoice(item.invoice_id)}
                                                    className="p-2 text-slate-400 hover:text-amber-500 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                    title={item.invoice_id ? (isAr ? 'عرض الفاتورة' : 'View Invoice') : (isAr ? 'لا توجد فاتورة' : 'No Invoice Available')}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadPDF(item.invoice_id, item.invoice_number)}
                                                    className="p-2 text-slate-400 hover:text-sky-500 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                    title={item.invoice_id ? (isAr ? 'تحميل PDF' : 'Download Invoice PDF') : (isAr ? 'لا توجد فاتورة' : 'No Invoice Available')}
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <FileText size={24} />
                                            <p className="text-xs font-semibold">
                                                {isAr ? 'لم يتم العثور على سجلات صيانة مطابقة' : 'No maintenance records found'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                        {isAr ? `عرض ${filteredHistory.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} إلى ${Math.min(page * PAGE_SIZE, filteredHistory.length)} من ${filteredHistory.length} سجل`
                              : `Showing ${filteredHistory.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredHistory.length)} of ${filteredHistory.length} records`}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-30"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} className={isAr ? 'rotate-180' : ''} />
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                        p === page
                                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                                            : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-30"
                            aria-label="Next page"
                        >
                            <ChevronRight size={16} className={isAr ? 'rotate-180' : ''} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ServiceHistory;
