import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getVehicleSketch } from '../utils/sketchHelper';
import api from '../utils/api';
import {
    CalendarCheck,
    CheckCircle2,
    Car,
    Clock,
    Shield,
    Sparkles,
    Wrench,
    ArrowRight,
    ArrowLeft,
    Check,
    AlertCircle,
    Calendar,
    FileText,
    Loader2,
    Plus
} from 'lucide-react';

const SERVICE_CATEGORIES = [
    { 
        id: 'صيانة دورية داخل التوكيل', 
        en: 'Certified Scheduled Service (Dealership Spec)', 
        ar: 'صيانة دورية معتمدة (مواصفات التوكيل)',
        icon: Shield,
        descEn: 'Full scheduled fluid & filter cycle maintaining factory warranty standards',
        descAr: 'صيانة كاملة للزيوت والفلاتر مع الحفاظ على معايير وضمان المصنع'
    },
    { 
        id: 'صيانة دورية خارج التوكيل', 
        en: 'Essential Workshop Service (OEM Grade)', 
        ar: 'صيانة دورية اقتصادية (قطع أصلية)',
        icon: Wrench,
        descEn: 'High-grade synthetic fluids, OEM filters, and 45-point vehicle inspection',
        descAr: 'زيوت تخليقية وفلاتر معتمدة مع فحص شامل لأكثر من ٤٥ نقطة'
    },
    { 
        id: 'تصليح أعطال', 
        en: 'Diagnostics & Mechanical Repair', 
        ar: 'كشف أعطال بالكمبيوتر وإصلاح ميكانيكي',
        icon: AlertCircle,
        descEn: 'Computer diagnostics (OBD-II), engine check, gearbox, and electrical troubleshooting',
        descAr: 'فحص كمبيوتر وتشخيص دقيق لأعطال المحرك وناقل الحركة والكهرباء'
    },
    { 
        id: 'كشف على السيارة للسفر', 
        en: 'Pre-Travel Safety Inspection', 
        ar: 'فحص شامل للسيارة قبل السفر',
        icon: Sparkles,
        descEn: 'Tire safety, cooling system pressure, brake pads, battery, and suspension check',
        descAr: 'فحص الإطارات ودورة التبريد والفرامل والبطارية ونظام التعليق'
    },
    { 
        id: 'طلب قطع غيار', 
        en: 'Spare Parts Procurement & Installation', 
        ar: 'طلب وتوريد قطع غيار أصلية مع التركيب',
        icon: CalendarCheck,
        descEn: 'Direct sourcing of authentic factory parts with official itemized invoice',
        descAr: 'توفير قطع غيار أصلية برقم القطعة مع ضمان رسمي وفاتورة ضريبية'
    }
];

const TIME_SLOTS = [
    { id: '09:00 AM', labelEn: '09:00 AM (Morning Intake)', labelAr: '٠٩:٠٠ ص (فترة الصباح)' },
    { id: '11:30 AM', labelEn: '11:30 AM (Midday Slot)', labelAr: '١١:٣٠ ص (فترة الظهيرة)' },
    { id: '02:00 PM', labelEn: '02:00 PM (Afternoon Slot)', labelAr: '٠٢:٠٠ م (بعد الظهر)' },
    { id: '04:30 PM', labelEn: '04:30 PM (Evening Intake)', labelAr: '٠٤:٣٠ م (فترة المساء)' }
];

const ServiceBooking = () => {
    const { user } = useAuth();
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paramVehicleId = searchParams.get('vehicleId');
    const paramServiceType = searchParams.get('serviceType');
    const paramNotes = searchParams.get('notes');

    const [step, setStep] = useState(1);
    const [vehicles, setVehicles] = useState(() => {
        try {
            const cached = sessionStorage.getItem('gocar_fleet_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [loadingVehicles, setLoadingVehicles] = useState(() => {
        try {
            return !sessionStorage.getItem('gocar_fleet_cache');
        } catch {
            return true;
        }
    });

    const [formData, setFormData] = useState(() => {
        let initialVehId = paramVehicleId || '';
        if (!initialVehId) {
            try {
                const cached = sessionStorage.getItem('gocar_fleet_cache');
                const list = cached ? JSON.parse(cached) : [];
                if (list.length > 0) initialVehId = list[0].id;
            } catch {
                // ignore session storage read errors
            }
        }
        return {
            vehicleId: initialVehId,
            serviceType: paramServiceType || 'صيانة دورية داخل التوكيل',
            notes: paramNotes || '',
            scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            scheduledTime: '09:00 AM'
        };
    });

    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/customer-portal/vehicles');
                const fleet = response.data?.data || [];
                setVehicles(fleet);
                try {
                    sessionStorage.setItem('gocar_fleet_cache', JSON.stringify(fleet));
                } catch {
                    // ignore quota errors
                }
                if (fleet.length > 0) {
                    const matched = paramVehicleId && fleet.find(v => String(v.id) === String(paramVehicleId));
                    setFormData(prev => ({ 
                        ...prev, 
                        vehicleId: matched ? matched.id : (prev.vehicleId || fleet[0].id) 
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch vehicles', err);
            } finally {
                setLoadingVehicles(false);
            }
        };
        fetchVehicles();
    }, [paramVehicleId]);

    const handleSelectVehicle = (id) => {
        setFormData(prev => ({ ...prev, vehicleId: id }));
    };

    const handleSelectServiceType = (typeId) => {
        setFormData(prev => ({ ...prev, serviceType: typeId }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post('/service-requests', {
                clientId: user.id,
                vehicleId: formData.vehicleId,
                serviceType: formData.serviceType,
                notes: formData.notes,
                scheduledDate: formData.scheduledDate,
                scheduledTime: formData.scheduledTime,
                source: 'PORTAL_VIP'
            });

            setSuccessData({
                requestId: res.data?.data?.id || Math.floor(1000 + Math.random() * 9000),
                ...formData
            });
        } catch (err) {
            console.error('Booking failed', err);
            setError(err.response?.data?.error || (isAr ? 'تعذر إتمام الحجز. يرجى المحاولة مرة أخرى.' : 'Booking failed. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    const selectedVehicle = vehicles.find(v => String(v.id) === String(formData.vehicleId));
    const selectedCategory = SERVICE_CATEGORIES.find(c => c.id === formData.serviceType);

    if (successData) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-xl mx-auto py-8"
            >
                <div className="bg-white dark:bg-[#0c0d12] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-8 sm:p-10 shadow-sm text-center space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={30} />
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-400/10 px-3 py-1 rounded-md">
                            {isAr ? 'تم تأكيد طلب الحجز' : 'Intake Request Logged'}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                            {isAr ? 'تم استلام موعد الصيانة بنجاح' : 'Appointment Confirmed'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            {isAr 
                                ? 'تم حجز باكتك بنجاح وسيتواصل معك مهندس الاستقبال لتأكيد تفاصيل الاستلام.'
                                : 'Your workshop bay has been reserved. Our intake team will prepare the diagnostic sequence.'}
                        </p>
                    </div>

                    {/* Booking Card Details */}
                    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-5 text-left rtl:text-right space-y-3 border border-slate-200/60 dark:border-white/[0.06] text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">{isAr ? 'السيارة:' : 'Vehicle:'}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.license_plate || '—'})</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">{isAr ? 'باقة الخدمة:' : 'Service Package:'}</span>
                            <span className="font-bold text-amber-500">{isAr ? (selectedCategory?.ar || formData.serviceType) : (selectedCategory?.en || formData.serviceType)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">{isAr ? 'الموعد المحدد:' : 'Arrival Window:'}</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{formData.scheduledDate} @ {formData.scheduledTime}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-900 dark:text-white font-bold text-xs transition-colors"
                        >
                            {isAr ? 'العودة للوحة القيادة' : 'Return to Dashboard'}
                        </button>
                        <button
                            onClick={() => navigate('/appointments')}
                            className="flex-1 py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                        >
                            {isAr ? 'جدول المواعيد' : 'View Schedule'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            
            {/* Header with Step Wizard */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                        {isAr ? 'حجز موعد صيانة' : 'Schedule Service Appointment'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'خطوات ميسرة لحجز فحص وصيانة سيارتك' : 'Book a certified workshop bay and technical diagnostic'}
                    </p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0c0d12] p-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
                    {[
                        { num: 1, label: isAr ? 'السيارة والخدمة' : 'Vehicle & Service' },
                        { num: 2, label: isAr ? 'الموعد' : 'Date & Time' },
                        { num: 3, label: isAr ? 'التأكيد' : 'Confirm' }
                    ].map((s) => (
                        <div
                            key={s.num}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                step === s.num
                                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                                    : step > s.num
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-400'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-900/10 dark:bg-white/10">
                                {step > s.num ? <Check size={12} strokeWidth={3} /> : s.num}
                            </span>
                            <span className="hidden md:inline">{s.label}</span>
                        </div>
                    ))}
                </div>
            </header>

            {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                    <button type="button" onClick={() => setError('')} className="text-xs underline cursor-pointer">
                        {isAr ? 'إغلاق' : 'Dismiss'}
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                    
                    {/* ── STEP 1: VEHICLE & SERVICE CATEGORY ── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.18 }}
                            className="space-y-6"
                        >
                            {/* Vehicle Picker */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Car size={15} className="text-amber-500" />
                                    <span>{isAr ? '١. حدد السيارة' : '1. Select Vehicle'}</span>
                                </label>

                                {loadingVehicles && vehicles.length === 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-pulse">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-36 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
                                        ))}
                                    </div>
                                ) : vehicles.length === 0 ? (
                                    <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 space-y-3">
                                        <Car size={32} className="mx-auto text-amber-500 opacity-60" />
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                            {isAr ? 'لم يتم العثور على سيارات مسجلة لحسابك' : 'No Vehicles Found in Your Garage'}
                                        </h4>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                            {isAr 
                                                ? 'يرجى التواصل مع خدمة العملاء أو إضافة سيارتك لتتمكن من حجز موعد الصيانة.' 
                                                : 'Please register your vehicle first so our workshop intake team can reserve the diagnostic bay.'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/vehicles')}
                                            className="py-2 px-4 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={14} />
                                            <span>{isAr ? 'الذهاب لإدارة السيارات' : 'Manage Garage Vehicles'}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {vehicles.map((v) => {
                                            const isSelected = String(v.id) === String(formData.vehicleId);
                                            const sketch = getVehicleSketch(v.make, v.model, v.year);
                                            return (
                                                <div
                                                    key={v.id}
                                                    onClick={() => handleSelectVehicle(v.id)}
                                                    className={`cursor-pointer p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                                                        isSelected
                                                            ? 'bg-white dark:bg-[#12131a] border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                                                            : 'bg-white dark:bg-[#0c0d12] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                                                            <Check size={12} strokeWidth={3} />
                                                        </span>
                                                    )}
                                                    <div className="h-14 flex items-center justify-center mb-3">
                                                        <img 
                                                            src={sketch} 
                                                            alt="" 
                                                            className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform" 
                                                        />
                                                    </div>
                                                    <h3 className="font-bold text-slate-950 dark:text-white text-sm">
                                                        {v.make} {v.model}
                                                    </h3>
                                                    <div className="flex items-center justify-between text-xs mt-1.5 text-slate-500 font-mono">
                                                        <span>{v.year}</span>
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white font-bold">{v.license_plate || 'No Plate'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Service Category Picker */}
                            <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Wrench size={15} className="text-amber-500" />
                                    <span>{isAr ? '٢. حدد باقة الصيانة المطلوبة' : '2. Choose Service Package'}</span>
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {SERVICE_CATEGORIES.map((cat) => {
                                        const isSelected = formData.serviceType === cat.id;
                                        const CatIcon = cat.icon;
                                        return (
                                            <div
                                                key={cat.id}
                                                onClick={() => handleSelectServiceType(cat.id)}
                                                className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                                                    isSelected
                                                        ? 'bg-white dark:bg-[#12131a] border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                                                        : 'bg-white dark:bg-[#0c0d12] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500'}`}>
                                                    <CatIcon size={18} />
                                                </div>
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="font-bold text-slate-950 dark:text-white text-xs">
                                                        {isAr ? cat.ar : cat.en}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        {isAr ? cat.descAr : cat.descEn}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end pt-3">
                                <button
                                    type="button"
                                    disabled={!formData.vehicleId}
                                    onClick={() => {
                                        if (!formData.vehicleId) return;
                                        setStep(2);
                                    }}
                                    className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    <span>{isAr ? 'متابعة: الموعد والوقت' : 'Continue to Schedule'}</span>
                                    <ArrowRight size={15} className={isAr ? 'rotate-180' : ''} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2: DATE & TIME SLOTS ── */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.18 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-6"
                        >
                            <div className="space-y-2">
                                <label htmlFor="service-scheduled-date" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar size={15} className="text-amber-500" />
                                    <span>{isAr ? 'تاريخ الوصول المفضل للمركز' : 'Preferred Arrival Date'}</span>
                                </label>
                                <input
                                    id="service-scheduled-date"
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Clock size={15} className="text-amber-500" />
                                    <span>{isAr ? 'اختر نافذة الوصول الزمنية' : 'Select Arrival Window'}</span>
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {TIME_SLOTS.map((slot) => {
                                        const isSelected = formData.scheduledTime === slot.id;
                                        return (
                                            <div
                                                key={slot.id}
                                                onClick={() => setFormData(prev => ({ ...prev, scheduledTime: slot.id }))}
                                                className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-sm'
                                                        : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Clock size={16} className={isSelected ? 'text-amber-400' : 'text-slate-400'} />
                                                    <span className="text-xs font-bold">
                                                        {isAr ? slot.labelAr : slot.labelEn}
                                                    </span>
                                                </div>
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="py-2.5 px-5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                                >
                                    <ArrowLeft size={15} className={isAr ? 'rotate-180' : ''} />
                                    <span>{isAr ? 'السابق' : 'Back'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    <span>{isAr ? 'التالي: المراجعة والتأكيد' : 'Review & Confirm'}</span>
                                    <ArrowRight size={15} className={isAr ? 'rotate-180' : ''} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: TECHNICAL NOTES & DISPATCH ── */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.18 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-6"
                        >
                            {/* Summary Review Card */}
                            <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                                    <Shield size={16} />
                                    <span>{isAr ? 'ملخص الحجز' : 'Intake Summary'}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-500 block">{isAr ? 'السيارة' : 'Vehicle'}</span>
                                        <p className="font-bold text-slate-950 dark:text-white mt-0.5">{selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.license_plate || '—'})</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">{isAr ? 'باقة الخدمة' : 'Service Package'}</span>
                                        <p className="font-bold text-slate-950 dark:text-white mt-0.5">{isAr ? selectedCategory?.ar : selectedCategory?.en}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">{isAr ? 'الموعد المحدد' : 'Scheduled Arrival'}</span>
                                        <p className="font-bold text-slate-950 dark:text-white mt-0.5 font-mono">{formData.scheduledDate} @ {formData.scheduledTime}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div className="space-y-2">
                                <label htmlFor="service-additional-notes" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <FileText size={15} className="text-amber-500" />
                                    <span>{isAr ? 'ملاحظات إضافية أو أعطال تود فحصها' : 'Additional Notes / Symptoms'}</span>
                                </label>
                                <textarea
                                    id="service-additional-notes"
                                    rows={4}
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder={isAr ? 'مثال: يرجى فحص صوت صفارة في العجلات الأمامية وتغيير فلتر التكييف...' : 'e.g. Please check slight squeak in front brakes and top up coolant...'}
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="py-2.5 px-5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                                >
                                    <ArrowLeft size={15} className={isAr ? 'rotate-180' : ''} />
                                    <span>{isAr ? 'السابق' : 'Back'}</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="py-3 px-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{isAr ? 'جاري الإرسال...' : 'Submitting...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>{isAr ? 'تأكيد الحجز فوراً' : 'Confirm Appointment'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </form>
        </div>
    );
};

export default ServiceBooking;
