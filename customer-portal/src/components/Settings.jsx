import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import {
    User,
    Mail,
    Phone,
    Shield,
    Globe,
    Moon,
    Sun,
    Save,
    Key,
    Smartphone,
    Languages,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';

const Settings = () => {
    const { user, setAuth } = useAuth();
    const { lang, toggleLanguage } = useLanguage();
    const { darkMode, toggleTheme } = useTheme();
    const isAr = lang === 'ar';

    const [formData, setFormData] = useState({
        full_name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || user?.mobile || '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    React.useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.name || '',
                email: user.email || '',
                phone: user.phone || user.mobile || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.put('/customer-portal/profile', formData);
            if (user && setAuth) {
                const token = localStorage.getItem('token');
                setAuth(token, {
                    ...user,
                    name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    mobile: formData.phone
                });
            }
            setMessage(isAr ? 'تم تحديث بيانات الحساب بنجاح.' : 'Profile settings updated successfully.');
        } catch {
            setError(isAr ? 'حدث خطأ أثناء حفظ التعديلات.' : 'Failed to update profile settings.');
        } finally {
            setLoading(false);
            setTimeout(() => {
                setMessage('');
                setError('');
            }, 3000);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMessage('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError(isAr ? 'كلمتا المرور غير متطابقتين.' : 'New passwords do not match.');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError(isAr ? 'يجب أن لا تقل كلمة المرور عن 6 أحرف.' : 'Password must be at least 6 characters.');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put('/customer-portal/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMessage(isAr ? 'تم تحديث كلمة المرور بنجاح.' : 'Password updated successfully.');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordError(err.response?.data?.error || (isAr ? 'فشل تحديث كلمة المرور.' : 'Failed to update password.'));
        } finally {
            setPasswordLoading(false);
            setTimeout(() => {
                setPasswordMessage('');
                setPasswordError('');
            }, 3000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            
            {/* Header */}
            <header className="border-b border-slate-200/80 dark:border-white/[0.08] pb-5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                    {isAr ? 'إعدادات الحساب والتفضيلات' : 'Account & Preferences'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'تعديل بيانات الاتصال، تفضيلات العرض واللغة' : 'Manage your contact details, language, and interface theme'}
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Form (2 cols) */}
                <div className="lg:col-span-2 space-y-5">
                    <section className="bg-white dark:bg-[#0c0d12] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-8 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                            <div className="w-10 h-10 bg-amber-400/10 text-amber-500 rounded-xl flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                                    {isAr ? 'البيانات الشخصية' : 'Personal Information'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isAr ? 'بيانات التواصل لتأكيد المواعيد والفواتير' : 'Used for appointment confirmations and billing'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                            <div>
                                <label htmlFor="settings-full-name" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    {isAr ? 'الاسم بالكامل' : 'Full Name'}
                                </label>
                                <input
                                    id="settings-full-name"
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                    placeholder={isAr ? 'الاسم' : 'Full Name'}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="settings-email" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                                    </label>
                                    <input
                                        id="settings-email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="settings-phone" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        {isAr ? 'رقم الهاتف المحمول' : 'Phone Number'}
                                    </label>
                                    <input
                                        id="settings-phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                        placeholder="+20 1..."
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-semibold">
                                    <CheckCircle2 size={16} />
                                    <span>{message}</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-semibold">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="py-2.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Change Password Section */}
                    <section className="bg-white dark:bg-[#0c0d12] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-8 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                            <div className="w-10 h-10 bg-amber-400/10 text-amber-500 rounded-xl flex items-center justify-center">
                                <Key size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                                    {isAr ? 'الأمان وتغيير كلمة المرور' : 'Security & Password'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isAr ? 'قم بتحديث كلمة المرور الخاصة بحسابك لحمايته' : 'Update your personal passcode to keep your account safe'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                            <div>
                                <label htmlFor="settings-current-password" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
                                </label>
                                <input
                                    id="settings-current-password"
                                    type="password"
                                    required
                                    value={passwordData.currentPassword}
                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="settings-new-password" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                                    </label>
                                    <input
                                        id="settings-new-password"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="settings-confirm-password" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        {isAr ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
                                    </label>
                                    <input
                                        id="settings-confirm-password"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {passwordMessage && (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-semibold">
                                    <CheckCircle2 size={16} />
                                    <span>{passwordMessage}</span>
                                </div>
                            )}

                            {passwordError && (
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-semibold">
                                    <AlertCircle size={16} />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {passwordLoading ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            <span>{isAr ? 'جاري التحديث...' : 'Updating...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Key size={15} />
                                            <span>{isAr ? 'تحديث كلمة المرور' : 'Update Password'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>

                {/* Preference Sidebar (1 col) */}
                <div className="space-y-5">
                    <section className="bg-white dark:bg-[#0c0d12] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] pb-3">
                            {isAr ? 'تفضيلات الواجهة' : 'Display Preferences'}
                        </h3>
                        
                        <div className="space-y-2.5">
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] hover:border-amber-400 transition-all text-xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center">
                                        {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {isAr ? 'مظهر الواجهة' : 'Theme Mode'}
                                    </span>
                                </div>
                                <span className="font-semibold text-slate-500">
                                    {darkMode ? (isAr ? 'الوضع الليلي' : 'Dark') : (isAr ? 'الوضع النهاري' : 'Light')}
                                </span>
                            </button>

                            <button
                                onClick={toggleLanguage}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] hover:border-amber-400 transition-all text-xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-amber-400/10 text-amber-500 rounded-lg flex items-center justify-center">
                                        <Globe size={16} />
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {isAr ? 'لغة الواجهة' : 'Language'}
                                    </span>
                                </div>
                                <span className="font-semibold text-slate-500">
                                    {lang === 'en' ? 'English (LTR)' : 'العربية (RTL)'}
                                </span>
                            </button>
                        </div>
                    </section>

                    {/* Support Card */}
                    <section className="bg-slate-100 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] rounded-3xl p-6 text-center space-y-2">
                        <div className="w-10 h-10 bg-amber-400/10 text-amber-500 rounded-xl flex items-center justify-center mx-auto">
                            <Shield size={20} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {isAr ? 'حساب معتمد ومؤمن' : 'Verified Member Account'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {isAr
                                ? 'جميع بياناتك وفواتيرك ومستندات مركباتك مشفرة ومحمية وفق أعلى معايير الخصوصية.'
                                : 'All your vehicle telemetry, records, and digital documents are securely protected.'}
                        </p>
                    </section>
                </div>

            </div>
        </div>
    );
};

export default Settings;
