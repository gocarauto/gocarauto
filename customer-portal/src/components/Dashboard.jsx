import React, { useState, useEffect, useRef } from 'react';
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
    Droplet,
    Cog,
    ArrowUpRight,
    Tag,
    Clock,
    ChevronRight,
    Plus,
    Activity
} from 'lucide-react';
import SellCarModal from './SellCarModal';

const Dashboard = () => {
    const { t, lang } = useLanguage();
    const isAr = lang === 'ar';

    const [vehicles, setVehicles] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_fleet_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [data, setData] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_dash_cache');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [appointments, setAppointments] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_appointments_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [selectedVehicleId, setSelectedVehicleId] = useState(() => {
        try {
            const saved = localStorage.getItem('gocar_active_vehicle_id') || sessionStorage.getItem('gocar_active_vehicle_id');
            if (saved) return Number(saved) || saved;
            const cached = sessionStorage.getItem('gocar_fleet_cache');
            const fleet = cached ? JSON.parse(cached) : [];
            return fleet[0]?.id || null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(() => {
        try {
            return !sessionStorage.getItem('gocar_dash_cache');
        } catch {
            return true;
        }
    });
    const [sellModalOpen, setSellModalOpen] = useState(false);

    // Refs for precision dynamic laser line tracking across any screen width
    const stageRef = useRef(null);
    const oilCardRef = useRef(null);
    const teleCardRef = useRef(null);
    const transCardRef = useRef(null);
    const carImgRef = useRef(null);
    const [lineCoords, setLineCoords] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashRes, fleetRes, apptRes, remRes] = await Promise.all([
                    api.get('/customer-portal/dashboard'),
                    api.get('/customer-portal/vehicles'),
                    api.get('/customer-portal/appointments'),
                    api.get('/customer-portal/reminders')
                ]);

                const fleet = fleetRes.data?.data || [];
                setVehicles(fleet);

                const dashData = dashRes.data?.data || {};
                const upcoming = dashData.upcomingService || [];
                const initialCarId = upcoming[0]?.id || fleet[0]?.id || null;
                setSelectedVehicleId(prev => prev || initialCarId);

                const apptList = apptRes.data?.data || [];
                setAppointments(apptList);
                const fullDash = {
                    ...dashData,
                    reminders: remRes.data?.data || []
                };
                setData(fullDash);

                try {
                    sessionStorage.setItem('gocar_fleet_cache', JSON.stringify(fleet));
                    sessionStorage.setItem('gocar_appointments_cache', JSON.stringify(apptList));
                    sessionStorage.setItem('gocar_dash_cache', JSON.stringify(fullDash));
                } catch {
                    // ignore quota errors
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

    // Automotive telemetry & interval calculations
    const stats = data?.stats || {};
    const mileage = activeVehicle?.current_mileage || stats.mileage || 0;
    const kmUntilService = activeVehicle ? Math.max(0, 10000 - (mileage % 10000)) : 10000;
    const oilLifePercent = Math.min(100, Math.max(0, Math.round((kmUntilService / 10000) * 100)));
    const transmissionLifePercent = activeVehicle ? (activeVehicle.services_count > 0 ? 92 : 100) : 100;
    const sketch = activeVehicle ? getVehicleSketch(activeVehicle.make, activeVehicle.model, activeVehicle.year) : null;

    // Check for an active ongoing appointment
    const activeAppointment = appointments.find(a => 
        a.status === 'In Progress' || a.status === 'Scheduled' || a.status === 'Open' || a.status === 'Inspection'
    );

    // Dynamic stage height: expands to accommodate enlarged vehicle hero presence on desktop, compact on mobile
    const stageHeightClass = activeAppointment ? 'h-[360px] sm:h-[440px] md:h-[530px]' : 'h-[380px] sm:h-[460px] md:h-[620px]';

    // Dynamic precision calculation of leader lines locking card borders directly to vehicle coordinates
    const updateLineCoords = () => {
        if (!stageRef.current || !oilCardRef.current || !teleCardRef.current || !transCardRef.current || !carImgRef.current) return;
        const stage = stageRef.current.getBoundingClientRect();
        const oil = oilCardRef.current.getBoundingClientRect();
        const tele = teleCardRef.current.getBoundingClientRect();
        const trans = transCardRef.current.getBoundingClientRect();
        const car = carImgRef.current.getBoundingClientRect();

        setLineCoords({
            oil: {
                x1: oil.right - stage.left,
                y1: oil.top - stage.top + oil.height / 2,
                x2: car.left - stage.left + car.width * 0.33,
                y2: car.top - stage.top + car.height * 0.40
            },
            tele: {
                x1: tele.left - stage.left,
                y1: tele.top - stage.top + tele.height / 2,
                x2: car.left - stage.left + car.width * 0.65,
                y2: car.top - stage.top + car.height * 0.26
            },
            trans: {
                x1: trans.left - stage.left,
                y1: trans.top - stage.top + trans.height / 2,
                x2: car.left - stage.left + car.width * 0.42,
                y2: car.top - stage.top + car.height * 0.48
            },
            width: stage.width,
            height: stage.height
        });
    };

    useEffect(() => {
        updateLineCoords();
        window.addEventListener('resize', updateLineCoords);
        const timer = setTimeout(updateLineCoords, 100);
        return () => {
            window.removeEventListener('resize', updateLineCoords);
            clearTimeout(timer);
        };
    }, [activeVehicle, stageHeightClass, sketch]);

    if (loading && !data && vehicles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t('loading')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            
            {/* ── ZONE 3: Top 3 KPI Metric Cards ── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                    to="/vehicles"
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 block">
                            {t('registered_vehicles')}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                                {stats.totalVehicles || vehicles.length}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-400 font-medium">{isAr ? 'سيارات' : 'Cars'}</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400 border border-amber-400/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Car size={20} />
                    </div>
                </Link>

                <Link
                    to="/history"
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 block">
                            {t('total_visits')}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                                {stats.totalServices || 0}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-400 font-medium">{isAr ? 'زيارات' : 'Visits'}</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <History size={20} />
                    </div>
                </Link>

                <Link
                    to="/invoices"
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between group"
                >
                    <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 block">
                            {t('egp_invested') || 'EGP Invested'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                                {stats.totalSpent?.toLocaleString() || 0}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-400 font-medium">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <TrendingUp size={20} />
                    </div>
                </Link>
            </section>

            {/* ── ZONE 4: Garage Fleet Hero Stage (Full-Width Responsive Arena) ── */}
            <section className="bg-[#0a0c14] border border-slate-800/80 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* Fleet Switcher Tab Bar */}
                <div className="px-6 sm:px-8 py-3.5 border-b border-white/[0.06] bg-black/20 flex items-center justify-between gap-4 overflow-x-auto relative z-30">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 font-sans">
                            {t('garage_fleet')}:
                        </span>
                        <div className="flex items-center gap-2">
                            {vehicles.map((v) => {
                                const isSelected = v.id === selectedVehicleId;
                                return (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedVehicleId(v.id);
                                            try { localStorage.setItem('gocar_active_vehicle_id', v.id); } catch (err) { void err; }
                                        }}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                                            isSelected
                                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                                                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                                        }`}
                                    >
                                        <Car size={14} />
                                        <span>{v.make} {v.model}</span>
                                    </button>
                                );
                            })}

                            <Link
                                to="/vehicles"
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-transparent hover:bg-white/[0.04] border border-dashed border-white/20 flex items-center gap-1.5 shrink-0 transition-colors"
                            >
                                <Plus size={13} />
                                <span>{isAr ? 'إضافة سيارة' : 'Add Vehicle'}</span>
                            </Link>
                        </div>
                    </div>

                    <Link
                        to="/vehicles"
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 transition-colors"
                    >
                        <span>{t('manage_fleet')}</span>
                        <ArrowUpRight size={13} />
                    </Link>
                </div>

                {/* Main Vehicle Cinematic Stage (Full Width Uncaged Layout) */}
                {activeVehicle ? (
                    <div 
                        ref={stageRef}
                        className={`relative w-full ${stageHeightClass} overflow-hidden select-none transition-[height] duration-300`}
                    >
                        
                        {/* Ambient Showroom Radial Glow & Floor Halo */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/[0.08] via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-[13%] left-1/2 -translate-x-1/2 w-[720px] sm:w-[780px] max-w-[88%] h-[95px] bg-amber-500/[0.13] rounded-[100%] blur-3xl pointer-events-none" />

                        {/* Idea D: Ambient Showroom Stardust Micro-Particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
                            {[
                                { top: '22%', left: '26%', size: 3, delay: 0, dur: 6, opacity: 0.4 },
                                { top: '35%', left: '40%', size: 2, delay: 1.2, dur: 7, opacity: 0.5 },
                                { top: '18%', left: '55%', size: 3.5, delay: 2.5, dur: 5.5, opacity: 0.35 },
                                { top: '48%', left: '68%', size: 2.5, delay: 0.8, dur: 8, opacity: 0.45 },
                                { top: '28%', left: '76%', size: 3, delay: 3.1, dur: 6.5, opacity: 0.3 },
                                { top: '65%', left: '36%', size: 2, delay: 1.8, dur: 7.5, opacity: 0.4 },
                                { top: '72%', left: '64%', size: 3, delay: 2.2, dur: 6, opacity: 0.35 },
                                { top: '16%', left: '48%', size: 2.5, delay: 4, dur: 7, opacity: 0.5 },
                                { top: '55%', left: '22%', size: 3, delay: 1.5, dur: 6.2, opacity: 0.3 },
                                { top: '42%', left: '84%', size: 2, delay: 2.9, dur: 7.8, opacity: 0.4 },
                                { top: '62%', left: '78%', size: 2.5, delay: 0.5, dur: 6.8, opacity: 0.35 },
                                { top: '30%', left: '32%', size: 3.5, delay: 3.5, dur: 5.8, opacity: 0.45 }
                            ].map((p, idx) => (
                                <motion.div
                                    key={idx}
                                    animate={{
                                        y: [-6, 6, -6],
                                        x: [-3, 3, -3],
                                        opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.4]
                                    }}
                                    transition={{
                                        duration: p.dur,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: p.delay
                                    }}
                                    style={{
                                        top: p.top,
                                        left: p.left,
                                        width: p.size,
                                        height: p.size
                                    }}
                                    className="absolute rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                                />
                            ))}
                        </div>

                        {/* Top-Left Active Vehicle Identity (Anchored cleanly to container margin) */}
                        <div className="absolute top-6 left-6 sm:left-10 rtl:right-6 rtl:sm:right-10 rtl:left-auto z-20 pointer-events-auto">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[12px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>{t('active_vehicle')}</span>
                            </div>

                            <h2 className="text-[25px] sm:text-[31px] font-extrabold text-white tracking-tight">
                                {activeVehicle.make} {activeVehicle.model}
                            </h2>

                            <div className="flex items-center gap-2 text-[13px] text-slate-400 font-sans mt-1">
                                <span className="text-slate-300 font-bold">{activeVehicle.year}</span>
                                <span>•</span>
                                <span>{activeVehicle.license_plate || (isAr ? 'بدون لوحة' : 'No Plate')}</span>
                                <span>•</span>
                                <span>VIN: {activeVehicle.vin || '—'}</span>
                            </div>
                        </div>

                        {/* Centered Vehicle Sketch Visualizer */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-6 sm:px-12">
                            <div className="relative inline-flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {sketch ? (
                                        <motion.img
                                            ref={carImgRef}
                                            key={activeVehicle.id}
                                            src={sketch}
                                            alt={`${activeVehicle.make} ${activeVehicle.model}`}
                                            onLoad={updateLineCoords}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                            className="h-[390px] sm:h-[470px] lg:h-[500px] w-auto max-w-[92%] sm:max-w-[80%] object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)] contrast-[1.05]"
                                        />
                                    ) : (
                                        <div className="text-center text-slate-500 text-xs">
                                            <Car size={40} className="mx-auto mb-2 opacity-40 text-amber-500" />
                                            <span>{isAr ? 'الرسم الهندسي قيد الإعداد' : 'Blueprint representation unavailable'}</span>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Dynamic Calibrated SVG Dotted Dashed Leader Lines (Pixel-locked to cards and car) */}
                        {lineCoords && (
                            <svg 
                                className="absolute inset-0 pointer-events-none z-10 hidden sm:block"
                                style={{ width: lineCoords.width, height: lineCoords.height }}
                            >
                                <defs>
                                    <filter id="glow-hud" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="2" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Point A: Left Engine Oil Line (Locked from card border -> Hood) */}
                                <g filter="url(#glow-hud)">
                                    <path
                                        d={`M ${lineCoords.oil.x1} ${lineCoords.oil.y1} C ${(lineCoords.oil.x1 + lineCoords.oil.x2) / 2} ${lineCoords.oil.y1}, ${(lineCoords.oil.x1 + lineCoords.oil.x2) / 2} ${lineCoords.oil.y2}, ${lineCoords.oil.x2} ${lineCoords.oil.y2}`}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        opacity="0.9"
                                    />
                                    <circle cx={lineCoords.oil.x1} cy={lineCoords.oil.y1} r="3.5" fill="#10b981" />
                                    <circle cx={lineCoords.oil.x2} cy={lineCoords.oil.y2} r="5" fill="#10b981" />
                                    <circle cx={lineCoords.oil.x2} cy={lineCoords.oil.y2} r="10" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                                </g>

                                {/* Point B: Upper Right Telemetry Card Line (Locked from card border -> Roof/B-Pillar) */}
                                <g filter="url(#glow-hud)">
                                    <path
                                        d={`M ${lineCoords.tele.x1} ${lineCoords.tele.y1} C ${(lineCoords.tele.x1 + lineCoords.tele.x2) / 2} ${lineCoords.tele.y1}, ${(lineCoords.tele.x1 + lineCoords.tele.x2) / 2} ${lineCoords.tele.y2}, ${lineCoords.tele.x2} ${lineCoords.tele.y2}`}
                                        fill="none"
                                        stroke="#cbd5e1"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        opacity="0.8"
                                    />
                                    <circle cx={lineCoords.tele.x1} cy={lineCoords.tele.y1} r="3.5" fill="#cbd5e1" />
                                    <circle cx={lineCoords.tele.x2} cy={lineCoords.tele.y2} r="4.5" fill="#cbd5e1" />
                                    <circle cx={lineCoords.tele.x2} cy={lineCoords.tele.y2} r="9" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.35" />
                                </g>

                                {/* Point C: Lower Right Transmission Oil Line (Locked from card border -> Front Wheel/Transmission) */}
                                <g filter="url(#glow-hud)">
                                    <path
                                        d={`M ${lineCoords.trans.x1} ${lineCoords.trans.y1} C ${(lineCoords.trans.x1 + lineCoords.trans.x2) / 2} ${lineCoords.trans.y1}, ${(lineCoords.trans.x1 + lineCoords.trans.x2) / 2} ${lineCoords.trans.y2}, ${lineCoords.trans.x2} ${lineCoords.trans.y2}`}
                                        fill="none"
                                        stroke="#06b6d4"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        opacity="0.9"
                                    />
                                    <circle cx={lineCoords.trans.x1} cy={lineCoords.trans.y1} r="3.5" fill="#06b6d4" />
                                    <circle cx={lineCoords.trans.x2} cy={lineCoords.trans.y2} r="5" fill="#06b6d4" />
                                    <circle cx={lineCoords.trans.x2} cy={lineCoords.trans.y2} r="10" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
                                </g>
                            </svg>
                        )}

                        {/* Point A: Left Telemetry - High-Contrast ENGINE OIL LIFE Capsule (Desktop HUD) */}
                        <div 
                            ref={oilCardRef}
                            className="hidden md:block absolute left-6 sm:left-10 lg:left-14 top-[50%] -translate-y-1/2 z-20 pointer-events-auto"
                        >
                            <div className="relative p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl space-y-1.5 w-[210px]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-sans">
                                        {t('oil_life')}
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                </div>
                                <div className="flex items-center gap-3 pt-0.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                                        <Droplet size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-2xl font-extrabold text-white tabular-nums font-mono leading-none block">
                                            {oilLifePercent}%
                                        </span>
                                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden border border-white/[0.05]">
                                            <div
                                                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                                style={{ width: `${oilLifePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[11px] text-slate-300 font-sans block pt-1">
                                    {isAr ? `الصيانة القادمة خلال ~${kmUntilService.toLocaleString()} كم` : `Next due in ~${kmUntilService.toLocaleString()} km`}
                                </span>
                            </div>
                        </div>

                        {/* Point B: Upper Right - High-Contrast Telemetry & Activity (Desktop HUD) */}
                        <div 
                            ref={teleCardRef}
                            className="hidden md:block absolute right-6 sm:right-10 lg:right-14 top-[14%] sm:top-[16%] z-20 pointer-events-auto"
                        >
                            <div className="relative p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl w-[230px] text-left rtl:text-right space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-700/60 pb-2">
                                    <span className="font-sans">{t('telemetry_activity')}</span>
                                    <Activity size={13} className="text-amber-400" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                            {t('odometer')}:
                                        </span>
                                        <span className="font-mono font-bold text-white tabular-nums text-sm">
                                            {mileage ? `${mileage.toLocaleString()} km` : '— km'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                            {t('services_logged')}:
                                        </span>
                                        <span className="font-mono font-bold text-white tabular-nums text-sm">
                                            {activeVehicle.services_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Point C: Lower Right - High-Contrast TRANSMISSION OIL LIFE Capsule (Desktop HUD) */}
                        <div 
                            ref={transCardRef}
                            className="hidden md:block absolute right-6 sm:right-10 lg:right-14 top-[60%] sm:top-[62%] z-20 pointer-events-auto text-left rtl:text-right"
                        >
                            <div className="relative p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl space-y-1.5 w-[230px]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-sans">
                                        {t('transmission_oil')}
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                </div>
                                <div className="flex items-center gap-3 pt-0.5">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                                        <Cog size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-2xl font-extrabold text-white tabular-nums font-mono leading-none block">
                                            {transmissionLifePercent}%
                                        </span>
                                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden border border-white/[0.05]">
                                            <div
                                                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                                                style={{ width: `${transmissionLifePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[11px] text-slate-300 font-sans block pt-1">
                                    {isAr ? 'تم التحقق من جدول الصيانة' : 'Scheduled interval verified'}
                                </span>
                            </div>
                        </div>

                        {/* Bottom Unified Glass Segmented Action Dock (Responsive) */}
                        <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95%]">
                            <div className="p-1 sm:p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-2xl flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                                <Link
                                    to={`/book-service?vehicleId=${activeVehicle.id}`}
                                    className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs sm:text-[13px] flex items-center gap-1.5 sm:gap-2 shadow-sm whitespace-nowrap transition-all duration-150 cursor-pointer"
                                >
                                    <Calendar size={15} />
                                    <span>{t('booking')}</span>
                                </Link>

                                <div className="h-4 w-px bg-slate-700/70 mx-0.5 sm:mx-1 shrink-0" />

                                <button
                                    type="button"
                                    onClick={() => setSellModalOpen(true)}
                                    className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer"
                                >
                                    <Tag size={15} className="text-amber-400" />
                                    <span>{t('sell_car')}</span>
                                </button>

                                <div className="h-4 w-px bg-slate-700/70 mx-0.5 sm:mx-1 shrink-0" />

                                <Link
                                    to="/glovebox"
                                    className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer"
                                >
                                    <FolderLock size={15} className="text-slate-400" />
                                    <span>{t('car_documents')}</span>
                                </Link>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="p-12 text-center space-y-3">
                        <Car size={36} className="mx-auto text-amber-500" />
                        <h3 className="text-lg font-bold text-white">
                            {t('no_vehicles')}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
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

                {/* ── Responsive Mobile Vitals Tray (< md screens) ── */}
                {activeVehicle && (
                    <div className="md:hidden px-4 py-3.5 bg-black/40 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Mobile Oil Life Card */}
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Droplet size={16} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-300 uppercase block leading-tight font-sans">
                                        {t('oil_life')}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        ~{kmUntilService.toLocaleString()} km
                                    </span>
                                </div>
                            </div>
                            <span className="text-xl font-extrabold text-white tabular-nums font-mono">
                                {oilLifePercent}%
                            </span>
                        </div>

                        {/* Mobile Mileage & Services Card */}
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                                    <Activity size={16} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-300 uppercase block leading-tight font-sans">
                                        {t('odometer')}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {activeVehicle.services_count || 0} {isAr ? 'صيانات' : 'services'}
                                    </span>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-white tabular-nums font-mono">
                                {mileage ? `${mileage.toLocaleString()} km` : '—'}
                            </span>
                        </div>

                        {/* Mobile Transmission Card */}
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                                    <Cog size={16} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-300 uppercase block leading-tight font-sans">
                                        {t('transmission_oil')}
                                    </span>
                                    <span className="text-[10px] text-cyan-400 font-semibold">
                                        {isAr ? 'تم الفحص' : 'Verified'}
                                    </span>
                                </div>
                            </div>
                            <span className="text-xl font-extrabold text-white tabular-nums font-mono">
                                {transmissionLifePercent}%
                            </span>
                        </div>
                    </div>
                )}
            </section>

            {/* ── ZONE 5: Smart Contextual Lower Deck (Live Service Status) ── */}
            {activeAppointment && (
                <section className="bg-white dark:bg-[#0c0d12] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-500 border border-amber-400/20 flex items-center justify-center shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                                    {t('service_pipeline')}
                                </h3>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold">
                                    {activeAppointment.status || 'Open'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {activeAppointment.mileage ? `${activeAppointment.mileage.toLocaleString()} km • ` : ''}
                                {activeAppointment.service_type || 'General Maintenance'}
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/appointments"
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1 shrink-0 self-end sm:self-center transition-colors"
                    >
                        <span>{t('view_appointment_details') || 'View Appointment Details'}</span>
                        <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
                    </Link>
                </section>
            )}

            {/* Sell Car Modal */}
            <SellCarModal
                isOpen={sellModalOpen}
                onClose={() => setSellModalOpen(false)}
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
            />
        </div>
    );
};

export default Dashboard;