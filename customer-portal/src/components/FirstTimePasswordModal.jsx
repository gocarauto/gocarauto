import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff, Smartphone, CheckCircle2, AlertCircle, Loader2, Sparkles, KeyRound } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const FirstTimePasswordModal = ({ isOpen = true }) => {
    const { user, updateUser } = useAuth();
    const { lang } = useLanguage();
    const isAr = lang === 'ar';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const rawPhone = (user?.phone || user?.mobile || '').toString().trim();
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const localPhone = (cleanDigits.startsWith('201') && cleanDigits.length === 12)
        ? `0${cleanDigits.substring(2)}`
        : (cleanDigits.startsWith('01') && cleanDigits.length === 11)
            ? cleanDigits
            : rawPhone;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password || password.length < 6) {
            setError(
                isAr
                    ? 'يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل'
                    : 'Password must be at least 6 characters long'
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                isAr
                    ? 'كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة المحاولة'
                    : 'Passwords do not match. Please re-check and try again.'
            );
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/customer-portal/set-initial-password', { password });
            if (res.data?.success) {
                setSuccess(true);
                setTimeout(() => {
                    updateUser({ hasPassword: true });
                }, 1400);
            } else {
                setError(res.data?.error || (isAr ? 'حدث خطأ أثناء حفظ كلمة المرور' : 'Failed to set password'));
            }
        } catch (err) {
            const serverMsg = err.response?.data?.error;
            setError(
                serverMsg ||
                (isAr
                    ? 'تعذر الاتصال بالخادم لحفظ كلمة المرور. يرجى المحاولة مرة أخرى.'
                    : 'Could not connect to server. Please try again.')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
                dir={isAr ? 'rtl' : 'ltr'}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 16 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-[#0e1017] border border-amber-400/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(251,191,36,0.15)] relative overflow-hidden"
                >
                    {/* Atmospheric Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-10 text-center space-y-5"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <CheckCircle2 size={44} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white tracking-tight">
                                    {isAr ? 'تم تأمين حسابك بنجاح! 🎉' : 'Account Secured Successfully! 🎉'}
                                </h3>
                                <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                                    {isAr
                                        ? 'تم حفظ كلمة المرور الخاصة بك. جاري نقلك إلى مرآب سياراتك...'
                                        : 'Your password has been established. Redirecting you to your garage...'}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 mb-1 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                                    <KeyRound size={28} className="stroke-[2.2]" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                    {isAr ? 'تعيين كلمة المرور لأول مرة' : 'Set Your Personal Password'}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                                    {isAr
                                        ? 'مرحباً بك في جوكار أوتو! لتأمين وصولك إلى المرآب، يرجى تعيين كلمة مرور قوية لحسابك.'
                                        : 'Welcome to GoCar Auto! To secure continuous access to your garage, please create your password.'}
                                </p>
                            </div>

                            {/* Username Callout Box (Crucial Notice) */}
                            <div className="p-4 rounded-2xl bg-amber-400/[0.08] border border-amber-400/30 space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                                    <Smartphone size={16} />
                                    <span>
                                        {isAr ? 'اسم المستخدم لتسجيل الدخول مستقبلاً:' : 'Your Future Login Username:'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-black/40 px-3.5 py-2.5 rounded-xl border border-white/10">
                                    <div>
                                        <span className="font-mono text-base font-bold text-white tracking-wider tabular-nums block">
                                            {localPhone || rawPhone || (isAr ? 'رقم هاتفك المسجل' : 'Registered Mobile Number')}
                                        </span>
                                        {rawPhone && localPhone && rawPhone !== localPhone && (
                                            <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                                                {rawPhone}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-semibold text-amber-400/90 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 shrink-0">
                                        {isAr ? 'رقم الهاتف' : 'Mobile Phone'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-normal">
                                    {isAr
                                        ? '💡 ستستخدم رقم هاتفك هذا دائماً كاسم مستخدم مع كلمة المرور الجديدة لتسجيل الدخول.'
                                        : '💡 You will use this mobile number as your username together with your new password.'}
                                </p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
                                >
                                    <AlertCircle size={16} className="shrink-0 text-rose-400" />
                                    <span className="leading-snug">{error}</span>
                                </motion.div>
                            )}

                            {/* Password Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* New Password Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock size={13} className="text-amber-400" />
                                        <span>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={isAr ? 'أدخل 6 أحرف أو أرقام على الأقل' : 'Enter at least 6 characters'}
                                            className="w-full h-12 bg-black/50 border border-white/10 focus:border-amber-400 rounded-xl px-4 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                                            autoComplete="new-password"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck size={13} className="text-amber-400" />
                                        <span>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder={isAr ? 'أعد كتابة كلمة المرور للتأكيد' : 'Re-enter your password'}
                                            className="w-full h-12 bg-black/50 border border-white/10 focus:border-amber-400 rounded-xl px-4 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                                            autoComplete="new-password"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !password || !confirmPassword}
                                    className="w-full h-13 mt-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(251,191,36,0.25)] hover:shadow-[0_0_35px_rgba(251,191,36,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>{isAr ? 'جاري الحفظ...' : 'Securing Account...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            <span>{isAr ? 'تأكيد كلمة المرور والدخول' : 'Set Password & Enter Garage'}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FirstTimePasswordModal;
