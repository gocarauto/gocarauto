import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    CalendarCheck,
    CheckCircle,
    Car,
    Settings,
    MessageSquare,
    Send,
    Loader2,
    Clock,
    Shield,
    X
} from 'lucide-react';
import api from '../utils/api';

const SERVICE_TYPES = [
    { id: 'صيانة دورية داخل التوكيل', label: 'صيانة دورية داخل التوكيل', labelEn: 'Routine Maintenance (Agency)' },
    { id: 'صيانة دورية خارج التوكيل', label: 'صيانة دورية خارج التوكيل', labelEn: 'Routine Maintenance (Independent)' },
    { id: 'تصليح أعطال', label: 'تصليح أعطال', labelEn: 'Repair Faults' },
    { id: 'كشف على السيارة للسفر', label: 'كشف على السيارة للسفر', labelEn: 'Pre-Travel Inspection' },
    { id: 'طلب قطع غيار', label: 'طلب قطع غيار', labelEn: 'Spare Parts Request' },
];

const ServiceBooking = () => {
    const { user } = useAuth();
    const { t, lang } = useLanguage();
    const { darkMode } = useTheme();
    const [searchParams] = useSearchParams();
    const paramVehicleId = searchParams.get('vehicleId');

    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({
        vehicleId: paramVehicleId || '',
        serviceType: 'صيانة دورية داخل التوكيل',
        notes: '',
        scheduledDate: '',
        scheduledTime: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // WHY: Fetch full garage fleet from /customer-portal/vehicles and preselect URL vehicleId if passed
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/customer-portal/vehicles');
                const available = response.data.data || [];
                setVehicles(available);
                if (available.length > 0) {
                    const matched = paramVehicleId && available.find(v => String(v.id) === String(paramVehicleId));
                    setFormData(prev => ({ 
                        ...prev, 
                        vehicleId: matched ? matched.id : (prev.vehicleId || available[0].id) 
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch vehicles');
            }
        };
        fetchVehicles();
    }, [paramVehicleId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/service-requests', {
                clientId: user.id,
                vehicleId: formData.vehicleId,
                serviceType: formData.serviceType,
                notes: formData.notes,
                scheduledDate: formData.scheduledDate,
                scheduledTime: formData.scheduledTime,
                source: 'PORTAL_STITCH'
            });
            setTimeout(() => {
                setSuccess(true);
                setLoading(false);
            }, 2000);
        } catch (err) {
            alert('Transmission failed. Secure channel error.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
                <div className="bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-12 rounded-[3rem] shadow-2xl max-w-lg w-full relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-primary-dark"></div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8"
                    >
                        <CheckCircle size={40} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark mb-4 uppercase tracking-tighter">Mission Established</h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-10">
                        The workshop manifold has received your intake data. A concierge specialist will confirm your arrival sequence shortly.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        RETURN TO DASHBOARD
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tighter uppercase mb-2">Concierge Intake</h1>
                <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">Reserve your service appointment with precision.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Vehicle Selection */}
                <section>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark mb-6">
                        <Car size={14} /> Select Vehicle
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {vehicles.map(v => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, vehicleId: v.id })}
                                className={`flex-1 min-w-[200px] p-6 rounded-3xl border-2 transition-all flex items-center gap-4 text-left group ${formData.vehicleId === v.id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-4 ring-primary/10'
                                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-surface-light dark:bg-surface-dark'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.vehicleId === v.id ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                                    }`}>
                                    <Car size={24} />
                                </div>
                                <div>
                                    <p className={`font-black uppercase tracking-tighter leading-none mb-1 ${formData.vehicleId === v.id ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                                        {v.make} {v.model}
                                    </p>
                                    <p className="text-xs text-text-secondary-light font-bold">{v.license_plate}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Service Type */}
                <section>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark mb-6">
                        <Settings size={14} /> {lang === 'ar' ? 'نوع الخدمة' : 'Service Nature'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SERVICE_TYPES.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, serviceType: type.id })}
                                className={`py-4 px-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest text-left ${formData.serviceType === type.id
                                        ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg'
                                        : 'border-gray-100 dark:border-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {lang === 'ar' ? type.label : type.labelEn}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Notes */}
                <section>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark mb-6">
                        <MessageSquare size={14} /> Additional Intelligence
                    </label>
                    <div className="relative">
                        <textarea
                            className="w-full bg-surface-light dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 text-text-primary-light dark:text-text-primary-dark focus:border-primary focus:ring-0 transition-all outline-none min-h-[120px] resize-none text-sm font-medium"
                            placeholder="Describe any symptoms, requirements, or special requests..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        ></textarea>
                    </div>
                </section>

                {/* Scheduling */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark ml-4">
                            <CalendarCheck size={14} /> Preferred Date
                        </label>
                        <input 
                            type="date"
                            value={formData.scheduledDate || ''}
                            onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                            className="w-full bg-surface-light dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 rounded-full py-4 px-8 text-sm font-bold text-black dark:text-white outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark ml-4">
                            <Clock size={14} /> Arrival Block
                        </label>
                        <select 
                            value={formData.scheduledTime || ''}
                            onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                            className="w-full bg-surface-light dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 rounded-full py-4 px-8 text-sm font-bold text-black dark:text-white outline-none focus:border-primary transition-all appearance-none"
                        >
                            <option value="">Select Time</option>
                            {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(time => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Footer / Submit */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4 text-text-secondary-light dark:text-text-secondary-dark">
                        <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                        <p className="text-xs font-bold leading-relaxed max-w-[240px]">
                            A specialist will review your request and confirm within <span className="text-primary">15 minutes</span>.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative overflow-hidden flex items-center gap-3 px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-primary/30 ${loading ? 'bg-gray-200 dark:bg-gray-800 text-gray-400' : 'bg-primary hover:bg-primary-dark text-black active:scale-95'
                            }`}
                    >
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3"
                                >
                                    <Loader2 className="animate-spin" size={20} />
                                    Transmitting...
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3"
                                >
                                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Confirm Appointment
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceBooking;
