import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Shield, Key, Mail, ArrowRight, Loader2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const { darkMode } = useTheme();
    const { lang, toggleLanguage } = useLanguage();
    const isAr = lang === 'ar';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const success = await login(email, password);
            if (!success) {
                setError(isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid security credentials');
            } else {
                navigate('/');
            }
        } catch {
            setError(isAr ? 'فشل الاتصال بالخادم. يرجى التحقق من الشبكة.' : 'Biometric/Network link failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden ${darkMode ? 'bg-[#070709]' : 'bg-[#f9fafb]'}`} dir={isAr ? 'rtl' : 'ltr'}>
            
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fbbf24]/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Language Toggle in corner */}
            <div className="absolute top-6 right-6 z-20">
                <button
                    onClick={toggleLanguage}
                    className="px-4 py-2 rounded-2xl bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-2 backdrop-blur-md transition-colors"
                >
                    <Globe size={15} />
                    <span>{lang === 'en' ? 'عربي' : 'English'}</span>
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[440px] relative z-10"
            >
                <div className="bg-white dark:bg-[#0c0d12] p-10 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden">
                    {/* Decorative Top Accent */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#d97706]"></div>

                    <div className="text-center mb-8">
                        <img 
                            src="/logo.png"
                            alt="GoCar Auto"
                            className="h-12 w-auto mx-auto mb-4 object-contain filter drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tighter uppercase font-display">
                            {isAr ? 'بوابة العميل المميز' : 'VIP Concierge Access'}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {isAr ? 'سجل متابعة سياراتك وخدماتك' : 'GoCar Auto Client Portal'}
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ltr:ml-3 rtl:mr-3">
                                {isAr ? 'رقم الهاتف أو البريد الإلكتروني' : 'Identifier (Phone or Email)'}
                            </label>
                            <div className="relative group">
                                <Mail className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#fbbf24] transition-colors" size={17} />
                                <input
                                    type="text"
                                    placeholder={isAr ? '010... أو your@email.com' : '010... or your@email.com'}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 focus:border-[#fbbf24]/50 rounded-2xl py-4 ltr:pl-14 rtl:pr-14 px-6 text-xs font-medium outline-none transition-all dark:text-white"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ltr:ml-3 rtl:mr-3">
                                {isAr ? 'كلمة المرور' : 'Security Passcode'}
                            </label>
                            <div className="relative group">
                                <Key className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#fbbf24] transition-colors" size={17} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 focus:border-[#fbbf24]/50 rounded-2xl py-4 ltr:pl-14 rtl:pr-14 px-6 text-xs font-medium outline-none transition-all dark:text-white"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-widest mt-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <span>{isAr ? 'تسجيل الدخول' : 'AUTHENTICATE'}</span>
                                    <ArrowRight size={16} className={`group-hover:translate-x-1 transition-transform ${isAr ? 'rotate-180' : ''}`} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-100 dark:border-white/5 pt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">
                            {isAr ? 'قناة اتصال مشفرة وآمنة' : 'Encrypted VIP Session'}
                        </p>
                        <div className="flex justify-center gap-1.5 opacity-30">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"></div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
