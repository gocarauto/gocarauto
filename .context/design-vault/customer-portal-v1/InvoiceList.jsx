import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import {
    Receipt,
    Search,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

const InvoiceList = () => {
    const { t, lang } = useLanguage();
    const { darkMode } = useTheme();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await api.get('/customer-portal/invoices');
                setInvoices(response.data.data);
            } catch (err) {
                console.error('Failed to fetch invoices');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    // WHY: Use authenticated endpoints /api/financial/:id/view and /api/financial/:id/pdf with token fallback
    const handleViewInvoice = async (invoiceId) => {
        try {
            const response = await api.get(`/financial/${invoiceId}/view`);
            const newWindow = window.open('', '_blank');
            if (!newWindow) {
                alert('Please allow pop-ups for this site to view the invoice.');
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
        inv.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid':
                return { icon: CheckCircle2, class: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400', label: 'Settled' };
            case 'Partial':
                return { icon: Clock, class: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400', label: 'Partial' };
            default:
                return { icon: AlertCircle, class: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', label: 'Outstanding' };
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>
                <div className="h-[500px] bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Summary Cards */}
            <header className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black text-white p-8 rounded-[2.5rem] border border-transparent shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Total Capital Logged</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter">
                            {invoices.reduce((acc, inv) => acc + (parseFloat(inv.total_amount_due) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-bold text-gray-500 uppercase">EGP</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all hover:shadow-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Outstanding Balances</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter text-red-500">
                            {invoices.filter(i => i.payment_status !== 'Paid').reduce((acc, inv) => acc + ((parseFloat(inv.total_amount_due) || 0) - (parseFloat(inv.amount_paid) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase">EGP</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all hover:shadow-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Audit Records</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter text-text-primary-light dark:text-text-primary-dark">
                            {invoices.length}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 text-[10px]">Invoices</span>
                    </div>
                </div>
            </header>

            {/* List Table */}
            <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by invoice number or service..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-full py-5 pl-16 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5">
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Invoice ID</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Service Nature</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Vehicle</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Capital</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {filteredInvoices.map((inv, idx) => {
                                const Status = getStatusStyle(inv.payment_status);
                                return (
                                    <tr key={inv.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform duration-300">
                                                    <Receipt size={20} />
                                                </div>
                                                <span className="font-black text-sm text-black dark:text-white uppercase tracking-tighter">{inv.invoice_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">{inv.service_type}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm text-black dark:text-white uppercase tracking-tighter">{inv.make} {inv.model}</span>
                                                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase italic">{inv.license_plate}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-lg font-black text-black dark:text-white tracking-tighter">{parseFloat(inv.total_amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${Status.class}`}>
                                                <Status.icon size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{Status.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleViewInvoice(inv.id)}
                                                    className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                                    title="View Invoice"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                                                    className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                                    title="Download PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-4">
                                                <Receipt size={40} />
                                            </div>
                                            <p className="font-black uppercase tracking-widest text-sm">No audit logs found</p>
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
