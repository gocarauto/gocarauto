import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Search, Wrench, CheckCircle2, AlertCircle, Clock, ChevronRight, Filter, Users, Car } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const ServiceRequestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ recurringVehicles: 0, recurringClients: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/service-requests/stats');
                if (response.data && response.data.data) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching service stats:', error);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const url = statusFilter
                    ? `/service-requests?status=${statusFilter}`
                    : '/service-requests';
                const response = await api.get(url);
                const data = Array.isArray(response.data.data) ? response.data.data : [];
                setRequests(data);
            } catch (error) {
                console.error('Error fetching service requests:', error);
                setError('Failed to synchronize mission log.');
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [statusFilter]);

    const getStatusTheme = (status) => {
        switch (status) {
            case 'Open': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'In Progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
            case 'Complete': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Paid': return 'bg-green-500/20 text-green-400 border-green-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse';
            case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-gray-400 border-white/10';
        }
    };

    const filteredRequests = requests.filter(req => {
        if (!req) return false;
        const search = searchTerm.toLowerCase();
        const idSafe = String(req.id || '').padStart(5, '0');
        const idMatch = idSafe.includes(search);
        const clientMatch = (req.client_name || '').toLowerCase().includes(search);
        const vehicleMatch = (req.vehicle_info || '').toLowerCase().includes(search);
        return idMatch || clientMatch || vehicleMatch;
    });

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Service Operations</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Active workshop floor missions</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/service-requests/new">
                        <button className="btn-primary">
                            <Wrench size={16} /> NEW WORK ORDER
                        </button>
                    </Link>
                </div>
            </div>



            {/* KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-blue-500/20 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full opacity-50"></div>
                    <Car className="absolute right-6 top-6 text-blue-500 opacity-20 w-12 h-12" />
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Recurring Vehicles</div>
                        <div className="text-3xl font-display font-black text-white tracking-tighter">{stats.recurringVehicles}</div>
                    </div>
                </div>
                <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full opacity-50"></div>
                    <Users className="absolute right-6 top-6 text-emerald-500 opacity-20 w-12 h-12" />
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Recurring Clients</div>
                        <div className="text-3xl font-display font-black text-white tracking-tighter">{stats.recurringClients}</div>
                    </div>
                </div>
            </div>

            {/* Filters and Search Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-4 col-span-1 border-primary/20 bg-primary/5">
                    <div className="relative flex items-center">
                        <Filter className="absolute left-6 text-primary/70" size={18} />
                        <select
                            className="w-full bg-black/40 border border-primary/20 focus:border-primary/50 rounded-2xl py-4 pl-14 pr-5 text-sm outline-none transition-all text-primary font-bold tracking-widest uppercase appearance-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="" className="bg-gray-900 text-white">ALL STATUSES</option>
                            <option value="Open" className="bg-gray-900 text-white">OPEN</option>
                            <option value="In Progress" className="bg-gray-900 text-white">IN PROGRESS</option>
                            <option value="Waiting for Parts" className="bg-gray-900 text-white">WAITING FOR PARTS</option>
                            <option value="Complete" className="bg-gray-900 text-white">COMPLETED</option>
                            <option value="Invoiced" className="bg-gray-900 text-white">INVOICED</option>
                            <option value="Paid" className="bg-gray-900 text-white">PAID</option>
                        </select>
                    </div>
                </div>

                <div className="glass-card p-4 col-span-1 md:col-span-2">
                    <div className="relative h-full flex items-center">
                        <Search className="absolute left-6 text-gray-500" size={20} />
                        <input
                            type="text"
                            className="input-glass h-full pl-14 text-base bg-transparent border-none"
                            placeholder="SEARCH BY ID, CLIENT, OR VEHICLE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-white/5 flex gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-inner">
                            <Wrench size={20} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">Mission Log</h3>
                    </div>
                    <div className="badge badge-warning flex items-center gap-2 px-4 py-2">
                        {filteredRequests.length} DETECTED
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center animate-glow text-gray-500 font-bold tracking-widest text-xs uppercase">
                        LOADING REQUESTS...
                    </div>
                ) : error ? (
                    <div className="p-20 text-center text-red-500 font-bold uppercase tracking-widest text-xs">
                        {error}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">REQ ID / SRC</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Client / Vehicle</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Assigned To</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Total</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center p-20 text-gray-500 font-bold tracking-widest text-xs uppercase">
                                            {searchTerm ? 'NO MISSIONS MATCH YOUR SEARCH PARAMETERS.' : 'LOG EMPTY: NO REQUESTS FOUND.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5 align-middle">
                                                <div className="font-mono font-black text-primary text-lg tracking-widest">
                                                    #{String(req.id).padStart(5, '0')}
                                                </div>
                                                <div className={`text-[9px] font-black mt-1 tracking-widest uppercase ${req.source === 'PORTAL' ? 'text-primary drop-shadow-[0_0_5px_currentColor]' : 'text-gray-500'}`}>
                                                    {req.source === 'PORTAL' ? '✦ PORTAL' : '⚙ STAFF'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} />
                                                    {formatDate(req.request_date || req.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-black text-white uppercase text-sm tracking-tight">{req.client_name}</div>
                                                <div className="text-xs text-blue-400 font-bold mt-1 uppercase tracking-wider">{req.vehicle_info}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-xs font-bold text-gray-300 uppercase tracking-widest">{req.assigned_to_name || 'Unassigned'}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusTheme(req.status)} inline-flex items-center gap-2`}>
                                                    {req.status === 'Paid' && <CheckCircle2 size={12} />}
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 align-middle">
                                                {parseFloat(req.total_amount) > 0 ? (
                                                    <div className="font-black text-white text-base">
                                                        {parseFloat(req.total_amount).toLocaleString()} EGP
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className={`text-base font-black ${parseFloat(req.running_total) > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                                                            {parseFloat(req.running_total) > 0 ? `${parseFloat(req.running_total).toLocaleString()} EGP` : '0 EGP'}
                                                        </div>
                                                        <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5">LIVE TOTAL</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <Link to={`/service-requests/${req.id}`}>
                                                    <button className="h-10 px-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 text-white rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 ml-auto transition-all shadow-sm">
                                                        MANAGE
                                                        <ChevronRight size={14} className="text-primary" />
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceRequestList;
