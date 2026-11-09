import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Download, Wrench, Car, Calendar, DollarSign, Activity, Percent, CreditCard, ArrowUpDown
} from 'lucide-react';

const COLORS = ['#38bdf8', '#e68a4b', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PAY_COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444'];

const ReportsDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [serviceMix, setServiceMix] = useState([]);
    const [topVehicles, setTopVehicles] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [economics, setEconomics] = useState(null);
    const [referralLeaderboard, setReferralLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    const [sortConfig, setSortConfig] = useState({ key: 'totalRevenue', direction: 'desc' });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [dashRes, revRes, servRes, vehRes, custRes] = await Promise.all([
                    api.get('/reports/dashboard'),
                    api.get('/reports/revenue?groupBy=month'),
                    api.get('/reports/services'),
                    api.get('/reports/vehicles'),
                    api.get('/reports/customers').catch(() => ({ data: { data: {} } }))
                ]);

                setSummary(dashRes.data.data.summary);
                setRevenueTrend(revRes.data.data.revenue.slice(0, 12).reverse());
                if (revRes.data.data.paymentMethods) setPaymentMethods(revRes.data.data.paymentMethods);
                setServiceMix(servRes.data.data.serviceDistribution);
                setTopVehicles(vehRes.data.data.topVehicles);
                setEconomics(revRes.data.data.economics || null);
                setReferralLeaderboard(custRes.data?.data?.referralLeaderboard || []);

            } catch (error) {
                console.error('Error loading analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleExport = async (type) => {
        try {
            const response = await api.get(`/reports/${type}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report_mission_data.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedVehicles = React.useMemo(() => {
        if (!topVehicles) return [];
        let sortableItems = [...topVehicles];
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [topVehicles, sortConfig]);

    const displayFeeRevenue = summary?.calculatedFees || 0;

    if (loading) return (
        <div className="p-20 text-center animate-glow text-gray-500 font-bold tracking-widest text-xs uppercase">
            DECRYPTING ANALYTICS...
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Performance Analytics</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Overview of organizational performance and fleet analytics</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleExport('revenue')} className="btn-secondary">
                        <Download size={16} /> REVENUE LOG
                    </button>
                    <button onClick={() => handleExport('customers')} className="btn-secondary">
                        <Download size={16} /> FLEET DATA
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportMetric
                    title="Total Revenue"
                    value={`${(summary?.totalInvoiced || 0).toLocaleString()} EGP`}
                    icon={<DollarSign size={24} />}
                    color="text-blue-500"
                    bg="bg-blue-500"
                    border="border-blue-500"
                />
                <ReportMetric
                    title="Service Fees"
                    value={`${displayFeeRevenue.toLocaleString()} EGP`}
                    icon={<Percent size={24} />}
                    color="text-primary"
                    bg="bg-primary"
                    border="border-primary"
                />
                <ReportMetric
                    title="Service Output"
                    value={summary?.openRequests + summary?.inProgressRequests}
                    icon={<Wrench size={24} />}
                    color="text-purple-500"
                    bg="bg-purple-500"
                    border="border-purple-500"
                />
                <ReportMetric
                    title="Outstanding Balance"
                    value={`${summary?.outstandingBalance?.toLocaleString() || 0} EGP`}
                    icon={<Activity size={24} />}
                    color="text-red-500"
                    bg="bg-red-500"
                    border="border-red-500"
                />
            </div>

            {/* Operational Economics & Margin Segregation */}
            {economics && (
                <div className="bg-white/5 border border-white/10 rounded-[2.2rem] p-6 md:p-8 backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Percent size={18} className="text-amber-400" />
                                <span>Operational Economics Breakdown</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Segregation of Workshop Pass-Through, Delivery Concierge, and GoCar Net Margin</p>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-black">
                            NET GOCAR VALUE: {(economics.gocarNetMargin || 0).toLocaleString()} EGP
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Billed Revenue</span>
                            <p className="text-2xl font-black text-white font-mono">{(economics.totalRevenue || 0).toLocaleString()} <span className="text-xs font-sans text-gray-400">EGP</span></p>
                            <span className="text-[9px] text-gray-500 block">Gross revenue & commissions</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Workshop Pass-Through</span>
                            <p className="text-2xl font-black text-blue-400 font-mono">{(economics.workshopPassThrough || 0).toLocaleString()} <span className="text-xs font-sans text-gray-400">EGP</span></p>
                            <span className="text-[9px] text-gray-500 block">Billed mechanical labor & raw parts</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Delivery Concierge</span>
                            <p className="text-2xl font-black text-emerald-400 font-mono">{(economics.totalDeliveryRevenue || 0).toLocaleString()} <span className="text-xs font-sans text-gray-400">EGP</span></p>
                            <span className="text-[9px] text-gray-500 block">Mandatory pick-up & delivery fees</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Service Fees</span>
                            <p className="text-2xl font-black text-amber-400 font-mono">{(economics.totalServiceFees || 0).toLocaleString()} <span className="text-xs font-sans text-gray-400">EGP</span></p>
                            <span className="text-[9px] text-gray-500 block">10%–15% sliding management fee</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Consignment Cuts</span>
                            <p className="text-2xl font-black text-emerald-400 font-mono">{(economics.totalConsignmentCommissions || 0).toLocaleString()} <span className="text-xs font-sans text-gray-400">EGP</span></p>
                            <span className="text-[9px] text-gray-500 block">{economics.soldCarsCount || 0} vehicles sold (2.5% cut)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Graphs Area */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
                <div className="glass-card p-8">
                    <h3 className="mb-6 text-white font-black tracking-widest uppercase text-sm flex items-center gap-3">
                        <Calendar size={18} className="text-blue-400" /> REVENUE TREND
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="period" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700}} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(val) => `${val / 1000}k`} stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700}} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fbbf24', fontWeight: 900 }}
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    formatter={(val) => [`${val.toLocaleString()} EGP`, 'Revenue']}
                                />
                                <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={45}>
                                    {revenueTrend.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === revenueTrend.length - 1 ? '#fbbf24' : '#3b82f6'} opacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-8">
                    <h3 className="mb-6 text-white font-black tracking-widest uppercase text-sm flex items-center gap-3">
                        <Car size={18} className="text-primary" /> SERVICE CATEGORY MIX
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={serviceMix}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="category"
                                    stroke="none"
                                >
                                    {serviceMix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Secondary Intel Section */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                <div className="glass-card p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-black tracking-widest uppercase text-sm">TOP SERVICE VEHICLES</h3>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">RANKED BY REVENUE</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th onClick={() => handleSort('make')} className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        MAKE <ArrowUpDown size={12} className="inline ml-1 opacity-50" />
                                    </th>
                                    <th onClick={() => handleSort('model')} className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        MODEL <ArrowUpDown size={12} className="inline ml-1 opacity-50" />
                                    </th>
                                    <th onClick={() => handleSort('totalRevenue')} className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        VALUE <ArrowUpDown size={12} className="inline ml-1 opacity-50" />
                                    </th>
                                    <th onClick={() => handleSort('serviceCount')} className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        OPS <ArrowUpDown size={12} className="inline ml-1 opacity-50" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sortedVehicles.map((v, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-4 font-bold text-white uppercase tracking-wider">{v.make}</td>
                                        <td className="px-4 py-4 text-gray-400 text-sm font-medium">{v.model || 'All Units'}</td>
                                        <td className="px-4 py-4 text-primary font-black">{v.totalRevenue.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-gray-300 font-bold">{v.serviceCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-card p-8">
                    <h3 className="mb-6 text-white font-black tracking-widest uppercase text-sm flex items-center gap-3">
                        <CreditCard size={18} className="text-blue-400" /> PAYMENT METHODS
                    </h3>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="total"
                                    nameKey="payment_method"
                                    stroke="none"
                                >
                                    {paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PAY_COLORS[index % PAY_COLORS.length]} opacity={0.8} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val) => `${val.toLocaleString()} EGP`} contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Referral Network Champions */}
            {referralLeaderboard && referralLeaderboard.length > 0 && (
                <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-white font-black tracking-widest uppercase text-sm flex items-center gap-2">
                                <span>⭐ Word-of-Mouth Referral Network Champions</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Existing clients driving new customer acquisitions and network lifetime value</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                            {referralLeaderboard.length} Top Champions
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-white/5 text-gray-400 uppercase font-black tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-5 py-3">Champion / Referrer</th>
                                    <th className="px-5 py-3">Phone</th>
                                    <th className="px-5 py-3 text-center">Referred Clients</th>
                                    <th className="px-5 py-3 text-right">Network Billed Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {referralLeaderboard.map((ref, idx) => (
                                    <tr key={ref.referrer_id || idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-white text-sm flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono">
                                                    #{idx + 1}
                                                </span>
                                                <span>{ref.referrer_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-mono text-gray-400">{ref.referrer_phone || '—'}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="px-2.5 py-1 rounded-full bg-white/5 font-mono font-black text-white text-xs">
                                                {ref.referred_count} {ref.referred_count === 1 ? 'Client' : 'Clients'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="text-emerald-400 font-mono font-black text-sm">
                                                {parseFloat(ref.total_network_spent || 0).toLocaleString()} EGP
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReportMetric = ({ title, value, icon, color, bg, border }) => (
    <div className="glass-card p-8 flex items-center gap-6 overflow-hidden relative group">
        <div className={`absolute -right-6 -top-6 w-24 h-24 ${bg}/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        <div className={`w-14 h-14 rounded-2xl ${bg}/10 border flex items-center justify-center ${color} ${border}/20 shadow-inner relative z-10 group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{title}</div>
            <div className="text-3xl font-display font-black text-white tracking-tighter">{value}</div>
        </div>
    </div>
);

export default ReportsDashboard;
