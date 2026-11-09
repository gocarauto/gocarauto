import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { X, DollarSign, Gauge, Tag, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

const SellCarModal = ({ isOpen, onClose, vehicle, onSuccess }) => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';

    const [askingPrice, setAskingPrice] = useState('');
    const [currentMileage, setCurrentMileage] = useState(vehicle?.current_mileage || '');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen || !vehicle) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/customer-portal/sell-requests', {
                vehicleId: vehicle.id,
                askingPrice: askingPrice ? parseFloat(askingPrice) : null,
                currentMileage: currentMileage ? parseInt(currentMileage, 10) : vehicle.current_mileage,
                notes
            });

            if (res.data?.success) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                    if (onSuccess) onSuccess();
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to submit sell request:', err);
            setError(err.response?.data?.error || (isAr ? 'فشل إرسال طلب البيع، برجاء المحاولة لاحقاً' : 'Failed to submit consignment request'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm cursor-pointer"
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !loading) onClose();
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 20 }}
                    transition={{ duration: 0.18 }}
                    className="relative w-full max-w-lg bg-white dark:bg-[#0c0d12] border-t sm:border border-slate-200/80 dark:border-white/[0.08] rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl text-slate-900 dark:text-white cursor-default max-h-[92vh] overflow-y-auto"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="absolute top-5 ltr:right-5 rtl:left-5 p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>

                    {success ? (
                        <div className="py-8 text-center space-y-3">
                            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                                {isAr ? 'تم استلام طلب الوساطة بنجاح' : 'Consignment Request Received'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                                {isAr
                                    ? 'سيتواصل معك فريق مبيعات جوكار لتحديد موعد المعاينة والتصوير وبدء الترويج لسيارتك بأمان تام.'
                                    : 'Our sales desk will contact you to schedule inspection, certified photography, and start marketing your vehicle.'}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Header */}
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-400/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-400/20 mb-2">
                                    <Tag size={13} />
                                    <span>{isAr ? 'خدمة وساطة السيارات • جوكار' : 'GoCar Brokerage Concierge'}</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
                                    {isAr ? 'طلب وساطة بيع المركبة' : 'List Vehicle for Consignment'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {vehicle.make} {vehicle.model} {vehicle.year} ({vehicle.license_plate || '—'})
                                </p>
                            </div>

                            {/* Trust Badge */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300">
                                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                                <span>{isAr ? 'عمولة رمزية ٢.٥٪ فقط عند إتمام البيع مع فحص فني معتمد مجاني.' : '2.5% success commission only upon sale, including certified inspection.'}</span>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        {isAr ? 'السعر المطلوب (ج.م)' : 'Asking Price (EGP)'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            min="1000"
                                            step="500"
                                            value={askingPrice}
                                            onChange={(e) => setAskingPrice(e.target.value)}
                                            placeholder={isAr ? 'مثال: ٦٥٠,٠٠٠' : 'e.g. 650000'}
                                            className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                        <span className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                                            {isAr ? 'ج.م' : 'EGP'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        {isAr ? 'قراءة العداد الحالية (كم)' : 'Current Odometer (km)'}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={currentMileage}
                                        onChange={(e) => setCurrentMileage(e.target.value)}
                                        placeholder="e.g. 85000"
                                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        {isAr ? 'ملاحظات وحالة المركبة' : 'Vehicle Notes & Condition'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={isAr ? 'فابريكا بالكامل، صيانات توكيل منتظمة، كاوتش وبطارية بحالة ممتازة...' : 'e.g. Full dealer service history, clean title, new tires installed...'}
                                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                                    <AlertCircle size={15} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    {isAr ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            <span>{isAr ? 'جاري الإرسال...' : 'Submitting...'}</span>
                                        </>
                                    ) : (
                                        <span>{isAr ? 'إرسال طلب البيع' : 'Submit Listing'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SellCarModal;
