import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useUIDirection } from './DirectionSwitcher';
import { getVehicleSketch } from '../utils/sketchHelper';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import {
    History,
    Car,
    TrendingUp,
    ChevronRight,
    Calendar,
    FolderLock,
    Bot,
    Wrench,
    CheckCircle,
    Shield,
    Sparkles,
    Activity,
    Fuel,
    Gauge,
    AlertCircle,
    ArrowUpRight,
    Tag
} from 'lucide-react';
import SellCarModal from './SellCarModal';

const Dashboard = () => {
    const { t, lang } = useLanguage();
    const isAr = lang === 'ar';
    const { direction } = useUIDirection();

    const [data, setData] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sellModalOpen, setSellModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashRes, remRes, vehRes] = await Promise.all([
                    api.get('/customer-portal/dashboard'),
                    api.get('/customer-portal/reminders').catch(() => ({ data: { data: [] } })),
                    api.get('/customer-portal/vehicles').catch(() => ({ data: { data: [] } }))
                ]);

                const fleet = vehRes.data?.data || [];
                setVehicles(fleet);

                const dashData = dashRes.data?.data || {};
                const upcoming = dashData.upcomingService || [];
                const initialCarId = upcoming[0]?.id || fleet[0]?.id || null;
                setSelectedVehicleId(initialCarId);

                setData({
                    ...dashData,
                    reminders: remRes.data?.data || []
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex flex-col space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-[2rem]"></div>)}
                </div>
                <div className="flex-1 min-h-[460px] bg-gray-100 dark:bg-white/5 rounded-[3.5rem]"></div>
            </div>
        );
    }

    // Active vehicle selection
    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) 
        || data?.upcomingService?.[0] 
        || vehicles[0] 
        || null;

    const stats = data?.stats || { totalVehicles: vehicles.length || 0, totalServices: 0, totalSpent: 0 };
    const sketch = activeVehicle ? getVehicleSketch(activeVehicle.make, activeVehicle.model, activeVehicle.year) : null;
    const mileage = activeVehicle?.current_mileage || activeVehicle?.mileage || 0;

    // Derived telemetry metrics based on odometer cycles
    const oilCycle = mileage % 10000;
    const oilLifePercent = Math.max(12, Math.min(100, Math.round(100 - (oilCycle / 100))));
    const brakeCycle = mileage % 25000;
    const brakeLifePercent = Math.max(20, Math.min(100, Math.round(100 - (brakeCycle / 250))));
    const kmUntilService = Math.max(250, 10000 - oilCycle);

    // Direction-specific theme styling tokens
    const isDir1 = direction === '1'; // Obsidian Apex (Gold & Noir)
    const isDir2 = direction === '2'; // Nordic Slate (Electric Lime & Tech)
    const isDir3 = direction === '3'; // Alabaster Atelier (Terracotta Warmth)

    const accentColor = isDir2 ? '#10b981' : isDir3 ? '#c0673f' : '#fbbf24';
    const accentBg = isDir2 ? 'bg-emerald-500' : isDir3 ? 'bg-[#c0673f]' : 'bg-[#fbbf24]';
    const accentText = isDir2 ? 'text-emerald-400' : isDir3 ? 'text-[#c0673f]' : 'text-[#fbbf24]';

    return (
        <div className="space-y-8 pb-16">
            
            {/* ── Top Summary Header (Interactive Stat Pods) ── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                {[
                    { 
                        label: isAr ? 'إجمالي الزيارات والخدمات' : t('total_visits'), 
                        value: stats.totalServices, 
                        suffix: isAr ? 'زيارة' : 'Visits',
                        icon: History, 
                        color: isDir2 ? 'text-emerald-400' : 'text-blue-500',
                        bg: isDir2 ? 'bg-emerald-500/10' : 'bg-blue-500/10',
                        link: '/history'
                    },
                    { 
                        label: isAr ? 'استثمار الصيانة السنوي' : 'YTD Maintenance Invested', 
                        value: `${stats.totalSpent?.toLocaleString() || 0}`, 
                        suffix: isAr ? 'ج.م' : 'EGP',
                        icon: TrendingUp, 
                        color: 'text-green-500',
                        bg: 'bg-green-500/10',
                        link: '/invoices'
                    },
                    { 
                        label: isAr ? 'سيارات الأسطول المسجلة' : t('registered_vehicles'), 
                        value: stats.totalVehicles || vehicles.length, 
                        suffix: isAr ? 'سيارات' : 'Vehicles',
                        icon: Car, 
                        color: isDir1 ? 'text-[#fbbf24]' : isDir2 ? 'text-emerald-400' : 'text-[#c0673f]',
                        bg: isDir1 ? 'bg-[#fbbf24]/10' : isDir2 ? 'bg-emerald-500/10' : 'bg-[#c0673f]/10',
                        link: '/vehicles'
                    }
                ].map((stat, i) => (
                    <Link
                        key={i}
                        to={stat.link}
                        className="bg-white dark:bg-[#0c0d12] p-6 rounded-[2.2rem] border border-gray-100 dark:border-white/5 text-black dark:text-white flex items-center justify-between shadow-xl hover:border-primary/40 dark:hover:border-white/20 transition-all duration-300 group"
                    >
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">{stat.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                                <span className="text-xs font-bold text-gray-400 uppercase">{stat.suffix}</span>
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                    </Link>
                ))}
            </section>

            {/* ── High-Fidelity Hero Showcase ── */}
            <section className={`rounded-[3.5rem] overflow-hidden flex flex-col border shadow-2xl relative transition-colors duration-500
                ${isDir1 ? 'bg-[#070709] border-white/10' : isDir2 ? 'bg-[#0b0f17] border-emerald-500/20' : 'bg-[#faf7f2] dark:bg-[#12100e] border-[#c0673f]/20'}
            `}>
                
                {/* Ambient Radial Backlight Glow */}
                <div 
                    className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[140px] pointer-events-none opacity-30"
                    style={{ backgroundColor: accentColor }}
                />

                {/* ── Fleet Selector Tabs (Top Bar) ── */}
                <div className="p-6 md:px-12 border-b border-white/5 flex items-center justify-between gap-4 overflow-x-auto relative z-20">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 shrink-0">
                            {isAr ? 'أسطولك:' : 'Garage Fleet:'}
                        </span>
                        <div className="flex items-center gap-2">
                            {vehicles.map((v) => {
                                const isSelected = v.id === selectedVehicleId;
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVehicleId(v.id)}
                                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0 ${
                                            isSelected
                                                ? `${accentBg} text-black shadow-lg scale-105`
                                                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                                        }`}
                                    >
                                        <Car size={13} />
                                        <span>{v.make} {v.model}</span>
                                        {isSelected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Link
                        to="/vehicles"
                        className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 shrink-0 uppercase tracking-widest"
                    >
                        <span>{isAr ? 'إدارة الأسطول' : 'Manage All'}</span>
                        <ArrowUpRight size={14} />
                    </Link>
                </div>

                {/* ── Main Showcase Body ── */}
                <div className="flex flex-col lg:flex-row min-h-[480px]">
                    
                    {/* Left Telemetry & Controls Area */}
                    <div className="lg:w-[48%] p-8 md:p-12 flex flex-col justify-between relative z-10 text-white border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-white/5">
                        
                        {activeVehicle ? (
                            <div className="space-y-6">
                                <div>
                                    <div 
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border"
                                        style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30`, color: accentColor }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></span>
                                        {isAr ? 'السيارة النشطة' : 'ACTIVE CONCIERGE ASSET'}
                                    </div>
                                    
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none font-display">
                                        {activeVehicle.make}
                                    </h2>
                                    <p className="text-xl md:text-2xl text-gray-400 font-medium tracking-tight mt-1">
                                        {activeVehicle.model} • {activeVehicle.year}
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-mono font-bold text-gray-300">
                                            {activeVehicle.license_plate || 'No Plate'}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">
                                            VIN: {activeVehicle.vin || '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Live Health Telemetry Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                                <Fuel size={12} className={accentText} />
                                                {isAr ? 'صلاحية الزيت' : 'Oil Integrity'}
                                            </span>
                                            <span className="font-black text-xs text-emerald-400">{oilLifePercent}%</span>
                                        </div>
                                        <div className="telemetry-gauge-track">
                                            <div 
                                                className="telemetry-gauge-fill bg-emerald-400"
                                                style={{ width: `${oilLifePercent}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-400 block font-medium">
                                            {isAr ? `الصيانة بعد: ${kmUntilService.toLocaleString()} كم` : `Next due: ~${kmUntilService.toLocaleString()} km`}
                                        </span>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                                <Activity size={12} className={accentText} />
                                                {isAr ? 'حالة الفرامل' : 'Brake Health'}
                                            </span>
                                            <span className="font-black text-xs text-amber-400">{brakeLifePercent}%</span>
                                        </div>
                                        <div className="telemetry-gauge-track">
                                            <div 
                                                className="telemetry-gauge-fill bg-amber-400"
                                                style={{ width: `${brakeLifePercent}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-400 block font-medium">
                                            {isAr ? 'الطنابير والتيل بحالة جيدة' : 'Pads & rotors verified'}
                                        </span>
                                    </div>
                                </div>

                                {/* Odometer Bar */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-300">
                                            <Gauge size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                                {isAr ? 'عداد المسافة المسجل' : 'Current Odometer'}
                                            </p>
                                            <p className="text-xl font-black tracking-tight text-white font-mono">
                                                {mileage ? mileage.toLocaleString() : '—'} <span className="text-xs text-gray-400 uppercase font-sans">km</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                            {isAr ? 'إجمالي الخدمات' : 'Total Visits'}
                                        </p>
                                        <p className="text-lg font-black text-white">
                                            {activeVehicle.services_count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black tracking-tighter">Welcome to GoCar Auto</h2>
                                <p className="text-gray-400 text-sm">Register a vehicle with our concierge to access automated telemetry, service tracking, and VIP bookings.</p>
                            </div>
                        )}

                        {/* Quick VIP Actions Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6 mt-6 border-t border-white/5">
                            <Link 
                                to={activeVehicle ? `/book-service?vehicleId=${activeVehicle.id}` : '/book-service'}
                                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all group ${accentBg} text-black hover:opacity-90 shadow-xl`}
                            >
                                <Calendar size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full">
                                    {isAr ? 'حجز صيانة' : 'Book VIP'}
                                </span>
                            </Link>

                            <button 
                                type="button"
                                onClick={() => setSellModalOpen(true)}
                                disabled={!activeVehicle}
                                className="bg-[#fbbf24]/10 hover:bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all group disabled:opacity-40"
                            >
                                <Tag size={18} className="group-hover:scale-110 transition-transform text-[#fbbf24]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full">
                                    {isAr ? 'بيع عبر جوكار' : 'Sell Car'}
                                </span>
                            </button>

                            <Link 
                                to="/glovebox"
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/5 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all group"
                            >
                                <FolderLock size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full">
                                    {isAr ? 'الدرج الرقمي' : 'Glovebox'}
                                </span>
                            </Link>

                            <Link 
                                to="/ai-advisor"
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/5 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all group"
                            >
                                <Bot size={18} className="group-hover:scale-110 transition-transform" style={{ color: accentColor }} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full">
                                    {isAr ? 'المستشار الذكي' : 'AI Advisor'}
                                </span>
                            </Link>
                        </div>

                    </div>

                    {/* Sell Car Modal */}
                    <SellCarModal
                        isOpen={sellModalOpen}
                        vehicle={activeVehicle}
                        onClose={() => setSellModalOpen(false)}
                        onSuccess={() => setSellModalOpen(false)}
                    />

                    {/* Right Vehicle Technical Blueprint Stage */}
                    <div className="lg:w-[52%] relative flex items-center justify-center p-8 md:p-12 overflow-hidden bg-gradient-to-tr from-black/20 via-transparent to-white/[0.02]">
                        <AnimatePresence mode="wait">
                            {sketch ? (
                                <motion.div
                                    key={activeVehicle?.id || 'sketch'}
                                    initial={{ opacity: 0, scale: 0.9, x: isAr ? -30 : 30 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: isAr ? 30 : -30 }}
                                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                    className="w-full h-full flex flex-col items-center justify-center relative z-10"
                                >
                                    <img
                                        src={sketch}
                                        alt={`${activeVehicle.make} ${activeVehicle.model}`}
                                        className="w-full max-h-[320px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter contrast-110 brightness-105"
                                    />
                                    <div className="mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                        TECHNICAL CHASSIS BLUEPRINT • {activeVehicle.make.toUpperCase()} {activeVehicle.model.toUpperCase()}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-gray-500 font-bold uppercase tracking-widest text-xs z-10">
                                    {isAr ? 'لم يتم تحميل رسم فني' : 'No Blueprint Available'}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default Dashboard;
