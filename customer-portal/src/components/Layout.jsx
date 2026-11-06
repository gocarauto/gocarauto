import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut,
    Globe,
    LayoutDashboard,
    FileText,
    Receipt,
    Calendar,
    Car,
    Settings,
    Bell,
    Moon,
    Sun,
    Search,
    Plus,
    FolderLock,
    Bot,
    Menu,
    X,
    ChevronRight,
    Wrench
} from 'lucide-react';
import DirectionSwitcher from './DirectionSwitcher';

const Layout = () => {
    const { user, logout } = useAuth();
    const { lang, toggleLanguage, t } = useLanguage();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    const isAr = lang === 'ar';

    const menuItems = [
        { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'vehicles', label: t('my_vehicles') || 'My Vehicles', icon: Car, path: '/vehicles' },
        { id: 'booking', label: t('booking') || 'Book Service', icon: Wrench, path: '/book-service' },
        { id: 'appointments', label: t('appointments') || 'Appointments', icon: Calendar, path: '/appointments' },
        { id: 'history', label: t('service_history') || 'Service Books', icon: FileText, path: '/history' },
        { id: 'invoices', label: t('invoices') || 'Invoices', icon: Receipt, path: '/invoices' },
        { id: 'glovebox', label: t('digital_glovebox') || 'Digital Glovebox', icon: FolderLock, path: '/glovebox' },
        { id: 'advisor', label: t('ai_advisor') || 'AI Advisor', icon: Bot, path: '/ai-advisor' },
        { id: 'settings', label: t('settings') || 'Settings', icon: Settings, path: '/settings' },
    ];

    const getPageTitle = () => {
        const p = location.pathname;
        if (p === '/') return t('dashboard');
        if (p.includes('history')) return t('service_history');
        if (p.includes('booking') || p.includes('book-service')) return t('booking');
        if (p.includes('glovebox')) return t('digital_glovebox') || (isAr ? 'الدرج الرقمي' : 'Digital Glovebox');
        if (p.includes('advisor')) return t('ai_advisor') || (isAr ? 'المستشار الذكي' : 'AI Advisor');
        if (p.includes('invoices')) return t('invoices');
        if (p.includes('appointments')) return t('appointments');
        if (p.includes('vehicles')) return t('my_vehicles');
        if (p.includes('settings')) return t('settings');
        return t('autolog');
    };

    const getPageSubtitle = () => {
        const p = location.pathname;
        if (p === '/') return isAr ? 'نظرة شاملة على أسطولك وصياناتك النشطة' : 'Concierge overview of your vehicle vitals and maintenance';
        if (p.includes('history')) return isAr ? 'السجل الرقمي الكامل لعمليات الفحص والصيانة' : 'Complete digital service ledger and inspection history';
        if (p.includes('booking') || p.includes('book-service')) return isAr ? 'حجز موعد صيانة جديد عبر باقاتنا المتخصصة' : 'Reserve a certified technician bay for your vehicle';
        if (p.includes('glovebox')) return isAr ? 'مستندات ورخص المركبات مؤمنة سحابياً' : 'Encrypted storage for vehicle licenses, insurance, and inspection certificates';
        if (p.includes('invoices')) return isAr ? 'كشوف الحساب والفواتير الضريبية المعتمدة' : 'Official VAT statements, service quotes, and payment receipts';
        return isAr ? 'إدارة دقيقة ومتكاملة لصيانة سياراتك' : 'Precision automotive fleet operations';
    };

    return (
        <div className={`h-screen overflow-hidden flex bg-slate-50 dark:bg-[#070709] text-slate-900 dark:text-slate-100 ${darkMode ? 'dark' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
            
            {/* ── Mobile Backdrop ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar (Operate Shell) ── */}
            <aside
                className={`w-[272px] bg-white dark:bg-[#0c0d12] border-slate-200/80 dark:border-white/[0.08] flex flex-col fixed inset-y-0 z-50 transition-transform duration-300 ease-out shadow-sm
                    ${isAr ? 'right-0 border-l' : 'left-0 border-r'}
                    ${mobileOpen ? 'translate-x-0 shadow-2xl' : isAr ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Brand Header */}
                <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06]">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img 
                            src="/logo.png"
                            alt="GoCar Auto"
                            className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden w-9 h-9 bg-amber-400 rounded-xl items-center justify-center text-black font-bold">
                            <Car size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-base tracking-tight text-slate-950 dark:text-white">GoCar Auto</span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isAr ? 'بوابة العميل' : 'Customer Portal'}</span>
                        </div>
                    </Link>

                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors"
                        aria-label="Close navigation"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Portal Navigation">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path === '/' 
                            ? location.pathname === '/' 
                            : location.pathname.startsWith(item.path);
                        
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                                    isActive
                                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} className={isActive ? 'text-slate-950 stroke-[2.2px]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} />
                                    <span>{item.label}</span>
                                </div>
                                {isActive && (
                                    <ChevronRight size={14} className={`text-slate-950/70 ${isAr ? 'rotate-180' : ''}`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Authenticated User Capsule */}
                <div className="p-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-500 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold text-sm shrink-0">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0) || 'C'
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate text-slate-900 dark:text-white">
                                    {user?.name || (isAr ? 'عميل مميز' : 'Customer')}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {user?.phone || user?.email || (isAr ? 'حساب معتمد' : 'Verified Member')}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={logout}
                            title={t('logout')}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                            aria-label={t('logout')}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Workspace Area ── */}
            <div className={`flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#070709] transition-colors duration-200
                ${isAr ? 'lg:pr-[272px] lg:pl-0' : 'lg:pl-[272px] lg:pr-0'}
            `}>
                
                {/* ── Top Header ── */}
                <header className="h-20 flex items-center justify-between px-4 sm:px-8 bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] sticky top-0 z-30">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>

                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white truncate">
                                {getPageTitle()}
                            </h1>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                                {getPageSubtitle()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Search Input */}
                        <div className={`hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border transition-all duration-150 ${
                            searchFocused 
                                ? 'w-64 border-amber-400 ring-2 ring-amber-400/20 bg-white dark:bg-[#12131a]' 
                                : 'w-48 border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.04]'
                        }`}>
                            <Search size={15} className="text-slate-400 shrink-0" />
                            <input 
                                type="text"
                                placeholder={t('search_placeholder')}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                className="bg-transparent border-none outline-none text-xs w-full text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                            <kbd className="hidden lg:inline-block text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-white/[0.08] px-1.5 py-0.5 rounded">
                                ⌘K
                            </kbd>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
                        </button>

                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
                        >
                            <Globe size={15} />
                            <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell size={17} />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#0c0d12]" />
                        </button>

                        {/* Primary Action Button */}
                        <Link
                            to="/book-service"
                            className="h-9 px-3.5 sm:px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                            <Plus size={15} strokeWidth={2.5} />
                            <span className="hidden sm:inline">{t('book_vip_service') || 'Book Service'}</span>
                            <span className="sm:hidden">{isAr ? 'حجز' : 'Book'}</span>
                        </Link>
                    </div>
                </header>

                {/* ── Page Content Stream ── */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Direction Switcher (Unobtrusive) */}
            <DirectionSwitcher />
        </div>
    );
};

export default Layout;
