import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Zap, Clock, DollarSign, Activity, ChevronRight, CheckCircle2, AlertTriangle, TrendingUp, Loader } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState(null);
    const [forecastLoading, setForecastLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, remindersRes] = await Promise.all([
                    api.get('/reports/dashboard'),
                    api.get('/reminders/all').catch(() => ({ data: { data: [] } }))
                ]);
                setStats(statsRes.data.data);
                setReminders(remindersRes.data.data || []);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchForecast = async () => {
            try {
                const res = await api.get('/reports/forecast');
                setForecast(res.data.data || res.data);
            } catch (error) {
                console.error('Error fetching forecast:', error);
            } finally {
                setForecastLoading(false);
            }
        };

        fetchData();
        fetchForecast();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center p-20 animate-glow text-gray-400 font-bold uppercase tracking-widest text-xs">
            INITIALIZING ANALYTICS...
        </div>
    );
    
    if (!stats) return (
        <div className="glass-card p-10 border-red-500/30 text-red-500 font-bold tracking-widest uppercase text-xs">
            FATAL: SYSTEM LINK FAILURE
        </div>
    );

    const { summary, recentActivity } = stats;

    return (
        <div className="space-y-10 pb-20">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="ACTIVE SERVICES"
                    value={summary.openRequests + summary.inProgressRequests}
                    sub={`${summary.openRequests} Pending • ${summary.inProgressRequests} In Progress`}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                    borderColor="border-blue-500/20"
                    icon={Zap}
                    progress={Math.round((summary.inProgressRequests / ((summary.openRequests + summary.inProgressRequests) || 1)) * 100)}
                />
                <MetricCard
                    title="UPCOMING"
                    value={summary.upcomingServices}
                    sub="Maintenance Due Within 7 Days"
                    color="text-amber-500"
                    bgColor="bg-amber-500/10"
                    borderColor="border-amber-500/20"
                    icon={Clock}
                    progress={Math.round((summary.upcomingServices / (summary.totalVehicles || 1)) * 100)}
                />
                <MetricCard
                    title="TOTAL REVENUE (GROSS)"
                    value={`${(summary.monthlyRevenue || 0).toLocaleString()} EGP`}
                    sub="Current Cycle Earnings (Target: 100k)"
                    color="text-green-500"
                    bgColor="bg-green-500/10"
                    borderColor="border-green-500/20"
                    icon={DollarSign}
                    progress={Math.min(Math.round(((summary.monthlyRevenue || 0) / 100000) * 100), 100)}
                />
                <MetricCard
                    title="MILEAGE ALERTS"
                    value={summary.mileageAlerts || 0}
                    sub="Vehicles exceeding mileage thresholds"
                    color="text-red-500"
                    bgColor="bg-red-500/10"
                    borderColor="border-red-500/20"
                    icon={AlertTriangle}
                    progress={Math.min((summary.mileageAlerts || 0) * 10, 100)}
                />
            </div>

            {/* Recent Activity */}
            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">Recent Service Activity</h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Real-time updates from service floor</p>
                    </div>
                    <div className="animate-pulse bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        LIVE FEED
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Client</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Vehicle</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentActivity.map((activity) => (
                                <tr key={activity.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-5 text-sm font-bold text-gray-400">{formatDate(activity.date)}</td>
                                    <td className="px-8 py-5 font-black text-white uppercase tracking-tight">{activity.customer}</td>
                                    <td className="px-8 py-5 text-sm font-medium text-gray-300 max-w-xs truncate">{activity.details}</td>
                                    <td className="px-8 py-5">
                                        <span className={`badge ${
                                            activity.status.includes('Comple') || activity.status.includes('Paid') ? 'badge-success' : 
                                            activity.status.includes('Progress') ? 'badge-warning' : 'badge-info'
                                        }`}>
                                            {activity.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link to={`/service-requests/${activity.id}`}>
                                            <button className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group/link ml-auto">
                                                VIEW DOC
                                                <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Due Reminders Section */}
            {reminders.length > 0 && (
                <div className="glass-card overflow-hidden mt-8">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter text-blue-400">Action Required: Reminders</h3>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Follow up with clients for due services</p>
                        </div>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reminders.map(r => (
                            <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-black text-white">{r.client_name}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">{r.make} {r.model} • {r.service_type}</div>
                                    <div className="text-[10px] text-red-400 font-black mt-2">DUE: {formatDate(r.due_date)}</div>
                                </div>
                                <button 
                                    className="btn-primary text-[10px] bg-[#25D366] text-black border-none py-2 flex items-center gap-2"
                                    onClick={() => {
                                        const msg = `Hi ${r.client_name},\nIt looks like your ${r.make} ${r.model} is due for its ${r.service_type}. Would you like to book an appointment with GoCar Auto?`;
                                        window.open(`https://wa.me/${(r.client_phone || '').replace(/[+ -]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                >
                                    <Zap size={14} /> SEND WHATSAPP
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 30-Day Revenue Forecast Panel */}
            <div className="glass-card overflow-hidden mt-8">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter text-purple-400 flex items-center gap-2">
                            <TrendingUp size={20} /> 30-Day Revenue Forecast
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">AI-powered revenue predictions based on upcoming services</p>
                    </div>
                    {forecast && (
                        <div className="text-right">
                            <div className="text-3xl font-display font-black text-white tracking-tighter">
                                {(forecast.forecastTotal || 0).toLocaleString()} <span className="text-sm text-gray-500">EGP</span>
                            </div>
                            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                                Confidence: {forecast.confidence || 'N/A'}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-8">
                    {forecastLoading ? (
                        <div className="flex items-center justify-center p-10 text-purple-500/50 flex-col gap-4">
                            <Loader className="animate-spin" size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Calculating Predictions...</span>
                        </div>
                    ) : forecast && forecast.forecastByType ? (
                        <div className="space-y-4">
                            {Object.entries(forecast.forecastByType).map(([type, amount]) => {
                                const maxAmount = Math.max(...Object.values(forecast.forecastByType), 1);
                                const percentage = Math.round(((amount || 0) / maxAmount) * 100);
                                return (
                                    <div key={type} className="relative">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                            <span>{type}</span>
                                            <span className="text-white">{(amount || 0).toLocaleString()} EGP</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] transition-all duration-1000 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-sm font-bold uppercase tracking-widest py-8">
                            No forecast data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, sub, color, bgColor, borderColor, icon: Icon, progress }) => (
    <div className={`glass-card p-8 border ${borderColor} relative overflow-hidden group hover:border-white/20`}>
        <div className={`absolute -right-6 -top-6 w-32 h-32 ${bgColor} rounded-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
        <Icon className={`absolute right-6 top-6 ${color} opacity-20 w-16 h-16 group-hover:scale-110 transition-transform`} />
        
        <div className="relative z-10 flex flex-col h-full">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                {title}
            </div>
            <div className="text-4xl font-display font-black text-white mb-1 tracking-tighter">
                {value}
            </div>
            <div className="text-xs font-bold text-gray-400 mb-8 max-w-[80%]">
                {sub}
            </div>

            <div className="mt-auto h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color.replace('text-', 'bg-')} rounded-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    </div>
);

export default Dashboard;
