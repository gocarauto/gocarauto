import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    CheckCircle2
} from 'lucide-react';

const STATUS_STYLE = {
    'Completed':   { icon: CheckCircle2, cls: 'bg-green-500/10 text-green-500 border border-green-500/20',  labelEn: 'Completed', labelAr: 'مكتمل' },
    'In Progress': { icon: Wrench,       cls: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',      labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
    'Pending':     { icon: Clock,        cls: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',  labelEn: 'Pending Review', labelAr: 'قيد المراجعة' },
    'Scheduled':   { icon: ShieldCheck,  cls: 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30',  labelEn: 'Confirmed Slot', labelAr: 'موعد مؤكد' },
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
            <div className="space-y-6 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-44 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>)}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-5xl">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tighter">
                        {isAr ? 'جدول مواعيد الصيانة' : 'VIP Duty Schedule'}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {isAr ? 'متابعة مواعيد وصول سياراتك لمركز الخدمة' : 'Track your upcoming workshop arrivals & bay allocations'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/book-service')}
                    className="bg-[#fbbf24] hover:bg-[#f59e0b] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
                >
                    {isAr ? '+ حجز موعد جديد' : '+ Book VIP Intake'}
                </button>
            </header>

            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 text-red-500 border border-red-500/20 p-5 rounded-2xl">
                    <AlertCircle size={20} />
                    <p className="text-xs font-bold">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map((apt, idx) => {
                    const statusInfo = STATUS_STYLE[apt.status] || STATUS_STYLE['Scheduled'];
                    const StatusIcon = statusInfo.icon;
                    return (
                        <motion.div
                            key={apt.id || idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-xl group hover:border-[#fbbf24]/40 transition-all relative overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-[#fbbf24] group-hover:scale-110 duration-300 shrink-0 border border-gray-100 dark:border-white/5">
                                    <Calendar size={28} />
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div>
                                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight leading-snug">
                                            {apt.make} {apt.model} {apt.year}
                                        </h3>
                                        <div className="flex items-center gap-3 flex-wrap mt-1">
                                            <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#fbbf24]">
                                                <Wrench size={12} /> {apt.service_type || 'General Service'}
                                            </div>
                                            <span className="text-gray-300 dark:text-gray-700">|</span>
                                            <span className="text-[10px] font-mono font-bold uppercase text-gray-400">{apt.license_plate}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                                <Calendar size={10}/> {isAr ? 'التاريخ' : 'Date'}
                                            </span>
                                            <p className="text-xs font-mono font-black text-black dark:text-white uppercase">
                                                {formatDate(apt.scheduled_date)}
                                            </p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                                <Clock size={10}/> {isAr ? 'الوقت' : 'Time'}
                                            </span>
                                            <p className="text-xs font-mono font-black text-black dark:text-white uppercase">
                                                {apt.scheduled_time || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusInfo.cls}`}>
                                            <StatusIcon size={12} /> {isAr ? statusInfo.labelAr : statusInfo.labelEn}
                                        </div>
                                        {apt.notes && (
                                            <p className="text-xs text-gray-400 font-medium truncate max-w-[140px]" title={apt.notes}>{apt.notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {!error && appointments.length === 0 && (
                    <div className="col-span-full p-16 text-center bg-white dark:bg-[#0c0d12] rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-400">
                            <Clock size={36} />
                        </div>
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight mb-2">
                            {isAr ? 'لا توجد مواعيد صيانة مجدولة' : 'No Scheduled Appointments'}
                        </h3>
                        <p className="text-gray-400 max-w-sm mx-auto text-xs leading-relaxed mb-6 font-medium">
                            {isAr 
                                ? 'جدول ورش العمل فارغ حالياً بالنسبة لسياراتك. يمكنك حجز موعد جديد في أي وقت.'
                                : 'Your workshop arrival schedule is currently clear. Book a VIP concierge slot to get started.'}
                        </p>
                        <button
                            onClick={() => navigate('/book-service')}
                            className="bg-[#fbbf24] text-black px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                        >
                            {isAr ? 'حجز موعد صيانة' : 'Book a VIP Service'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Appointments;
