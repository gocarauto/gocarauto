import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Search, Car, Settings, ChevronRight, Activity, ShieldCheck } from 'lucide-react';
import { formatDate, isOverdue } from '../utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://gocar-backend-crtx.onrender.com/api'
    : 'http://localhost:3000/api');

const renderKmBadge = (km) => {
    if (km === null || km === undefined) return <span className="text-gray-500 text-sm">—</span>;
    let badgeClass = 'bg-green-500/10 text-green-500 border-green-500/20';
    if (km >= 3000 && km <= 5000) badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (km > 5000) badgeClass = 'bg-red-500/10 text-red-500 border-red-500/20';
    return <span className={`badge border ${badgeClass}`}>{km.toLocaleString()} km</span>;
};

const renderHealthRing = (score) => {
    if (score === null || score === undefined) return <span className="text-gray-500 text-sm">—</span>;
    let colorClass = 'text-green-500 stroke-green-500';
    if (score >= 40 && score < 70) colorClass = 'text-amber-500 stroke-amber-500';
    if (score < 40) colorClass = 'text-red-500 stroke-red-500';

    const radius = 14;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle className="text-slate-200 dark:text-white/10 stroke-current" strokeWidth="3" cx="18" cy="18" r={radius} fill="transparent" />
                <circle className={`${colorClass.split(' ')[1]} transition-all duration-1000 ease-out`} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" cx="18" cy="18" r={radius} fill="transparent" />
            </svg>
            <span className={`absolute text-[10px] font-black ${colorClass.split(' ')[0]}`}>{score}</span>
        </div>
    );
};

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const response = await api.get(`/vehicles?search=${encodeURIComponent(searchTerm)}`);
                setVehicles(response.data.data || []);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">Vehicle Management</h1>
                    <p className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-widest font-bold mt-1">Global fleet registry</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/vehicles/new">
                        <button className="btn-primary">
                            + REGISTER NEW VEHICLE
                        </button>
                    </Link>
                </div>
            </div>

            {/* High-Tech Search Bar */}
            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={20} />
                    <input
                        type="text"
                        className="input-glass pl-14 h-14 text-base"
                        placeholder="SEARCH VEHICLES BY MAKE, MODEL, PLATE, OR VIN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-200/80 dark:border-white/5 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-blue-500 shadow-inner">
                        <Car size={20} fill="currentColor" className="text-black stroke-blue-500" />
                    </div>
                    <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">Fleet Registry</h3>
                    <div className="ml-auto animate-pulse badge badge-info flex items-center gap-2 px-4 py-2">
                        <Activity size={14} />
                        {vehicles.length} IDENTIFIED
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center animate-glow text-slate-400 dark:text-gray-500 font-bold tracking-widest text-xs uppercase">
                        LOADING VEHICLES...
                    </div>
                ) : (
                    <>
                        {/* Mobile Responsive Cards (< md screens) */}
                        <div className="md:hidden divide-y divide-slate-200/80 dark:divide-white/5">
                            {vehicles.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 dark:text-gray-500 font-bold tracking-widest text-xs uppercase">
                                    REGISTRY EMPTY: NO VEHICLES FOUND.
                                </div>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-base uppercase">
                                                    {vehicle.make} {vehicle.model}
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs ml-1.5 font-normal">[{vehicle.year}]</span>
                                                </div>
                                                <div className="text-xs text-amber-500 dark:text-amber-400 font-mono font-bold mt-0.5">
                                                    {vehicle.license_plate || 'NO PLATE'}
                                                </div>
                                            </div>
                                            <div>
                                                {renderHealthRing(vehicle.health_score)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80 dark:border-white/5">
                                            <div>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">CLIENT</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.client_name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">KM SINCE SERVICE</span>
                                                {renderKmBadge(vehicle.km_since_last_service)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <a
                                                href={`${API_BASE}/vehicles/${vehicle.id}/service-passport/pdf?token=${localStorage.getItem('token') || ''}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
                                            >
                                                <ShieldCheck size={14} />
                                                <span>PASSPORT</span>
                                            </a>
                                            <Link to={`/vehicles/${vehicle.id}`} className="flex-1">
                                                <button className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1 transition-all">
                                                    <span>DETAILS</span>
                                                    <ChevronRight size={14} className="text-amber-500 dark:text-amber-400" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Master Table (md+ screens) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-500">Vehicle Info</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-500">Client</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-500">Km Since Service</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-500">Health</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-500">Next Service</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                                {vehicles.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center p-20 text-slate-400 dark:text-gray-500 font-bold tracking-widest text-xs uppercase">
                                            REGISTRY EMPTY: NO VEHICLES FOUND.
                                        </td>
                                    </tr>
                                ) : (
                                    vehicles.map((vehicle) => (
                                        <tr key={vehicle.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">
                                                    {vehicle.make} {vehicle.model}
                                                    <span className="text-slate-500 dark:text-gray-500 text-sm ml-2">[{vehicle.year}]</span>
                                                </div>
                                                <div className="text-xs text-blue-500 font-bold uppercase mt-1 tracking-widest">
                                                    {vehicle.license_plate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wide">
                                                {vehicle.client_name}
                                            </td>
                                            <td className="px-6 py-5">
                                                {renderKmBadge(vehicle.km_since_last_service)}
                                            </td>
                                            <td className="px-6 py-5">
                                                {renderHealthRing(vehicle.health_score)}
                                            </td>
                                            <td className="px-6 py-5">
                                                {vehicle.next_service_due ? (
                                                    <span className={`badge ${isOverdue(vehicle.next_service_due) ? 'badge-danger' : 'badge-success'}`}>
                                                        {formatDate(vehicle.next_service_due)}
                                                    </span>
                                                ) : <span className="text-slate-400 text-sm">—</span>}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`${API_BASE}/vehicles/${vehicle.id}/service-passport/pdf?token=${localStorage.getItem('token') || ''}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="h-10 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center gap-1.5 transition-all"
                                                        title="Export Certified Service Passport PDF"
                                                    >
                                                        <ShieldCheck size={14} />
                                                        PASSPORT
                                                    </a>
                                                    <Link to={`/vehicles/${vehicle.id}`}>
                                                        <button className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 hover:border-amber-400/50 text-slate-800 dark:text-white rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center gap-1 transition-all">
                                                            DETAILS
                                                            <ChevronRight size={14} className="text-amber-500 dark:text-primary" />
                                                        </button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VehicleList;
