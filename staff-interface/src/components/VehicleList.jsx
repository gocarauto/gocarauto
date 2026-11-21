import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Search, Car, Settings, ChevronRight, Activity, ShieldCheck, Archive, RotateCcw, AlertCircle } from 'lucide-react';
import { formatDate, isOverdue } from '../utils/dateUtils';
import ArchiveVehicleModal from './ArchiveVehicleModal';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://gocar-backend-crtx.onrender.com/api'
    : 'http://localhost:3000/api');

const renderKmBadge = (km) => {
    if (km === null || km === undefined) return <span className="text-slate-500 dark:text-slate-400 text-sm">—</span>;
    let badgeClass = 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20';
    if (km >= 3000 && km <= 5000) badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20';
    if (km > 5000) badgeClass = 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
    return <span className={`badge border ${badgeClass}`}>{km.toLocaleString()} km</span>;
};

const renderHealthRing = (score) => {
    if (score === null || score === undefined) return <span className="text-slate-500 dark:text-slate-400 text-sm">—</span>;
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
            <span className={`absolute text-xs font-bold font-mono ${colorClass.split(' ')[0]}`}>{score}</span>
        </div>
    );
};

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fleetTab, setFleetTab] = useState('active'); // 'active' | 'archived'
    const [vehicleToArchive, setVehicleToArchive] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const loadVehicles = async () => {
        setLoading(true);
        try {
            const isArchived = fleetTab === 'archived';
            const response = await api.get(`/vehicles?search=${encodeURIComponent(searchTerm)}&archived=${isArchived ? 'true' : 'false'}`);
            setVehicles(response.data.data || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadVehicles();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, fleetTab]);

    const handleRestoreVehicle = async (vehicleId, make, model) => {
        if (!window.confirm(`Restore ${make} ${model} back to the active fleet?`)) return;
        setActionLoadingId(vehicleId);
        try {
            await api.post(`/vehicles/${vehicleId}/restore`);
            setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        } catch (error) {
            console.error('Failed to restore vehicle:', error);
            alert('Failed to restore vehicle.');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">Vehicle Management</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Global fleet repository & lifecycle management</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/vehicles/new" className="btn btn-primary btn-md">
                        + Register New Vehicle
                    </Link>
                </div>
            </div>

            {/* High-Tech Search Bar */}
            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={20} />
                    <input
                        type="text"
                        className="input-glass pl-14 h-14 text-base"
                        placeholder="SEARCH VEHICLES BY MAKE, MODEL, PLATE, OR VIN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Fleet Master Card */}
            <div className="glass-card overflow-hidden">
                {/* Tab Navigation Header */}
                <div className="p-6 md:p-8 border-b border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-blue-500 shadow-inner">
                            <Car size={20} fill="currentColor" className="text-black stroke-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                {fleetTab === 'active' ? 'Active Fleet Registry' : 'Decommissioned & Archived Assets'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {fleetTab === 'active' ? 'Active workshop servicing fleet' : 'Preserved history for sold, scrapped, or retired vehicles'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Tab Switcher Pills */}
                        <div className="flex p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setFleetTab('active')}
                                className={`px-4 py-2 rounded-lg transition-all ${
                                    fleetTab === 'active'
                                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Active Fleet
                            </button>
                            <button
                                type="button"
                                onClick={() => setFleetTab('archived')}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                                    fleetTab === 'archived'
                                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Archive size={13} />
                                Archived Fleet
                            </button>
                        </div>

                        <div className="badge badge-info flex items-center gap-2 px-3 py-2 shrink-0">
                            <Activity size={13} />
                            {vehicles.length} {fleetTab === 'active' ? 'ACTIVE' : 'ARCHIVED'}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center animate-glow text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">
                        FETCHING FLEET TELEMETRY...
                    </div>
                ) : (
                    <>
                        {/* Mobile Card List (sm screens) */}
                        <div className="block md:hidden divide-y divide-slate-200/80 dark:divide-white/5">
                            {vehicles.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">
                                    {fleetTab === 'active' ? 'NO ACTIVE VEHICLES FOUND.' : 'NO ARCHIVED VEHICLES ON RECORD.'}
                                </div>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="p-5 space-y-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-base">
                                                    {vehicle.make} {vehicle.model}
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs ml-2 font-semibold">[{vehicle.year}]</span>
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold mt-0.5 tracking-wider uppercase">
                                                    {vehicle.license_plate || 'NO PLATE'}
                                                </div>
                                            </div>
                                            {fleetTab === 'active' ? (
                                                renderHealthRing(vehicle.health_score)
                                            ) : (
                                                <span className="badge badge-warning text-[10px] uppercase font-bold">
                                                    {vehicle.archive_reason || 'Archived'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center text-xs py-1 border-y border-slate-200/60 dark:border-white/5">
                                            <div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold block">Client</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.client_name}</span>
                                            </div>
                                            <div className="text-right">
                                                {fleetTab === 'active' ? (
                                                    <>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold block">Km Since Service</span>
                                                        {renderKmBadge(vehicle.km_since_last_service)}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold block">Archived Date</span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatDate(vehicle.archived_at)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <a
                                                href={`${API_BASE}/vehicles/${vehicle.id}/service-passport/pdf?token=${localStorage.getItem('token') || ''}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline btn-sm flex-1 text-xs font-bold gap-1.5"
                                            >
                                                <ShieldCheck size={14} className="text-amber-500" />
                                                <span>Passport</span>
                                            </a>
                                            <Link to={`/vehicles/${vehicle.id}`} className="btn btn-primary btn-sm flex-1 text-xs font-bold gap-1">
                                                <span>Details</span>
                                                <ChevronRight size={14} />
                                            </Link>
                                            {fleetTab === 'active' ? (
                                                <button
                                                    onClick={() => setVehicleToArchive(vehicle)}
                                                    className="h-9 w-9 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 text-slate-600 dark:text-slate-400 hover:text-amber-500 flex items-center justify-center shrink-0 transition-all shadow-xs"
                                                    title="Decommission & Archive"
                                                >
                                                    <Archive size={15} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRestoreVehicle(vehicle.id, vehicle.make, vehicle.model)}
                                                    disabled={actionLoadingId === vehicle.id}
                                                    className="h-9 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold shrink-0 transition-all shadow-xs"
                                                    title="Restore Asset to Active Fleet"
                                                >
                                                    <RotateCcw size={13} />
                                                    <span>Restore</span>
                                                </button>
                                            )}
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
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Vehicle Info</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Client</th>
                                    {fleetTab === 'active' ? (
                                        <>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Km Since Service</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Health</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Next Service</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Archival Reason</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Decommission Date</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Notes</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                                {vehicles.length === 0 ? (
                                    <tr>
                                        <td colSpan={fleetTab === 'active' ? 6 : 6} className="text-center p-20 text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">
                                            {fleetTab === 'active' ? 'REGISTRY EMPTY: NO ACTIVE VEHICLES FOUND.' : 'NO ARCHIVED VEHICLES IN REPOSITORY.'}
                                        </td>
                                    </tr>
                                ) : (
                                    vehicles.map((vehicle) => (
                                        <tr key={vehicle.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                                                    {vehicle.make} {vehicle.model}
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs ml-2 font-semibold">[{vehicle.year}]</span>
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold mt-0.5 tracking-wider uppercase">
                                                    {vehicle.license_plate || 'NO PLATE'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                {vehicle.client_name}
                                            </td>

                                            {fleetTab === 'active' ? (
                                                <>
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
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-5">
                                                        <span className="badge badge-warning text-xs font-bold">
                                                            {vehicle.archive_reason || 'Archived'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-mono text-slate-600 dark:text-slate-400">
                                                        {formatDate(vehicle.archived_at)}
                                                    </td>
                                                    <td className="px-6 py-5 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={vehicle.archive_notes || '—'}>
                                                        {vehicle.archive_notes || '—'}
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-6 py-5 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <a
                                                        href={`${API_BASE}/vehicles/${vehicle.id}/service-passport/pdf?token=${localStorage.getItem('token') || ''}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline btn-sm text-xs font-bold gap-1.5"
                                                        title="Export Certified Service Passport PDF"
                                                    >
                                                        <ShieldCheck size={14} className="text-amber-500" />
                                                        <span>Passport</span>
                                                    </a>
                                                    <Link to={`/vehicles/${vehicle.id}`} className="btn btn-primary btn-sm text-xs font-bold gap-1">
                                                        <span>Details</span>
                                                        <ChevronRight size={14} />
                                                    </Link>

                                                    {fleetTab === 'active' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setVehicleToArchive(vehicle)}
                                                            className="h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 text-slate-600 dark:text-slate-400 hover:text-amber-500 flex items-center justify-center transition-all shadow-xs"
                                                            title="Decommission & Archive Vehicle"
                                                        >
                                                            <Archive size={14} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRestoreVehicle(vehicle.id, vehicle.make, vehicle.model)}
                                                            disabled={actionLoadingId === vehicle.id}
                                                            className="btn btn-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold gap-1.5"
                                                            title="Restore Asset to Active Fleet"
                                                        >
                                                            <RotateCcw size={13} />
                                                            <span>Restore</span>
                                                        </button>
                                                    )}
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

            {/* Decommission & Archive Vehicle Modal */}
            <ArchiveVehicleModal
                vehicle={vehicleToArchive}
                isOpen={Boolean(vehicleToArchive)}
                onClose={() => setVehicleToArchive(null)}
                onArchived={(archivedId, reason) => {
                    setVehicles(prev => prev.filter(v => v.id !== archivedId));
                }}
            />
        </div>
    );
};

export default VehicleList;
