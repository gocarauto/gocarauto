import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatDate } from '../utils/dateUtils';
import {
    Calendar,
    Clock,
    Car,
    ShieldCheck,
    ChevronRight,
    Wrench,
    AlertCircle,
    CheckCircle2,
    Plus
} from 'lucide-react';

const STATUS_STYLE = {
    'Completed':   { icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', labelEn: 'Completed', labelAr: 'مكتمل' },
    'In Progress': { icon: Wrench,       cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',                 labelEn: 'In Workshop', labelAr: 'قيد الصيانة' },
    'Pending':     { icon: Clock,        cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',           labelEn: 'Pending Review', labelAr: 'قيد المراجعة' },
    'Scheduled':   { icon: ShieldCheck,  cls: 'bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/30',           labelEn: 'Confirmed Slot', labelAr: 'موعد مؤكد' },
};

const Appointments = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await api.get('/customer-portal/appointments');
                setAppointments(response.data?.data || []);
            } catch (err) {
                console.error('Failed to retrieve appointments', err);
                setError(isAr ? 'تعذر جلب المواعيد. يرجى إعادة المحاولة.' : 'Could not load appointments. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [isAr]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-16 max-w-5xl">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                        {isAr ? 'جدول مواعيد الصيانة' : 'Service Appointments'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'متابعة مواعيد وصول سياراتك لمركز الخدمة والباكيات المحجوزة' : 'Track your upcoming workshop arrivals, bay allocations, and intake status'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/book-service')}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
                >
                    <Plus size={16} />
                    <span>{isAr ? 'حجز موعد جديد' : 'New Appointment'}</span>
                </button>
            </header>

            {error && (
                <div className="flex items-center gap-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 p-4 rounded-xl text-xs font-semibold">
                    <AlertCircle size={18} />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((apt, idx) => {
                    const statusInfo = STATUS_STYLE[apt.status] || STATUS_STYLE['Scheduled'];
                    const StatusIcon = statusInfo.icon;
                    return (
                        <motion.div
                            key={apt.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, delay: idx * 0.04 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-slate-950 dark:text-white truncate">
                                            {apt.make} {apt.model}
                                        </h3>
                                        <span className="text-xs font-medium text-slate-500">
                                            {apt.year}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-mono text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06]">
                                            {apt.license_plate || 'No Plate'}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-amber-500 font-semibold truncate">
                                            {apt.service_type || 'General Service'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${statusInfo.cls}`}>
                                    <StatusIcon size={13} />
                                    <span>{isAr ? statusInfo.labelAr : statusInfo.labelEn}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-xs">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        {isAr ? 'التاريخ' : 'Date'}
                                    </span>
                                    <p className="font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                                        {formatDate(apt.scheduled_date)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        {isAr ? 'الوقت' : 'Arrival Slot'}
                                    </span>
                                    <p className="font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                                        {apt.scheduled_time || '—'}
                                    </p>
                                </div>
                            </div>

                            {apt.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-white/[0.02] p-2.5 rounded-lg border border-slate-200/40 dark:border-white/[0.04]">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'ملاحظات: ' : 'Notes: '}</span>
                                    {apt.notes}
                                </p>
                            )}
                        </motion.div>
                    );
                })}

                {!error && appointments.length === 0 && (
                    <div className="col-span-full py-16 px-6 text-center bg-white dark:bg-[#0c0d12] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08] space-y-4">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                            <Clock size={28} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-950 dark:text-white">
                                {isAr ? 'لا توجد مواعيد صيانة مجدولة' : 'No Scheduled Appointments'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                {isAr 
                                    ? 'جدول مركز الخدمة فارغ حالياً بالنسبة لمركباتك. يمكنك حجز موعد فحص دوري في أي وقت.'
                                    : 'Your maintenance schedule is clear. Book an intake slot whenever your vehicle needs service.'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/book-service')}
                            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                        >
                            <Plus size={16} />
                            <span>{isAr ? 'حجز موعد صيانة' : 'Book Appointment'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Appointments;
