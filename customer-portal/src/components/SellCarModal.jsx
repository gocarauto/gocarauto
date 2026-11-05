import React, { useState } from 'react';
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
                }, 2200);
            }
        } catch (err) {
            console.error('Failed to submit sell request:', err);
            setError(err.response?.data?.error || (isAr ? 'فشل إرسال طلب البيع، برجاء المحاولة لاحقاً' : 'Failed to submit sale request'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[#0e1017] border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-white overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#fbbf24]/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="absolute top-6 ltr:right-6 rtl:left-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {success ? (
                        <div className="py-12 text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto"
                            >
                                <CheckCircle2 size={36} />
                            </motion.div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                                {isAr ? 'تم استلام طلبك بنجاح!' : 'Request Received!'}
                            </h3>
                            <p className="text-sm text-gray-300 max-w-sm mx-auto leading-relaxed">
                                {isAr
                                    ? 'سيتواصل معك فريق جوكار لتحديد موعد المعاينة والتصوير وبدء الترويج لسيارتك بأعلى سعر وبأمان تام.'
                                    : 'The GoCar team will contact you shortly to schedule inspection, professional photography, and start marketing your vehicle.'}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Header */}
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/10 text-[#fbbf24] text-[10px] font-black uppercase tracking-widest mb-3 border border-[#fbbf24]/20">
                                    <Tag size={12} />
                                    <span>{isAr ? 'خدمة بيع السيارات • جوكار' : 'GoCar Brokerage Concierge'}</span>
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">
                                    {isAr ? 'طلب بيع السيارة عبر جوكار' : 'Sell Your Car with GoCar'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {isAr
                                        ? 'نحن نتكفل بالتصوير، فحص المشترين، والبيع بدون اتصالات مزعجة أو فصال.'
                                        : 'We manage photography, verified listings, buyer screening, and closing.'}
                                </p>
                            </div>

                            {/* Selected Vehicle Card */}
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 className="font-black text-sm uppercase text-white">
                                        {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                                    </h4>
                                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                        {vehicle.license_plate || vehicle.vin || '—'}
                                    </p>
                                </div>
                                <div className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-right">
                                    <span className="text-[9px] text-gray-400 uppercase font-bold block">{isAr ? 'عداد الكيلومترات' : 'Odometer'}</span>
                                    <span className="text-xs font-mono font-bold text-[#fbbf24]">
                                        {(vehicle.current_mileage || 0).toLocaleString()} km
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle size={15} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Form Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <DollarSign size={13} className="text-[#fbbf24]" />
                                        <span>{isAr ? 'السعر المتوقع المطلوب (ج.م)' : 'Desired Target Price (EGP)'}</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder={isAr ? 'مثال: 550000' : 'e.g. 550000'}
                                        value={askingPrice}
                                        onChange={(e) => setAskingPrice(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#fbbf24] transition-all text-white placeholder-gray-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <Gauge size={13} className="text-[#fbbf24]" />
                                        <span>{isAr ? 'قراءة العداد الحالية (كم)' : 'Current Mileage (km)'}</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={currentMileage}
                                        onChange={(e) => setCurrentMileage(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#fbbf24] transition-all text-white placeholder-gray-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                                        {isAr ? 'ملاحظات إضافية عن السيارة' : 'Additional Vehicle Notes'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder={isAr ? 'حالة الدهان، الكاوتش، التراخيص أو أي كماليات تم تركيبها...' : 'Paint condition, tires, license validity, or upgrades...'}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-[#fbbf24] transition-all text-white placeholder-gray-500 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Trust Badge */}
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-400">
                                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                                <span>
                                    {isAr
                                        ? 'سيتم تدعيم إعلان البيع بسجل الصيانة المعتمد الخاص بسيارتك لرفع قيمتها السوقية.'
                                        : 'Your verified maintenance history will be highlighted to maximize buyer confidence and value.'}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 transition-colors"
                                >
                                    {isAr ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[#fbbf24]/20 flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{isAr ? 'جارِ الإرسال...' : 'Sending...'}</span>
                                        </>
                                    ) : (
                                        <span>{isAr ? 'إرسال طلب البيع' : 'Submit Sale Request'}</span>
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
