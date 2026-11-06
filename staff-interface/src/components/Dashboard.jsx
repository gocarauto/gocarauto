import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { 
    Zap, Clock, DollarSign, Activity, ChevronRight, CheckCircle2, 
    AlertTriangle, TrendingUp, Loader, Plus, Users, Car, Wrench, MessageSquare, Send, Calendar, Check, Tag
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const DEFAULT_SUMMARY = {
    totalCustomers: 0,
    totalVehicles: 0,
    openRequests: 0,
    inProgressRequests: 0,
    outstandingBalance: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalInvoiced: 0,
    upcomingServices: 0,
    mileageAlerts: 0
};

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [telemetryError, setTelemetryError] = useState(false);
    const [reminders, setReminders] = useState([]);
    const [consignmentLeads, setConsignmentLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState(null);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [activityFilter, setActivityFilter] = useState('All');

    const fetchData = async () => {
        setLoading(true);
        setTelemetryError(false);
        try {
            const [statsRes, remindersRes, consignmentRes] = await Promise.all([
                api.get('/reports/dashboard').catch((err) => {
                    console.warn('Dashboard stats fetch failed:', err.message);
                    return { data: { data: null } };
                }),
                api.get('/reminders/all').catch(() => ({ data: { data: [] } })),
                api.get('/consignment/requests?status=New').catch(() => ({ data: { data: [] } }))
            ]);

            if (statsRes.data?.data) {
                setStats(statsRes.data.data);
            } else {
                setStats({ summary: DEFAULT_SUMMARY, recentActivity: [] });
                setTelemetryError(true);
            }

            setReminders(remindersRes.data?.data || []);
            setConsignmentLeads(consignmentRes.data?.data || []);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setStats({ summary: DEFAULT_SUMMARY, recentActivity: [] });
            setTelemetryError(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchForecast = async () => {
        try {
            const res = await api.get('/reports/forecast');
            setForecast(res.data?.data || res.data || null);
        } catch (error) {
            console.error('Error fetching forecast:', error);
        } finally {
            setForecastLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchForecast();
    }, []);

    const handleUpdateLeadStatus = async (leadId, newStatus) => {
        try {
            await api.patch(`/consignment/requests/${leadId}`, { status: newStatus });
            setConsignmentLeads(prev => prev.filter(l => l.id !== leadId));
        } catch (err) {
            console.error('Failed to update lead status:', err);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <Loader className="animate-spin text-[#fbbf24]" size={36} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
                SYNCHRONIZING WORKSHOP TELEMETRY...
            </span>
        </div>
    );

    const activeStats = stats || { summary: DEFAULT_SUMMARY, recentActivity: [] };
    const { summary = DEFAULT_SUMMARY, recentActivity = [] } = activeStats;

    const filteredActivity = (recentActivity || []).filter(activity => {
        if (activityFilter === 'All') return true;
        if (activityFilter === 'In Progress') return activity.status?.includes('Progress');
        if (activityFilter === 'Pending') return activity.status?.includes('Pending') || activity.status?.includes('Open');
        if (activityFilter === 'Complete') return activity.status?.includes('Comple') || activity.status?.includes('Paid');
        return true;
    });

    const sendArabicWhatsApp = (r) => {
        const msg = `مرحباً أستاذ ${r.client_name}،\nنود تذكير حضرتك بأن سيارتك ${r.make} ${r.model} قد حان موعد ${r.service_type}.\nيسعدنا حجز موعد مناسب لحضرتك في مركز GoCar Auto. هل يناسبك موعد هذا الأسبوع؟`;
        const phone = (r.client_phone || '').replace(/[+ -]/g, '');
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const sendEnglishWhatsApp = (r) => {
        const msg = `Hi ${r.client_name},\nThis is a courtesy reminder from GoCar Auto that your ${r.make} ${r.model} is due for its ${r.service_type}. Would you like to schedule an arrival slot this week?`;
        const phone = (r.client_phone || '').replace(/[+ -]/g, '');
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="space-y-8 pb-20">
            {telemetryError && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Cloud Telemetry Initializing</p>
                            <p className="text-[11px] text-gray-300">Database statistics link is reconnecting. Live metrics will populate shortly.</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                    >
                        Retry Sync
                    </button>
                </div>
            )}
            
            {/* ── Rapid Dispatch Bar (Top Level Actions) ── */}
            <section className="bg-white/5 border border-white/10 rounded-[2.2rem] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Link
                        to="/service-requests/new"
                        className="flex-1 sm:flex-none py-3 px-5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>New Work Order</span>
                    </Link>
                    <Link
                        to="/customers/new"
                        className="flex-1 sm:flex-none py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center justify-center gap-2 transition-all"
                    >
                        <Users size={15} />
                        <span>Register Client</span>
                    </Link>
                    <Link
                        to="/vehicles/new"
                        className="flex-1 sm:flex-none py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center justify-center gap-2 transition-all"
                    >
                        <Car size={15} />
                        <span>Intake Vehicle</span>
                    </Link>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-bold text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-emerald-400">FLOOR STATUS:</span>
                    <span>{summary.inProgressRequests} In Progress • {summary.openRequests} Pending Intake</span>
                </div>
            </section>

            {/* ── Used Car Consignment Alerts ── */}
            {consignmentLeads.length > 0 && (
                <section className="bg-amber-500/10 border border-amber-500/30 rounded-[2.2rem] p-5 md:p-6 backdrop-blur-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                                <Tag size={20} />
                            </span>
                            <div>
                                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <span>Used Car Consignment Leads</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">{consignmentLeads.length} NEW</span>
                                </h4>
                                <p className="text-xs text-gray-400">Customers requesting GoCar to handle the sale of their vehicle</p>
                            </div>
                        </div>
                        <Link
                            to="/consignment"
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                        >
                            Open Consignment Hub
                            <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {consignmentLeads.map(lead => (
                            <div key={lead.id} className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">{lead.client_name}</span>
                                        <h5 className="text-sm font-bold text-white">{lead.make} {lead.model} ({lead.year})</h5>
                                        <span className="text-[11px] text-gray-400 font-mono">{lead.license_plate}</span>
                                    </div>
                                    {lead.asking_price && (
                                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                            {lead.asking_price.toLocaleString()} EGP
                                        </span>
                                    )}
                                </div>
                                {lead.notes && (
                                    <p className="text-xs text-gray-300 italic line-clamp-2">"{lead.notes}"</p>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                                    <a
                                        href={`tel:${lead.client_phone}`}
                                        className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                                    >
                                        📞 {lead.client_phone}
                                    </a>
                                    <button
                                        onClick={() => handleUpdateLeadStatus(lead.id, 'Contacted')}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider transition-colors"
                                    >
                                        Mark Contacted
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Top Stats Grid (Metric Cards) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="ACTIVE WORK ORDERS"
                    value={summary.openRequests + summary.inProgressRequests}
                    sub={`${summary.inProgressRequests} In Bay • ${summary.openRequests} In Queue`}
                    color="text-amber-400"
                    bgColor="bg-amber-400/10"
                    borderColor="border-amber-400/20"
                    icon={Wrench}
                    progress={Math.round((summary.inProgressRequests / ((summary.openRequests + summary.inProgressRequests) || 1)) * 100)}
                />
                <MetricCard
                    title="UPCOMING APPOINTMENTS"
                    value={summary.upcomingServices}
                    sub="Workshop Arrival Due ≤ 7 Days"
                    color="text-blue-400"
                    bgColor="bg-blue-400/10"
                    borderColor="border-blue-400/20"
                    icon={Clock}
                    progress={Math.min(100, Math.round((summary.upcomingServices / (summary.totalVehicles || 1)) * 100))}
                />
                <MetricCard
                    title="MONTHLY REVENUE"
                    value={`${(summary.monthlyRevenue || 0).toLocaleString()} EGP`}
                    sub="Invoiced & Paid Work Orders"
                    color="text-emerald-400"
                    bgColor="bg-emerald-400/10"
                    borderColor="border-emerald-400/20"
                    icon={DollarSign}
                    progress={Math.min(100, Math.round(((summary.monthlyRevenue || 0) / 100000) * 100))}
                />
                <MetricCard
                    title="MILEAGE ALERTS"
                    value={summary.mileageAlerts || 0}
                    sub="Assets exceeding safety cycles"
                    color="text-rose-400"
                    bgColor="bg-rose-400/10"
                    borderColor="border-rose-400/20"
                    icon={AlertTriangle}
                    progress={Math.min(100, (summary.mileageAlerts || 0) * 15)}
                />
            </div>

            {/* ── Recent Service Activity Table ── */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <span>Service Operations Feed</span>
                        </h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-0.5">Real-time status updates from active workshop floor</p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-full border border-white/5 overflow-x-auto no-scrollbar">
                        {['All', 'In Progress', 'Pending', 'Complete'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActivityFilter(filter)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                    activityFilter === filter
                                        ? 'bg-white text-black shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Client</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Vehicle / Operation</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredActivity.length > 0 ? filteredActivity.map((activity) => (
                                <tr key={activity.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-8 py-5 text-xs font-mono font-bold text-gray-400">
                                        {formatDate(activity.date)}
                                    </td>
                                    <td className="px-8 py-5 font-black text-sm text-white uppercase tracking-tight">
                                        {activity.customer}
                                    </td>
                                    <td className="px-8 py-5 text-xs font-medium text-gray-300 max-w-xs truncate">
                                        {activity.details}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`badge ${
                                            activity.status?.includes('Comple') || activity.status?.includes('Paid') ? 'badge-success' : 
                                            activity.status?.includes('Progress') ? 'badge-warning' : 'badge-info'
                                        }`}>
                                            {activity.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link to={`/service-requests/${activity.id}`}>
                                            <button className="text-[#fbbf24] hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-1 group/link ml-auto cursor-pointer transition-colors">
                                                <span>MANAGE</span>
                                                <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-16 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                        No matching work orders in this view
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Due Service Reminders Section (Bilingual WhatsApp Dispatch) ── */}
            {reminders.length > 0 && (
                <div className="glass-card overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <span className="text-[#25D366]">Action Required: Maintenance Reminders</span>
                            </h3>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-0.5">
                                Send 1-tap personalized WhatsApp reminder notifications
                            </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-bold font-mono">
                            {reminders.length} Due for Outreach
                        </span>
                    </div>

                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {reminders.map(r => (
                            <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-white/20 transition-all">
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-white uppercase">{r.client_name}</div>
                                    <div className="text-xs text-gray-400 font-medium">
                                        {r.make} {r.model} • <span className="text-[#fbbf24] font-bold">{r.service_type}</span>
                                    </div>
                                    <div className="text-[11px] text-rose-400 font-mono font-bold">
                                        TARGET DATE: {formatDate(r.due_date)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => sendArabicWhatsApp(r)}
                                        className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                                        title="إرسال رسالة تذكير باللغة العربية"
                                    >
                                        <MessageSquare size={14} />
                                        <span>عربي</span>
                                    </button>
                                    <button 
                                        onClick={() => sendEnglishWhatsApp(r)}
                                        className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                                        title="Send in English"
                                    >
                                        <span>EN</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 30-Day AI Revenue Forecast Panel ── */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-tight text-purple-400 flex items-center gap-2">
                            <TrendingUp size={22} />
                            <span>30-Day Predictive Revenue Forecast</span>
                        </h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-0.5">
                            Automated ML forecast based on recurring maintenance schedules
                        </p>
                    </div>

                    {forecast && (
                        <div className="sm:text-right">
                            <div className="text-3xl font-display font-black text-white tracking-tighter">
                                {(forecast.forecastTotal || 0).toLocaleString()} <span className="text-xs text-gray-400 uppercase font-sans">EGP</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                                AI Confidence: {forecast.confidence || '92%'}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-6 md:p-8">
                    {forecastLoading ? (
                        <div className="flex items-center justify-center p-8 text-purple-400 flex-col gap-3">
                            <Loader className="animate-spin" size={28} />
                            <span className="text-xs font-mono font-bold uppercase tracking-widest">Generating Predictive Matrix...</span>
                        </div>
                    ) : forecast && forecast.forecastByType ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(forecast.forecastByType).map(([type, amount]) => {
                                const maxAmount = Math.max(...Object.values(forecast.forecastByType), 1);
                                const percentage = Math.round(((amount || 0) / maxAmount) * 100);
                                return (
                                    <div key={type} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-300">
                                            <span>{type}</span>
                                            <span className="font-mono text-purple-300">{(amount || 0).toLocaleString()} EGP</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest py-6">
                            No forecast data available for current cycle
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

const MetricCard = ({ title, value, sub, color, bgColor, borderColor, icon: Icon, progress }) => (
    <div className={`glass-card p-6 md:p-8 border ${borderColor} relative overflow-hidden group`}>
        <div className={`absolute -right-6 -top-6 w-28 h-28 ${bgColor} rounded-full opacity-40 group-hover:opacity-70 transition-opacity`}></div>
        <Icon className={`absolute right-6 top-6 ${color} opacity-20 w-14 h-14 group-hover:scale-110 transition-transform`} />
        
        <div className="relative z-10 flex flex-col h-full space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {title}
            </span>
            <div className="text-3xl md:text-4xl font-display font-black text-white tracking-tighter">
                {value}
            </div>
            <p className="text-xs font-semibold text-gray-400 max-w-[85%] pb-4">
                {sub}
            </p>

            <div className="mt-auto h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color.replace('text-', 'bg-')} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    </div>
);

export default Dashboard;
