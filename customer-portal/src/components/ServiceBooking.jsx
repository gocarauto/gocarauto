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
    FileText
} from 'lucide-react';

const SERVICE_CATEGORIES = [
    { 
        id: 'صيانة دورية داخل التوكيل', 
        en: 'Routine Maintenance (Agency Specification)', 
        ar: 'صيانة دورية دورية معتمدة (داخل التوكيل)',
        icon: Shield,
        descEn: 'Full scheduled fluid & filter cycle maintaining warranty standards',
        descAr: 'صيانة كاملة للزيوت والفلاتر وفق معايير الوكيل المعتمدة'
    },
    { 
        id: 'صيانة دورية خارج التوكيل', 
        en: 'Routine Maintenance (Independent Workshop)', 
        ar: 'صيانة دورية اقتصادية (ورش متخصصة)',
        icon: Wrench,
        descEn: 'High-grade German/OEM fluids and multi-point safety check',
        descAr: 'زيوت وفلاتر ألمانية وقطع غيار أصلية بأسعار اقتصادية'
    },
    { 
        id: 'تصليح أعطال', 
        en: 'Diagnostic Scan & Mechanical Repair', 
        ar: 'كشف أعطال بالكمبيوتر وإصلاح ميكانيكي',
        icon: AlertCircle,
        descEn: 'Dedicated OBD-II diagnostics and troubleshooting of strange noises',
        descAr: 'فحص شامل بالكمبيوتر وتشخيص دقيق للأعطال والأصوات'
    },
    { 
        id: 'كشف على السيارة للسفر', 
        en: 'Pre-Travel Comprehensive Health Check', 
        ar: 'فحص شامل للسيارة قبل السفر',
        icon: Sparkles,
        descEn: 'Tire safety, brake pads, cooling pressure, suspension, and battery',
        descAr: 'فحص الإطارات والفرامل ودورة التبريد والعفشة قبل الرحلات'
    },
    { 
        id: 'طلب قطع غيار', 
        en: 'Genuine Spare Parts Procurement & Fitting', 
        ar: 'طلب وتوريد قطع غيار أصلية مع التركيب',
        icon: CalendarCheck,
        descEn: 'Direct sourcing of authentic factory parts with official invoice',
        descAr: 'توفير قطع غيار معتمدة بالرقم الكودي وضمان الفاتورة'
    }
];

const TIME_SLOTS = [
    { id: '09:00 AM', labelEn: '09:00 AM (Morning VIP)', labelAr: '٠٩:٠٠ صباحاً (استقبال مبكر)' },
    { id: '11:30 AM', labelEn: '11:30 AM (Midday Slot)', labelAr: '١١:٣٠ صباحاً (فترة الظهيرة)' },
    { id: '02:00 PM', labelEn: '02:00 PM (Afternoon Intake)', labelAr: '٠٢:٠٠ ظهراً (فترة ما بعد الظهر)' },
    { id: '04:30 PM', labelEn: '04:30 PM (Evening Priority)', labelAr: '٠٤:٣٠ مساءً (استقبال مسائي)' }
];

const ServiceBooking = () => {
    const { user } = useAuth();
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paramVehicleId = searchParams.get('vehicleId');

    const [step, setStep] = useState(1);
    const [vehicles, setVehicles] = useState([]);

    const [formData, setFormData] = useState({
        vehicleId: paramVehicleId || '',
        serviceType: 'صيانة دورية داخل التوكيل',
        notes: '',
        scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        scheduledTime: '09:00 AM'
    });

    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/customer-portal/vehicles');
                const fleet = response.data?.data || [];
                setVehicles(fleet);
                if (fleet.length > 0) {
                    const matched = paramVehicleId && fleet.find(v => String(v.id) === String(paramVehicleId));
                    setFormData(prev => ({ 
                        ...prev, 
                        vehicleId: matched ? matched.id : (prev.vehicleId || fleet[0].id) 
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch vehicles', err);
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
            alert(isAr ? 'تعذر إتمام الحجز. يرجى المحاولة مرة أخرى.' : 'Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedVehicle = vehicles.find(v => String(v.id) === String(formData.vehicleId));
    const selectedCategory = SERVICE_CATEGORIES.find(c => c.id === formData.serviceType);

    if (successData) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto py-12"
            >
                <div className="bg-white dark:bg-[#0c0d12] rounded-[3.5rem] border border-gray-100 dark:border-white/10 p-10 md:p-14 shadow-2xl text-center space-y-6 relative overflow-hidden">
                    <div className="w-20 h-20 rounded-3xl bg-green-500/20 text-green-500 flex items-center justify-center mx-auto shadow-xl">
                        <CheckCircle2 size={42} />
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#fbbf24] px-4 py-1.5 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20">
                            {isAr ? 'تم تأكيد طلب الحجز' : 'VIP RESERVATION CONFIRMED'}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tight">
                            {isAr ? 'تم استلام طلب الصيانة بنجاح' : 'Service Appointment Received'}
                        </h2>
                        <p className="text-xs md:text-sm text-gray-400 font-medium max-w-md mx-auto">
                            {isAr 
                                ? 'سيقوم مسؤول الاستقبال الفني بتأكيد موعد استلام السيارة وتجهيز الباكية المخصصة لك.'
                                : 'Our workshop concierge has registered your intake sequence. Your designated service bay is prepared.'}
                        </p>
                    </div>

                    {/* Booking Card Details */}
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 text-left space-y-3 border border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-bold uppercase">{isAr ? 'السيارة:' : 'Vehicle:'}</span>
                            <span className="font-black text-black dark:text-white">{selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.license_plate})</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-bold uppercase">{isAr ? 'الخدمة:' : 'Service:'}</span>
                            <span className="font-black text-[#fbbf24]">{isAr ? selectedCategory?.ar : selectedCategory?.en}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-bold uppercase">{isAr ? 'الموعد المحدد:' : 'Scheduled Date & Time:'}</span>
                            <span className="font-mono font-bold text-black dark:text-white">{formData.scheduledDate} @ {formData.scheduledTime}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 py-4 px-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                        >
                            {isAr ? 'العودة للوحة القيادة' : 'Return to Dashboard'}
                        </button>
                        <button
                            onClick={() => navigate('/appointments')}
                            className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 dark:bg-white/10 text-black dark:text-white font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                        >
                            {isAr ? 'جدول المواعيد' : 'View Schedule'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tighter">
                        {isAr ? 'حجز موعد صيانة كونسيرج' : 'Concierge Service Booking'}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {isAr ? 'خطوات سريعة لحجز باكتك وخدمة سيارتك' : 'Precision Workshop Intake Sequence'}
                    </p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0c0d12] p-2 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                step === s
                                    ? 'bg-[#fbbf24] text-black shadow-lg scale-105'
                                    : step > s
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                            }`}
                        >
                            {step > s ? <Check size={14} strokeWidth={3} /> : s}
                        </div>
                    ))}
                </div>
            </header>

            <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                    
                    {/* ── STEP 1: VEHICLE & SERVICE CATEGORY ── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Vehicle Picker */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Car size={15} className="text-[#fbbf24]" />
                                    {isAr ? '١. حدد السيارة المراد صيانتها' : '1. Choose Target Vehicle'}
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {vehicles.map((v) => {
                                        const isSelected = String(v.id) === String(formData.vehicleId);
                                        const sketch = getVehicleSketch(v.make, v.model, v.year);
                                        return (
                                            <div
                                                key={v.id}
                                                onClick={() => handleSelectVehicle(v.id)}
                                                className={`cursor-pointer p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                                                    isSelected
                                                        ? 'bg-white dark:bg-[#15161f] border-[#fbbf24] shadow-2xl ring-2 ring-[#fbbf24]/50'
                                                        : 'bg-white dark:bg-[#0c0d12] border-gray-100 dark:border-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#fbbf24] text-black flex items-center justify-center">
                                                        <Check size={14} strokeWidth={3} />
                                                    </span>
                                                )}
                                                <div className="h-16 flex items-center justify-center mb-4">
                                                    <img 
                                                        src={sketch} 
                                                        alt="" 
                                                        className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform" 
                                                    />
                                                </div>
                                                <h3 className="font-black text-black dark:text-white uppercase tracking-tight text-lg leading-tight">
                                                    {v.make} {v.model}
                                                </h3>
                                                <div className="flex items-center justify-between text-xs mt-2 text-gray-400 font-mono">
                                                    <span>{v.year}</span>
                                                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-black dark:text-white font-bold">{v.license_plate}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Service Category Picker */}
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Wrench size={15} className="text-[#fbbf24]" />
                                    {isAr ? '٢. حدد نوع الخدمة المطلوبة' : '2. Select Service Package'}
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {SERVICE_CATEGORIES.map((cat) => {
                                        const isSelected = formData.serviceType === cat.id;
                                        const CatIcon = cat.icon;
                                        return (
                                            <div
                                                key={cat.id}
                                                onClick={() => handleSelectServiceType(cat.id)}
                                                className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 flex items-start gap-4 ${
                                                    isSelected
                                                        ? 'bg-white dark:bg-[#15161f] border-[#fbbf24] shadow-xl ring-2 ring-[#fbbf24]/50'
                                                        : 'bg-white dark:bg-[#0c0d12] border-gray-100 dark:border-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                <div className={`p-3 rounded-2xl shrink-0 ${isSelected ? 'bg-[#fbbf24] text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                                    <CatIcon size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-black dark:text-white tracking-tight text-sm">
                                                        {isAr ? cat.ar : cat.en}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                                        {isAr ? cat.descAr : cat.descEn}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="py-4 px-8 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all"
                                >
                                    <span>{isAr ? 'التالي: الموعد والوقت' : 'Continue to Schedule'}</span>
                                    <ArrowRight size={16} className={isAr ? 'rotate-180' : ''} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2: DATE & CONCIERGE TIME SLOTS ── */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-[3rem] p-8 md:p-12 border border-gray-100 dark:border-white/5 shadow-2xl space-y-8"
                        >
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Calendar size={16} className="text-[#fbbf24]" />
                                    {isAr ? 'تاريخ الوصول المفضل للمركز' : 'Preferred Arrival Date'}
                                </label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-black dark:text-white outline-none focus:ring-2 focus:ring-[#fbbf24]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Clock size={16} className="text-[#fbbf24]" />
                                    {isAr ? 'اختر نافذة الوصول الزمنية (Time Slot)' : 'Select Arrival Window'}
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {TIME_SLOTS.map((slot) => {
                                        const isSelected = formData.scheduledTime === slot.id;
                                        return (
                                            <div
                                                key={slot.id}
                                                onClick={() => setFormData(prev => ({ ...prev, scheduledTime: slot.id }))}
                                                className={`cursor-pointer p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xl'
                                                        : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clock size={18} className={isSelected ? 'text-[#fbbf24]' : 'text-gray-400'} />
                                                    <span className="text-xs font-black uppercase tracking-wider">
                                                        {isAr ? slot.labelAr : slot.labelEn}
                                                    </span>
                                                </div>
                                                {isSelected && <Check size={16} strokeWidth={3} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="py-4 px-6 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} className={isAr ? 'rotate-180' : ''} />
                                    <span>{isAr ? 'السابق' : 'Back'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="py-4 px-8 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl"
                                >
                                    <span>{isAr ? 'التالي: مراجعة وتأكيد' : 'Review & Confirm'}</span>
                                    <ArrowRight size={16} className={isAr ? 'rotate-180' : ''} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: TECHNICAL NOTES & DISPATCH ── */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-[3rem] p-8 md:p-12 border border-gray-100 dark:border-white/5 shadow-2xl space-y-8"
                        >
                            {/* Summary Review Card */}
                            <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#fbbf24]">
                                    <Shield size={16} />
                                    <span>{isAr ? 'ملخص الحجز الفني' : 'Concierge Intake Summary'}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <span className="text-gray-400 uppercase font-bold block">{isAr ? 'السيارة' : 'Vehicle'}</span>
                                        <p className="font-black text-black dark:text-white mt-0.5">{selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.license_plate})</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 uppercase font-bold block">{isAr ? 'باقة الخدمة' : 'Service Type'}</span>
                                        <p className="font-black text-black dark:text-white mt-0.5">{isAr ? selectedCategory?.ar : selectedCategory?.en}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 uppercase font-bold block">{isAr ? 'الموعد المحدد' : 'Scheduled Arrival'}</span>
                                        <p className="font-black text-black dark:text-white mt-0.5 font-mono">{formData.scheduledDate} @ {formData.scheduledTime}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <FileText size={16} className="text-[#fbbf24]" />
                                    {isAr ? 'ملاحظات إضافية أو أعطال تود الإبلاغ عنها' : 'Additional Notes / Symptoms to inspect'}
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder={isAr ? 'مثال: يرجى فحص صوت صفارة في العجلات الأمامية وضغط الإطارات...' : 'e.g. Please check slight squeak in front brakes and top up windshield washer fluid...'}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-medium text-black dark:text-white outline-none focus:ring-2 focus:ring-[#fbbf24]"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="py-4 px-6 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} className={isAr ? 'rotate-180' : ''} />
                                    <span>{isAr ? 'السابق' : 'Back'}</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="py-4 px-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:opacity-90 disabled:opacity-50 transition-all"
                                >
                                    <Sparkles size={16} />
                                    <span>{submitting ? (isAr ? 'جاري الإرسال...' : 'DISPATCHING...') : (isAr ? 'تأكيد الحجز فوراً' : 'CONFIRM VIP INTAKE')}</span>
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
