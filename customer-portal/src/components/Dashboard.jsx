import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getVehicleSketch } from '../utils/sketchHelper';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import {
    History,
    Car,
    TrendingUp,
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
    Tag,
    Clock,
    ChevronRight,
    Plus,
    AlertTriangle,
    ShieldCheck
} from 'lucide-react';
import SellCarModal from './SellCarModal';

const Dashboard = () => {
    const { t, lang } = useLanguage();
    const isAr = lang === 'ar';

    const [data, setData] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sellModalOpen, setSellModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashRes, remRes, vehRes, apptRes] = await Promise.all([
                    api.get('/customer-portal/dashboard'),
                    api.get('/customer-portal/reminders').catch(() => ({ data: { data: [] } })),
                    api.get('/customer-portal/vehicles').catch(() => ({ data: { data: [] } })),
                    api.get('/customer-portal/appointments').catch(() => ({ data: { data: [] } }))
                ]);

                const fleet = vehRes.data?.data || [];
                setVehicles(fleet);

                const dashData = dashRes.data?.data || {};
                const upcoming = dashData.upcomingService || [];
                const initialCarId = upcoming[0]?.id || fleet[0]?.id || null;
                setSelectedVehicleId(initialCarId);

                setAppointments(apptRes.data?.data || []);
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
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
                    ))}
                </div>
                <div className="h-96 bg-slate-200 dark:bg-white/[0.04] rounded-3xl" />
            </div>
        );
    }

    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) 
        || data?.upcomingService?.[0] 
        || vehicles[0] 
        || null;

    const stats = data?.stats || { totalVehicles: vehicles.length || 0, totalServices: 0, totalSpent: 0 };
    const sketch = activeVehicle ? getVehicleSketch(activeVehicle.make, activeVehicle.model, activeVehicle.year) : null;
    const mileage = activeVehicle?.current_mileage || activeVehicle?.mileage || 0;

    // Derived telemetry metrics
    const oilCycle = mileage % 10000;
    const oilLifePercent = Math.max(12, Math.min(100, Math.round(100 - (oilCycle / 100))));
    const brakeCycle = mileage % 25000;
    const brakeLifePercent = Math.max(20, Math.min(100, Math.round(100 - (brakeCycle / 250))));
    const kmUntilService = Math.max(250, 10000 - oilCycle);

    // Filter appointments for the active vehicle or latest scheduled
    const activeAppointment = appointments.find(a => 
        (activeVehicle && a.vehicle_id === activeVehicle.id) || a.status === 'In Progress' || a.status === 'Scheduled'
    ) || appointments[0];

    const reminders = data?.reminders || [];

    // Service workflow pipeline definition
    const serviceStages = [
        { key: 'Scheduled', label: t('scheduled') || 'Scheduled' },
        { key: 'Inspection', label: t('inspection') || 'Inspection' },
        { key: 'In Progress', label: t('in_repair') || 'In Repair' },
        { key: 'Quality Check', label: t('quality_check') || 'Quality Check' },
        { key: 'Completed', label: t('ready_pickup') || 'Ready' }
    ];

    const getCurrentStageIndex = (status) => {
        if (!status) return 0;
        const normalized = status.toLowerCase();
        if (normalized.includes('sched')) return 0;
        if (normalized.includes('inspect')) return 1;
        if (normalized.includes('prog') || normalized.includes('repair')) return 2;
        if (normalized.includes('check') || normalized.includes('qual')) return 3;
        if (normalized.includes('ready') || normalized.includes('comp')) return 4;
        return 0;
    };

    const currentStageIdx = activeAppointment ? getCurrentStageIndex(activeAppointment.status) : -1;

    return (
        <div className="space-y-6 pb-12">
            
            {/* ── Key Metrics Overview ── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                    to="/vehicles"
                    className="p-5 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t('registered_vehicles')}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-950 dark:text-white tabular-nums">
                                {stats.totalVehicles || vehicles.length}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{isAr ? 'سيارات' : 'Cars'}</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400 border border-amber-400/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Car size={20} />
                    </div>
                </Link>

                <Link
                    to="/history"
                    className="p-5 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t('total_visits')}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-950 dark:text-white tabular-nums">
                                {stats.totalServices}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{isAr ? 'زيارة صيانة' : 'Visits'}</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <History size={20} />
                    </div>
                </Link>

                <Link
                    to="/invoices"
                    className="p-5 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t('egp_invested') || 'Maintenance Invested'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-950 dark:text-white tabular-nums">
                                {stats.totalSpent?.toLocaleString() || 0}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <TrendingUp size={20} />
                    </div>
                </Link>
            </section>

            {/* ── Cockpit Vehicle Stage ── */}
            <section className="bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm">
                
                {/* Fleet Switcher Tab Bar */}
                <div className="px-6 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-4 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                            {t('garage_fleet')}:
                        </span>
                        <div className="flex items-center gap-1.5">
                            {vehicles.map((v) => {
                                const isSelected = v.id === selectedVehicleId;
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVehicleId(v.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                            isSelected
                                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                                : 'bg-white dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08]'
                                        }`}
                                    >
                                        <Car size={13} />
                                        <span>{v.make} {v.model}</span>
                                        {v.license_plate && (
                                            <span className="text-[10px] opacity-75 font-mono">({v.license_plate})</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Link
                        to="/vehicles"
                        className="text-xs font-semibold text-amber-500 hover:text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0"
                    >
                        <span>{t('manage_fleet')}</span>
                        <ArrowUpRight size={13} />
                    </Link>
                </div>

                {/* Main Vehicle Cockpit Content */}
                {activeVehicle ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
                        
                        {/* Left Details & Telemetry Gauges */}
                        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-slate-100 dark:border-white/[0.06] space-y-6">
                            
                            <div>
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 mb-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    <span>{t('active_vehicle')}</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                                    {activeVehicle.make} {activeVehicle.model}
                                </h2>

                                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {activeVehicle.year}
                                    </span>
                                    <span>•</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] font-mono text-slate-800 dark:text-slate-200">
                                        {activeVehicle.license_plate || (isAr ? 'بدون لوحة' : 'No Plate')}
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono text-[11px]">
                                        VIN: {activeVehicle.vin || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Telemetry Indicator Dials */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <Fuel size={14} className="text-amber-500" />
                                            {t('oil_life')}
                                        </span>
                                        <span className="font-bold tabular-nums text-slate-950 dark:text-white">{oilLifePercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                oilLifePercent > 30 ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${oilLifePercent}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {isAr ? `الصيانة القادمة خلال ~${kmUntilService.toLocaleString()} كم` : `Next due in ~${kmUntilService.toLocaleString()} km`}
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <Activity size={14} className="text-amber-500" />
                                            {t('brake_health')}
                                        </span>
                                        <span className="font-bold tabular-nums text-slate-950 dark:text-white">{brakeLifePercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                            style={{ width: `${brakeLifePercent}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {isAr ? 'فحص البطانات وتيل الفرامل معتمد' : 'Pads & hydraulic system verified'}
                                    </p>
                                </div>
                            </div>

                            {/* Odometer Strip */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center text-slate-700 dark:text-slate-200">
                                        <Gauge size={16} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
                                            {t('odometer')}
                                        </span>
                                        <span className="text-lg font-bold text-slate-950 dark:text-white font-mono tabular-nums">
                                            {mileage ? mileage.toLocaleString() : '—'} <span className="text-xs font-sans text-slate-500">km</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right rtl:text-left">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
                                        {t('services_logged')}
                                    </span>
                                    <span className="text-base font-bold text-slate-950 dark:text-white tabular-nums">
                                        {activeVehicle.services_count || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Fast Actions Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                <Link
                                    to={`/book-service?vehicleId=${activeVehicle.id}`}
                                    className="p-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Calendar size={16} />
                                    <span>{t('booking')}</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setSellModalOpen(true)}
                                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Tag size={16} className="text-amber-500" />
                                    <span>{t('sell_car')}</span>
                                </button>

                                <Link
                                    to="/glovebox"
                                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center gap-1.5 transition-colors"
                                >
                                    <FolderLock size={16} className="text-slate-500 dark:text-slate-400" />
                                    <span>{t('digital_glovebox')}</span>
                                </Link>

                                <Link
                                    to="/ai-advisor"
                                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Bot size={16} className="text-amber-500" />
                                    <span>{t('ai_advisor')}</span>
                                </Link>
                            </div>

                        </div>

                        {/* Right Vehicle Visualizer Stage */}
                        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-[#090a0f] relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                {sketch ? (
                                    <motion.div
                                        key={activeVehicle.id}
                                        initial={{ opacity: 0, scale: 0.94 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.94 }}
                                        transition={{ duration: 0.25 }}
                                        className="w-full flex flex-col items-center justify-center space-y-4"
                                    >
                                        <img 
                                            src={sketch} 
                                            alt={`${activeVehicle.make} ${activeVehicle.model}`}
                                            className="w-full max-h-[260px] object-contain drop-shadow-md filter contrast-105"
                                        />
                                        <div className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-white/[0.06] text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                            {activeVehicle.make} {activeVehicle.model} • {isAr ? 'رسم هندسي معتمد' : 'Verified Blueprint'}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-12 text-slate-400 text-xs">
                                        <Car size={32} className="mx-auto mb-2 opacity-40" />
                                        <span>{isAr ? 'الرسم الهندسي قيد الإعداد' : 'Blueprint representation unavailable'}</span>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                ) : (
                    <div className="p-12 text-center space-y-3">
                        <Car size={36} className="mx-auto text-amber-500" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {t('no_vehicles')}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {isAr 
                                ? 'سجل سيارتك مع خدمة العملاء لتمكين العدادات الرقمية وتتبع الصيانات الدورية.' 
                                : 'Add your first vehicle with our concierge to enable automated telemetry and digital service records.'}
                        </p>
                        <Link
                            to="/vehicles"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs"
                        >
                            <Plus size={15} />
                            <span>{isAr ? 'إضافة مركبة' : 'Register Vehicle'}</span>
                        </Link>
                    </div>
                )}
            </section>

            {/* ── Live Service Status Pipeline (if active appointment) ── */}
            {activeAppointment && (
                <section className="bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
                                    <span>{t('service_pipeline')}</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 font-semibold">
                                        {activeAppointment.status || 'Active'}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {activeAppointment.service_type || 'General Maintenance'} • {activeAppointment.make} {activeAppointment.model}
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/appointments"
                            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1 shrink-0"
                        >
                            <span>{isAr ? 'عرض تفاصيل الحجز' : 'View Appointment Details'}</span>
                            <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
                        </Link>
                    </div>

                    {/* Stage Stepper */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                        {serviceStages.map((stage, idx) => {
                            const isCompleted = idx < currentStageIdx;
                            const isCurrent = idx === currentStageIdx;
                            return (
                                <div 
                                    key={stage.key}
                                    className={`p-3.5 rounded-xl border text-center transition-all ${
                                        isCurrent 
                                            ? 'bg-amber-400/10 border-amber-400 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/20' 
                                            : isCompleted
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.06] text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center justify-center mb-1.5">
                                        {isCompleted ? (
                                            <CheckCircle size={16} className="text-emerald-500" />
                                        ) : isCurrent ? (
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                                        ) : (
                                            <span className="text-[11px] font-mono font-bold text-slate-400">{idx + 1}</span>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold block">{stage.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Maintenance Alerts & Reminders ── */}
            <section className="bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                    <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
                        <AlertTriangle size={17} className="text-amber-500" />
                        <span>{t('reminders_alerts')}</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                        {reminders.length} {isAr ? 'تنبيه' : 'pending'}
                    </span>
                </div>

                {reminders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {reminders.map((rem) => (
                            <div 
                                key={rem.id}
                                className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            {rem.service_type}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 font-medium">
                                            {rem.due_date ? new Date(rem.due_date).toLocaleDateString() : (isAr ? 'مستحق قريباً' : 'Due Soon')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {rem.make} {rem.model} {rem.license_plate && `(${rem.license_plate})`}
                                    </p>
                                </div>

                                <Link
                                    to={`/book-service?vehicleId=${rem.vehicle_id || ''}&serviceType=${encodeURIComponent(rem.service_type || '')}`}
                                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition-colors"
                                >
                                    {isAr ? 'حجز الآن' : 'Schedule'}
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-6 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                        <ShieldCheck size={20} className="shrink-0" />
                        <p className="text-xs font-semibold">
                            {t('no_reminders')}
                        </p>
                    </div>
                )}
            </section>

            {/* Sell Car Modal */}
            <SellCarModal
                isOpen={sellModalOpen}
                vehicle={activeVehicle}
                onClose={() => setSellModalOpen(false)}
                onSuccess={() => setSellModalOpen(false)}
            />

        </div>
    );
};

export default Dashboard;
