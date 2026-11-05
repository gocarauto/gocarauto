import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
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
    ArrowUpDown
} from 'lucide-react';

const ServiceHistory = () => {
    const { t, lang } = useLanguage();
    const { darkMode } = useTheme();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [sortField, setSortField] = useState('service_date');
    const [sortDir, setSortDir] = useState('desc');
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/customer-portal/service-history');
                setHistory(response.data.data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // WHY: Support both direct view columns (vehicle_info, item_name, total_price) and legacy aliases
    const getItemTitle = (item) => {
        if (lang === 'ar') {
            return item.item_name_ar || item.item_name || item.service_type || 'صيانة';
        }
        return item.item_name || item.item_name_ar || item.service_type || 'Maintenance';
    };

    const getItemVehicle = (item) => item.vehicle_info || item.vehicle_name || 'Vehicle';
    const getItemCost = (item) => parseFloat(item.total_price ?? item.total_cost ?? 0);
    const getItemStatus = (item) => item.request_status || item.payment_status || item.status || 'Completed';

    const handleViewInvoice = async (invoiceId) => {
        if (!invoiceId) {
            alert('No invoice generated for this record yet.');
            return;
        }
        try {
            const response = await api.get(`/financial/${invoiceId}/view`);
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(response.data);
                newWindow.document.close();
            }
        } catch (e) {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            window.open(`${baseUrl}/financial/${invoiceId}/view${token ? `?token=${token}` : ''}`, '_blank');
        }
    };

    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
        if (!invoiceId) {
            alert('No invoice generated for this record yet.');
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
        } catch (e) {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            window.open(`${baseUrl}/financial/${invoiceId}/pdf${token ? `?token=${token}` : ''}`, '_blank');
        }
    };

    const TAB_KEYWORDS = { All: '', Oil: 'oil', Brakes: 'brake', Tires: 'tire' };

    const filteredHistory = history
        .filter(item => {
            const kw = TAB_KEYWORDS[activeTab];
            const title = getItemTitle(item).toLowerCase();
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
            getItemStatus(item)
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'service_history.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    // Compute real stats from data
    const totalSpent = history.reduce((s, i) => s + getItemCost(i), 0);
    const uniqueVehicles = new Set(history.map(i => getItemVehicle(i))).size;

    const getIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('oil') || t.includes('زيت')) return { icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' };
        if (t.includes('brake') || t.includes('فرامل')) return { icon: Hexagon, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' };
        if (t.includes('filter') || t.includes('فلتر')) return { icon: Wind, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' };
        return { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' };
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
            {/* ── Top Header Section ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Records', value: history.length },
                    { label: 'YTD Maintenance', value: `${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP` },
                    { label: 'Active Vehicles', value: uniqueVehicles },
                ].map((stat, i) => (
                    <div key={i} className="p-8 rounded-[2rem] border bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-black dark:text-white">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">{stat.label}</span>
                        <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* ── Table Container ── */}
            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden transition-colors duration-500">
                {/* Table Header / Toolbar */}
                <div className="p-8 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by service, vehicle, or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-full py-4 pl-14 pr-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-50 dark:bg-black/20 p-1.5 rounded-full">
                            {['All', 'Oil', 'Brakes', 'Tires'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabChange(tab)}
                                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                        tab === activeTab
                                            ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm'
                                            : 'text-gray-400 hover:text-black dark:hover:text-white'
                                    }`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={exportCSV}
                            className="h-12 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all shadow-lg">
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5">
                                <th onClick={() => toggleSort('service_type')} className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-black dark:hover:text-white">
                                    <div className="flex items-center gap-2">Service Type <ArrowUpDown size={12} /></div>
                                </th>
                                <th onClick={() => toggleSort('service_date')} className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-black dark:hover:text-white">
                                    <div className="flex items-center gap-2">Date <ArrowUpDown size={12} /></div>
                                </th>
                                <th onClick={() => toggleSort('vehicle_name')} className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-black dark:hover:text-white">
                                    <div className="flex items-center gap-2">Vehicle Name <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Mileage</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Cost (EGP)</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {paginatedHistory.length > 0 ? paginatedHistory.map((item, idx) => {
                                const title = getItemTitle(item);
                                const vehicle = getItemVehicle(item);
                                const cost = getItemCost(item);
                                const status = getItemStatus(item);
                                const style = getIcon(title);
                                const vinDisplay = item.vin ? `VIN: ...${item.vin.slice(-4)}` : (item.license_plate ? `Plate: ${item.license_plate}` : '');
                                return (
                                    <tr key={item.record_id || item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl ${style.bg} ${style.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                                    <style.icon size={20} />
                                                </div>
                                                <span className="font-black text-sm text-black dark:text-white uppercase tracking-tight">{title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
                                                {formatDate(item.service_date)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm text-black dark:text-white tracking-tight uppercase">{vehicle}</span>
                                                {vinDisplay && (
                                                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase italic">{vinDisplay}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-black text-black dark:text-white uppercase tracking-tighter">{(item.mileage || 0).toLocaleString()}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">km</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-black dark:text-white uppercase tracking-tighter">{cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${['Completed', 'Complete', 'Paid'].includes(status) ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleViewInvoice(item.invoice_id)}
                                                    className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                                    title={item.invoice_id ? 'View Invoice' : 'No Invoice Available'}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadPDF(item.invoice_id, item.invoice_number)}
                                                    className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                                    title={item.invoice_id ? 'Download Invoice PDF' : 'No Invoice Available'}
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-gray-300">
                                                <FileText size={32} />
                                            </div>
                                            <p className="font-black text-gray-400 uppercase tracking-widest text-sm">No maintenance records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-8 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Showing {filteredHistory.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length} records
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-10 h-10 rounded-xl border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                        p === page
                                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/10 text-gray-400'
                                    }`}>{p}</button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-10 h-10 rounded-xl border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default ServiceHistory;
