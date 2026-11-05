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
    ArrowRight,
    Sparkles,
    FileText
} from 'lucide-react';

const InvoiceList = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await api.get('/customer-portal/invoices');
                setInvoices(response.data?.data || []);
            } catch {
                console.error('Failed to fetch invoices');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handleViewInvoice = async (invoiceId) => {
        try {
            const response = await api.get(`/financial/${invoiceId}/view`);
            const newWindow = window.open('', '_blank');
            if (!newWindow) {
                alert(isAr ? 'يرجى السماح بالنوافذ المنبثقة لمعاينة الفاتورة.' : 'Please allow pop-ups for this site to view the invoice.');
                return;
            }
            newWindow.document.write(response.data);
            newWindow.document.close();
        } catch (error) {
            console.error('Error viewing invoice:', error);
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            window.open(`${baseUrl}/financial/${invoiceId}/view${token ? `?token=${token}` : ''}`, '_blank');
        }
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
                    class: 'bg-green-500/10 text-green-500 border border-green-500/20', 
                    labelEn: 'Settled / Paid',
                    labelAr: 'مدفوع بالكامل'
                };
            case 'Partial':
                return { 
                    icon: Clock, 
                    class: 'bg-amber-500/10 text-amber-500 border border-amber-500/20', 
                    labelEn: 'Partial Payment',
                    labelAr: 'سداد جزئي'
                };
            default:
                return { 
                    icon: AlertCircle, 
                    class: 'bg-red-500/10 text-red-500 border border-red-500/20', 
                    labelEn: 'Outstanding Balance',
                    labelAr: 'مستحق السداد'
                };
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-28 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>
                <div className="h-[460px] bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>
            </div>
        );
    }

    const totalInvoiced = invoices.reduce((acc, inv) => acc + (parseFloat(inv.total_amount_due) || 0), 0);
    const outstanding = invoices
        .filter(i => i.payment_status !== 'Paid')
        .reduce((acc, inv) => acc + ((parseFloat(inv.total_amount_due) || 0) - (parseFloat(inv.amount_paid) || 0)), 0);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tighter">
                        {isAr ? 'الفواتير والبيانات المالية' : 'Official Service Invoices'}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {isAr ? 'سجل الفواتير الضريبية وتفاصيل سداد قطع الغيار والمصنعيات' : 'Verified digital invoices & transparent labor/parts accounting'}
                    </p>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#0c0d12] p-6 rounded-[2.2rem] border border-gray-100 dark:border-white/5 shadow-xl flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
                            {isAr ? 'إجمالي الفواتير المسجلة' : 'Total Invoiced Capital'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tighter text-black dark:text-white">
                                {totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#fbbf24]/10 text-[#fbbf24] flex items-center justify-center font-black">
                        <Receipt size={22} />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0c0d12] p-6 rounded-[2.2rem] border border-gray-100 dark:border-white/5 shadow-xl flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
                            {isAr ? 'المبالغ المتبقية / المستحقة' : 'Outstanding Balances'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black tracking-tighter ${outstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-black">
                        <Clock size={22} />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0c0d12] p-6 rounded-[2.2rem] border border-gray-100 dark:border-white/5 shadow-xl flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
                            {isAr ? 'عدد الفواتير الصادرة' : 'Issued Tax Documents'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tighter text-black dark:text-white">
                                {invoices.length}
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase">{isAr ? 'فاتورة' : 'Documents'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                        <FileText size={22} />
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-[#0c0d12] rounded-[2.8rem] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            type="text"
                            placeholder={isAr ? 'البحث برقم الفاتورة أو الخدمة...' : 'Search by invoice number or service...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full py-3.5 ltr:pl-12 rtl:pr-12 px-6 text-xs font-medium outline-none focus:ring-2 focus:ring-[#fbbf24] transition-all text-black dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                <th className="px-8 py-5 ltr:text-left rtl:text-right text-[10px] font-black uppercase tracking-widest text-gray-400">{isAr ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                                <th className="px-8 py-5 ltr:text-left rtl:text-right text-[10px] font-black uppercase tracking-widest text-gray-400">{isAr ? 'نوع الخدمة' : 'Service Type'}</th>
                                <th className="px-8 py-5 ltr:text-left rtl:text-right text-[10px] font-black uppercase tracking-widest text-gray-400">{isAr ? 'السيارة' : 'Vehicle'}</th>
                                <th className="px-8 py-5 ltr:text-left rtl:text-right text-[10px] font-black uppercase tracking-widest text-gray-400">{isAr ? 'إجمالي القيمة' : 'Total Amount'}</th>
                                <th className="px-8 py-5 ltr:text-left rtl:text-right text-[10px] font-black uppercase tracking-widest text-gray-400">{isAr ? 'حالة السداد' : 'Payment Status'}</th>
                                <th className="px-8 py-5 ltr:text-right rtl:text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{isAr ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredInvoices.map((inv, idx) => {
                                const Status = getStatusStyle(inv.payment_status);
                                const StatusIcon = Status.icon;
                                return (
                                    <tr key={inv.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[#fbbf24] group-hover:scale-110 transition-transform duration-300 shrink-0">
                                                    <Receipt size={18} />
                                                </div>
                                                <span className="font-mono font-black text-xs text-black dark:text-white uppercase tracking-tight">{inv.invoice_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight">{inv.service_type || 'Maintenance'}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{inv.vehicle_info || '—'}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-mono font-black text-black dark:text-white">
                                                {(parseFloat(inv.total_amount_due) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${Status.class}`}>
                                                <StatusIcon size={12} /> {isAr ? Status.labelAr : Status.labelEn}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 ltr:text-right rtl:text-left">
                                            <div className="flex items-center ltr:justify-end rtl:justify-start gap-1">
                                                <button
                                                    onClick={() => handleViewInvoice(inv.id)}
                                                    className="p-2 text-gray-400 hover:text-[#fbbf24] transition-colors rounded-lg hover:bg-white/5"
                                                    title={isAr ? 'عرض الفاتورة' : 'View Invoice'}
                                                >
                                                    <Eye size={17} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                                                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5"
                                                    title={isAr ? 'تحميل PDF' : 'Download Invoice PDF'}
                                                >
                                                    <Download size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-8 py-16 text-center">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                                            {isAr ? 'لا توجد فواتير مطابقة' : 'No invoices found'}
                                        </p>
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
