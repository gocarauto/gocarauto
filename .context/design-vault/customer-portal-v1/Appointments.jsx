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
    'Completed':   { icon: CheckCircle2, cls: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',  label: 'Completed' },
    'In Progress': { icon: Wrench,       cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',      label: 'In Progress' },
    'Pending':     { icon: Clock,        cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',  label: 'Pending' },
    'Scheduled':   { icon: ShieldCheck,  cls: 'bg-primary/10 text-primary',                                           label: 'Confirmed' },
};

const Appointments = () => {
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await api.get('/customer-portal/appointments');
                setAppointments(response.data.data);
            } catch (err) {
                console.error('Failed to retrieve appointments', err);
                setError('Could not load appointments. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);



    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>)}
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Duty Schedule</h1>
                    <p className="text-gray-400 dark:text-gray-500 font-bold tracking-tight">Track your upcoming workshop arrivals.</p>
                </div>
                <button
                    onClick={() => navigate('/book-service')}
                    className="bg-primary text-black px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none"
                >
                    + Book New Service
                </button>
            </header>

            {error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-3xl">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {appointments.map((apt, idx) => {
                    const statusInfo = STATUS_STYLE[apt.status] || STATUS_STYLE['Scheduled'];
                    const StatusIcon = statusInfo.icon;
                    return (
                        <motion.div
                            key={apt.id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-100 dark:border-white/5 p-10 shadow-xl group hover:shadow-2xl transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-black/40 rounded-[2rem] flex items-center justify-center text-primary group-hover:scale-110 duration-500 shrink-0">
                                    <Calendar size={36} />
                                </div>

                                <div className="flex-1 space-y-5">
                                    <div>
                                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter mb-1">
                                            {apt.make} {apt.model} {apt.year}
                                        </h3>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary">
                                                <Wrench size={12} /> {apt.service_type || 'General Service'}
                                            </div>
                                            <span className="text-gray-300 dark:text-gray-700">|</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{apt.license_plate}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-white/5">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1"><Calendar size={10}/> Date</span>
                                            <p className="text-sm font-black text-black dark:text-white uppercase tracking-tight">
                                                {formatDate(apt.scheduled_date)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1"><Clock size={10}/> Time</span>
                                            <p className="text-sm font-black text-black dark:text-white uppercase tracking-tight">
                                                {apt.scheduled_time || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${statusInfo.cls}`}>
                                            <StatusIcon size={14} /> {statusInfo.label}
                                        </div>
                                        {apt.notes && (
                                            <p className="text-xs text-gray-400 font-bold truncate max-w-[160px]">{apt.notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {!error && appointments.length === 0 && (
                    <div className="col-span-1 md:col-span-2 p-20 text-center bg-gray-50/50 dark:bg-white/[0.02] rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-black/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-gray-300">
                            <Clock size={40} />
                        </div>
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">No Scheduled Appointments</h3>
                        <p className="text-gray-400 dark:text-gray-500 max-w-sm mx-auto text-xs font-bold leading-relaxed mb-8">
                            Your workshop arrival schedule is currently clear. Book a new service to get started.
                        </p>
                        <button
                            onClick={() => navigate('/book-service')}
                            className="bg-primary text-black px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            Book a Service
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Appointments;
