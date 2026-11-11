import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { getVehicleSketch } from '../utils/sketchHelper';
import { formatDate } from '../utils/dateUtils';
import {
    Car,
    Shield,
    Hash,
    Calendar,
    Activity,
    ChevronRight,
    Search,
    Wrench,
    FolderLock,
    History,
    Sparkles,
    Fuel,
    Gauge,
    Tag,
    ShieldCheck,
    Plus,
    FileText,
    Droplet,
    Cog
} from 'lucide-react';
import SellCarModal from './SellCarModal';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://gocar-backend-crtx.onrender.com/api'
    : 'http://localhost:3000/api');

const VehicleFleet = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const navigate = useNavigate();

    const [vehicles, setVehicles] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_fleet_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });

    const [activeVehicleId, setActiveVehicleId] = useState(() => {
        try {
            return localStorage.getItem('gocar_active_vehicle_id') || 
                   sessionStorage.getItem('gocar_active_vehicle_id') || 
                   null;
        } catch {
            return null;
        }
    });

    const [loading, setLoading] = useState(() => {
        try {
            return !sessionStorage.getItem('gocar_fleet_cache');
        } catch {
            return true;
        }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMake, setSelectedMake] = useState('All');
    const [sellModalVehicle, setSellModalVehicle] = useState(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/customer-portal/vehicles');
                const fleet = response.data?.data || [];
                setVehicles(fleet);
                if (fleet.length > 0 && !activeVehicleId) {
                    setActiveVehicleId(fleet[0].id);
                }
                try {
                    sessionStorage.setItem('gocar_fleet_cache', JSON.stringify(fleet));
                } catch {
                    // ignore storage quota issues
                }
            } catch {
                console.error('Failed to synchronize garage data');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, [activeVehicleId]);

    const handleSetActive = (id) => {
        setActiveVehicleId(id);
        try {
            localStorage.setItem('gocar_active_vehicle_id', id);
            sessionStorage.setItem('gocar_active_vehicle_id', id);
        } catch {
            // ignore
        }
    };

    // Unique makes for filter pills
    const uniqueMakes = ['All', ...new Set(vehicles.map(v => v.make).filter(Boolean))];

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = 
            v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.vin?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesMake = selectedMake === 'All' || v.make === selectedMake;
        return matchesSearch && matchesMake;
    });

    const effectiveActiveId = activeVehicleId || (vehicles[0]?.id ?? null);

    return (
        <div className="max-w-7xl mx-auto space-y-7 pb-16">
            
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                        {isAr ? 'أسطول السيارات في الجراج' : 'Registered Garage Fleet'}
                    </h1>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                        {isAr ? 'إدارة وتتبع مواصفات وصيانات وأوراق كل مركبة' : 'Manage telemetry, certified service passports, and digital logbooks for each asset'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-52 sm:w-72">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder={isAr ? 'البحث بالماركة، الموديل أو اللوحة...' : 'Search make, model, plate, VIN...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-white/10 rounded-2xl py-2.5 ltr:pl-9 rtl:pr-9 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
                        />
                    </div>
                    <div className="bg-white dark:bg-[#0c0d12] px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs text-center shrink-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block leading-none">{isAr ? 'العدد' : 'Cars'}</span>
                        <span className="text-base font-bold text-slate-950 dark:text-white tabular-nums leading-tight mt-0.5 block">{vehicles.length}</span>
                    </div>
                </div>
            </header>

            {/* Make Filter Pills */}
            {uniqueMakes.length > 2 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {uniqueMakes.map(m => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedMake(m)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                selectedMake === m
                                    ? 'bg-amber-400 text-slate-950 shadow-xs font-bold'
                                    : 'bg-white dark:bg-[#0c0d12] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08]'
                            }`}
                        >
                            {m === 'All' ? (isAr ? 'كل السيارات' : 'All Fleet') : m}
                        </button>
                    ))}
                </div>
            )}

            {/* Vehicle Executive Showcase Cards List */}
            {loading && vehicles.length === 0 ? (
                <div className="space-y-6 animate-pulse">
                    {[1, 2].map(i => (
                        <div key={i} className="h-80 bg-slate-200 dark:bg-white/[0.04] rounded-3xl" />
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredVehicles.map((v, i) => {
                        const sketch = getVehicleSketch(v.make, v.model, v.year);
                        const mileage = v.current_mileage || v.mileage || 0;
                        const kmUntilService = Math.max(0, 10000 - (mileage % 10000));
                        const oilLifePercent = Math.min(100, Math.max(0, Math.round((kmUntilService / 10000) * 100)));
                        const transmissionLifePercent = v.services_count > 0 ? 92 : 100;
                        const isActive = v.id === effectiveActiveId;

                        return (
                            <div
                                key={v.id || i}
                                className="bg-white dark:bg-[#0c0d12] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch group"
                            >
                                {/* Left Column: The Visual Hero Showcase Pod */}
                                <div className="w-full lg:w-[48%] min-h-[320px] sm:min-h-[360px] rounded-2xl bg-gradient-to-b from-[#181a24] via-[#10121a] to-[#08090d] border border-slate-800 dark:border-white/10 relative overflow-hidden flex flex-col justify-between p-6 sm:p-7 shadow-2xl shrink-0">
                                    
                                    {/* Ambient radial glow & underglow halo */}
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/[0.08] via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[75%] h-14 bg-amber-500/[0.12] rounded-full blur-2xl pointer-events-none" />

                                    {/* Top-Left Overlay Heading */}
                                    <div className="relative z-10">
                                        <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                                            {v.make} {v.model}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-slate-300/90 font-medium mt-1">
                                            {v.year} • {v.color || (isAr ? 'لون المصنع' : 'Factory Finish')}
                                        </p>
                                    </div>

                                    {/* Center Vehicle Blueprint Artwork */}
                                    <div className="my-auto py-4 relative z-10 flex items-center justify-center">
                                        <img
                                            src={sketch}
                                            alt={`${v.make} ${v.model}`}
                                            className="w-full max-h-[200px] sm:max-h-[220px] object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)] contrast-[1.05] transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Bottom Center License Plate Glass Pill */}
                                    <div className="relative z-10 flex justify-center">
                                        <div className="px-5 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white font-mono font-bold text-xs sm:text-sm tracking-wider shadow-lg">
                                            {v.license_plate || (isAr ? 'بدون لوحة' : 'No Plate')}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Telemetry Matrix & Two-Tier Actions */}
                                <div className="w-full lg:w-[52%] flex flex-col justify-between space-y-6">
                                    
                                    {/* Vehicle Heading & Active Status Badge */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
                                                {v.make} {v.model}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                                                {v.year} • {v.color || (isAr ? 'لون المصنع' : 'Factory Finish')}
                                            </p>
                                        </div>

                                        {isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0 shadow-xs">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>{isAr ? 'السيارة النشطة' : 'Active Vehicle'}</span>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSetActive(v.id)}
                                                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:border-amber-400/40 bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 transition-colors shrink-0 cursor-pointer"
                                                title={isAr ? 'تعيين كسيارة رئيسية في لوحة القيادة' : 'Set as primary vehicle on Dashboard'}
                                            >
                                                {isAr ? 'تعيين كنشطة' : 'Set as Active'}
                                            </button>
                                        )}
                                    </div>

                                    {/* 2x2 Telemetry Matrix */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        
                                        {/* Box 1: Odometer */}
                                        <div className="bg-slate-50/80 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                                <Gauge size={14} className="text-slate-400" />
                                                <span>{isAr ? 'العداد' : 'Odometer'}</span>
                                            </span>
                                            <p className="font-semibold text-slate-900 dark:text-white text-xl sm:text-2xl tabular-nums leading-tight">
                                                {mileage ? mileage.toLocaleString() : '—'} <span className="text-xs text-slate-400 font-sans font-normal">km</span>
                                            </p>
                                        </div>

                                        {/* Box 2: Next Due Date */}
                                        <div className="bg-slate-50/80 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span>{isAr ? 'الموعد القادم' : 'Next Due'}</span>
                                            </span>
                                            <p className="font-semibold text-slate-900 dark:text-white text-lg sm:text-xl leading-tight truncate">
                                                {v.next_service_due ? formatDate(v.next_service_due) : (isAr ? 'محدث' : 'Up to date')}
                                            </p>
                                        </div>

                                        {/* Box 3: Service Visits */}
                                        <div className="bg-slate-50/80 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                                <Activity size={14} className="text-slate-400" />
                                                <span>{isAr ? 'الزيارات' : 'Visits'}</span>
                                            </span>
                                            <p className="font-semibold text-slate-900 dark:text-white text-xl sm:text-2xl tabular-nums leading-tight">
                                                {v.services_count || 0} <span className="text-xs text-slate-400 font-sans font-normal">{isAr ? 'زيارة' : 'Visits'}</span>
                                            </p>
                                        </div>

                                        {/* Box 4: Dual Health Capsules (Engine Oil Life & Transmission Oil Life) */}
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {/* Engine Oil Life */}
                                            <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-between">
                                                <span className="text-xs sm:text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans truncate">
                                                    {isAr ? 'زيت المحرك' : 'ENGINE OIL'}
                                                </span>
                                                <div className="flex items-center gap-1.5 my-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                                                        <Droplet size={13} />
                                                    </div>
                                                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                                                        {oilLifePercent}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${oilLifePercent}%` }} />
                                                </div>
                                            </div>

                                            {/* Transmission Oil Life */}
                                            <div className="bg-slate-50/80 dark:bg-white/[0.03] p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-between">
                                                <span className="text-xs sm:text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans truncate">
                                                    {isAr ? 'ناقل الحركة' : 'TRANS OIL'}
                                                </span>
                                                <div className="flex items-center gap-1.5 my-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0">
                                                        <Cog size={13} />
                                                    </div>
                                                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                                                        {transmissionLifePercent}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${transmissionLifePercent}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Two-Tier Action Deck */}
                                    <div className="space-y-3 pt-1">
                                        
                                        {/* Tier 1: Full-Width Service Booking Action Button */}
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/book-service?vehicleId=${v.id}`)}
                                            className="w-full py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                                        >
                                            <Calendar size={18} />
                                            <span>{isAr ? 'حجز موعد صيانة' : 'Book Service Appointment'}</span>
                                        </button>

                                        {/* Tier 2: 3 Segmented Secondary Actions */}
                                        <div className="grid grid-cols-3 gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setSellModalVehicle(v)}
                                                className="py-3 px-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                                            >
                                                <Tag size={15} className="text-slate-600 dark:text-slate-400" />
                                                <span>{isAr ? 'عرض للبيع' : 'Sell Car'}</span>
                                            </button>

                                            <a
                                                href={`${API_BASE}/vehicles/${v.id}/service-passport/pdf?token=${localStorage.getItem('token') || ''}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="py-3 px-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer text-center"
                                            >
                                                <ShieldCheck size={15} className="text-slate-600 dark:text-slate-400" />
                                                <span>{isAr ? 'جواز الصيانة' : 'Passport'}</span>
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => navigate(`/history?vehicleId=${v.id}`)}
                                                className="py-3 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-400 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-800 transition-all shadow-xs cursor-pointer"
                                            >
                                                <FileText size={15} className="text-cyan-400" />
                                                <span>{isAr ? 'سجل الصيانة' : 'Logbook'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Sell Car Modal */}
            <SellCarModal
                isOpen={!!sellModalVehicle}
                vehicle={sellModalVehicle}
                onClose={() => setSellModalVehicle(null)}
                onSuccess={() => setSellModalVehicle(null)}
            />

            {filteredVehicles.length === 0 && !loading && (
                <div className="py-16 px-6 text-center bg-white dark:bg-[#0c0d12] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <Car size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                        {isAr ? 'لم يتم العثور على سيارات مطابقة' : 'No Matching Vehicles'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {isAr ? 'جرب البحث بكلمات مختلفة أو تواصل مع كونسيرج جوكار لإضافة مركبة جديدة.' : 'Adjust search terms or contact GoCar concierge to register an additional vehicle.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default VehicleFleet;
