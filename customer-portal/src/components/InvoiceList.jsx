import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import {
    Receipt,
    Search,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    ArrowUpDown
} from 'lucide-react';

const InvoiceList = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const [invoices, setInvoices] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_invoices_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(() => {
        try {
            return !sessionStorage.getItem('gocar_invoices_cache');
        } catch {
            return true;
        }
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await api.get('/customer-portal/invoices');
                const list = response.data?.data || [];
                setInvoices(list);
                try {
                    sessionStorage.setItem('gocar_invoices_cache', JSON.stringify(list));
                } catch {
                    // ignore storage quota issues
                }
            } catch {
                console.error('Failed to fetch invoices');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handleViewInvoice = (invoiceId) => {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
            ? 'https://gocar-backend-crtx.onrender.com/api'
            : 'http://localhost:3000/api');
        window.open(`${baseUrl}/financial/${invoiceId}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`, '_blank', 'noopener,noreferrer');
    };

    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
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
        } catch (error) {
            console.error('Error downloading invoice PDF:', error);
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            window.open(`${baseUrl}/financial/${invoiceId}/pdf${token ? `?token=${token}` : ''}`, '_blank');
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.vehicle_info?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid':
                return { 
                    icon: CheckCircle2, 
                    class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', 
                    labelEn: 'Settled / Paid',
                    labelAr: 'مسدد بالكامل'
                };
            case 'Partial':
                return { 
                    icon: Clock, 
                    class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', 
                    labelEn: 'Partial Payment',
                    labelAr: 'سداد جزئي'
                };
            default:
                return { 
                    icon: AlertCircle, 
                    class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20', 
                    labelEn: 'Outstanding Balance',
                    labelAr: 'مستحق السداد'
                };
        }
    };

    const totalInvoiced = invoices.reduce((acc, inv) => acc + (parseFloat(inv.total_amount_due) || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (parseFloat(inv.amount_paid) || 0), 0);
    const outstanding = invoices
        .filter(i => i.payment_status !== 'Paid')
        .reduce((acc, inv) => acc + ((parseFloat(inv.total_amount_due) || 0) - (parseFloat(inv.amount_paid) || 0)), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-7 pb-16">
            
            {/* Header */}
            <header className="border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                    {isAr ? 'الفواتير والبيانات المالية' : 'Service Invoices & Billing'}
                </h1>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                    {isAr ? 'سجل الفواتير الضريبية وتفاصيل سداد قطع الغيار والمصنعيات المعتمدة' : 'Official VAT statements, transparent parts & labor accounting, and payment receipts'}
                </p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isAr ? 'إجمالي الفواتير المسجلة' : 'Total Invoiced'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                                {totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-bold text-slate-500">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center font-bold">
                        <Receipt size={20} />
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isAr ? 'المبالغ المسددة' : 'Settled Total'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isAr ? 'المتبقي / المستحق' : 'Outstanding Balance'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-extrabold tabular-nums ${outstanding > 0 ? 'text-amber-500' : 'text-slate-950 dark:text-white'}`}>
                                {outstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-bold text-slate-500">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                        <Clock size={20} />
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-[#0c0d12] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder={isAr ? 'البحث برقم الفاتورة، السيارة، أو نوع الخدمة...' : 'Search by invoice number or service...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl py-3 ltr:pl-11 rtl:pr-11 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                        {filteredInvoices.length} {isAr ? 'فاتورة' : 'records'}
                    </span>
                </div>

                {/* Mobile Responsive Cards (< md screens) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {loading && invoices.length === 0 ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="p-4 space-y-2 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-white/[0.04] rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded w-1/2" />
                            </div>
                        ))
                    ) : filteredInvoices.length > 0 ? (
                        filteredInvoices.map((inv, idx) => {
                            const Status = getStatusStyle(inv.payment_status);
                            const StatusIcon = Status.icon;
                            const amountDue = parseFloat(inv.total_amount_due) || 0;

                            return (
                                <div key={inv.id || idx} className="p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0">
                                                <Receipt size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-mono font-bold text-slate-900 dark:text-white block text-sm truncate tabular-nums">
                                                    {inv.invoice_number}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                                                    {inv.service_type || 'Maintenance'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${Status.class}`}>
                                            <StatusIcon size={12} />
                                            <span>{isAr ? Status.labelAr : Status.labelEn}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100/60 dark:border-white/[0.04]">
                                        <div>
                                            <span className="text-slate-400 text-xs uppercase font-bold block">{isAr ? 'المركبة' : 'Vehicle'}</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                                {inv.vehicle_info || (inv.make ? `${inv.make} ${inv.model}` : '—')}
                                            </span>
                                        </div>
                                        <div className="text-right rtl:text-left">
                                            <span className="text-slate-400 text-xs uppercase font-bold block">{isAr ? 'القيمة' : 'Total Due'}</span>
                                            <span className="font-semibold text-slate-950 dark:text-white text-sm tabular-nums">
                                                {amountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                            onClick={() => handleViewInvoice(inv.id)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 flex items-center gap-1 active:scale-95 transition-all"
                                        >
                                            <Eye size={13} />
                                            <span>{isAr ? 'عرض' : 'View'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1 active:scale-95 transition-all"
                                        >
                                            <Download size={13} />
                                            <span>PDF</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            <FileText size={24} className="mx-auto mb-2 opacity-40" />
                            <span>{isAr ? 'لا توجد فواتير مطابقة' : 'No invoices found'}</span>
                        </div>
                    )}
                </div>

                {/* Desktop Full Data Table (md+ screens) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse text-left rtl:text-right">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'نوع الخدمة' : 'Service Type'}</th>
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'المركبة' : 'Vehicle'}</th>
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'القيمة' : 'Total Due'}</th>
                                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'حالة السداد' : 'Status'}</th>
                                <th className="px-6 py-4 ltr:text-right rtl:text-left text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isAr ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-sm">
                            {loading && invoices.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-white/[0.04]">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-5 bg-slate-200 dark:bg-white/[0.04] rounded-md w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredInvoices.map((inv, idx) => {
                                const Status = getStatusStyle(inv.payment_status);
                                const StatusIcon = Status.icon;
                                const amountDue = parseFloat(inv.total_amount_due) || 0;
                                return (
                                    <tr key={inv.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0">
                                                    <Receipt size={16} />
                                                </div>
                                                <span className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-white">{inv.invoice_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-base text-slate-950 dark:text-white">
                                            {inv.service_type || 'Maintenance'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium text-sm">
                                            {inv.vehicle_info || (inv.make ? `${inv.make} ${inv.model}` : '—')}
                                        </td>
                                        <td className="px-6 py-4 font-semibold font-mono tabular-nums text-slate-950 dark:text-white text-base">
                                            {amountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-amber-500 font-bold font-sans">EGP</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${Status.class}`}>
                                                <StatusIcon size={13} />
                                                <span>{isAr ? Status.labelAr : Status.labelEn}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 ltr:text-right rtl:text-left">
                                            <div className="flex items-center ltr:justify-end rtl:justify-start gap-1">
                                                <button
                                                    onClick={() => handleViewInvoice(inv.id)}
                                                    className="p-2 text-slate-400 hover:text-amber-500 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                    title={isAr ? 'عرض الفاتورة' : 'View Online Statement'}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                                                    className="p-2 text-slate-400 hover:text-sky-500 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                    title={isAr ? 'تحميل PDF' : 'Download Invoice PDF'}
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <FileText size={24} />
                                            <p className="text-xs font-semibold">
                                                {isAr ? 'لا توجد فواتير مطابقة' : 'No invoices found'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoiceList;
