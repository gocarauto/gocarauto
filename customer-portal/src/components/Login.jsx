import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Loader2, Globe, Sun, Moon, Eye, EyeOff, User, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage } = useLanguage();
    const isAr = lang === 'ar';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                setError(isAr ? 'بيانات الدخول غير صحيحة. يرجى التحقق وإعادة المحاولة.' : 'Invalid credentials. Please verify your email/phone and password.');
            } else {
                navigate('/');
            }
        } catch {
            setError(isAr ? 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الشبكة.' : 'Connection to server failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    const navigateToStaff = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.location.href = 'http://localhost:5173/login';
        } else {
            window.location.href = 'https://gocarauto-3kpg.vercel.app/login';
        }
    };

    return (
        <div 
            className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 relative overflow-hidden font-sans ${darkMode ? 'bg-[#07080c] text-slate-100' : 'bg-slate-50 text-slate-900'}`} 
            dir={isAr ? 'rtl' : 'ltr'}
        >
            {/* Automotive Technical CAD Blueprint Grid Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06]"
                style={{
                    backgroundImage: 'linear-gradient(to right, #fbbf24 1px, transparent 1px), linear-gradient(to bottom, #fbbf24 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Automotive Showroom Spotlight Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#fbbf24]/12 via-[#f59e0b]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Subtle Vehicle Wireframe Watermark */}
            <div 
                className="absolute -bottom-16 -right-16 w-[520px] h-[520px] bg-no-repeat bg-contain opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none mix-blend-screen"
                style={{ backgroundImage: 'url(/vehicle-sketch-bg.png)' }}
            />

            {/* Quick Actions Bar (Language & Theme) */}
            <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 flex items-center gap-2">
                <button
                    onClick={toggleLanguage}
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-2 backdrop-blur-md shadow-sm transition-all hover:border-[#fbbf24]/40"
                    title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
                >
                    <Globe size={14} className="text-[#fbbf24]" />
                    <span>{lang === 'en' ? 'عربي' : 'English'}</span>
                </button>
                <button
                    onClick={toggleTheme}
                    type="button"
                    className="p-2 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white backdrop-blur-md shadow-sm transition-all hover:border-[#fbbf24]/40"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
                </button>
            </div>

            {/* Consolidated Login Terminal Card */}
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[450px] relative z-10"
            >
                <div className="bg-white/95 dark:bg-[#0d1017]/95 backdrop-blur-2xl p-7 sm:p-10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
                    
                    {/* Glowing Amber Top Accent Strip */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent opacity-90" />

                    {/* Brand Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 mb-4 shadow-inner">
                            <img 
                                src="/logo.png"
                                alt="GoCar Auto"
                                className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">
                            {isAr ? 'أهلاً بك في جوكار أوتو' : 'Welcome to GoCar Auto'}
                        </h1>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                            {isAr ? 'بوابة إدارة المركبات وسجل الصيانة' : 'Customer Fleet & Service Portal'}
                        </p>
                    </div>

                    {/* Segmented Consolidated Portal Switcher */}
                    <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl mb-6 text-xs font-bold">
                        <div className="py-2.5 px-3 rounded-xl bg-[#fbbf24] text-slate-950 font-black shadow-sm flex items-center justify-center gap-2 select-none">
                            <User size={14} className="stroke-[2.5]" />
                            <span>{isAr ? 'بوابة العملاء' : 'Customer'}</span>
                        </div>
                        <button
                            type="button"
                            onClick={navigateToStaff}
                            className="py-2.5 px-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Wrench size={14} />
                            <span>{isAr ? 'فريق العمل' : 'Staff Portal'}</span>
                        </button>
                    </div>

                    {/* Error Notice */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 rounded-2xl text-xs font-semibold mb-6 flex items-start gap-2.5"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1 animate-pulse" />
                            <span className="leading-relaxed">{error}</span>
                        </motion.div>
                    )}

                    {/* Authentication Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1 flex items-center gap-1.5">
                                <Mail size={12} className="text-[#fbbf24]" />
                                <span>{isAr ? 'رقم الهاتف أو البريد الإلكتروني' : 'Mobile Number or Email'}</span>
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder={isAr ? '010... أو your@email.com' : 'e.g. 010... or name@example.com'}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="username"
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:border-[#fbbf24] focus:ring-2 focus:ring-[#fbbf24]/20 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1 flex items-center gap-1.5">
                                <Lock size={12} className="text-[#fbbf24]" />
                                <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:border-[#fbbf24] focus:ring-2 focus:ring-[#fbbf24]/20 rounded-2xl py-3.5 ltr:pr-11 rtl:pl-11 px-4 text-sm font-medium outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute ltr:right-3.5 rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-widest mt-3 cursor-pointer"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin text-slate-950" size={18} />
                            ) : (
                                <>
                                    <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                                    <ArrowRight size={16} className={`group-hover:translate-x-1 transition-transform ${isAr ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Footer Notice */}
                    <div className="mt-7 text-center border-t border-slate-100 dark:border-white/5 pt-5">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            <Shield size={13} className="text-[#fbbf24]" />
                            <span>{isAr ? 'اتصال مشفر وآمن بالكامل 256-Bit SSL' : 'Secure 256-Bit SSL Encrypted Connection'}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
