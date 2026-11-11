import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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

const Layout = () => {
    const { user, logout } = useAuth();
    const { lang, toggleLanguage, t } = useLanguage();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isAr = lang === 'ar';

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        navigate(`/history?search=${encodeURIComponent(searchTerm.trim())}`);
    };

    const menuItems = [
        { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'vehicles', label: t('my_vehicles') || 'My Vehicles', icon: Car, path: '/vehicles' },
        { id: 'booking', label: t('booking') || 'Booking', icon: Wrench, path: '/book-service' },
        { id: 'appointments', label: t('appointments') || 'Appointments', icon: Calendar, path: '/appointments' },
        { id: 'history', label: t('service_history') || 'Service History', icon: FileText, path: '/history' },
        { id: 'invoices', label: t('invoices') || 'Invoices', icon: Receipt, path: '/invoices' },
        { id: 'glovebox', label: t('car_documents') || 'Car Documents', icon: FolderLock, path: '/glovebox' },
        { id: 'settings', label: t('settings') || 'Settings', icon: Settings, path: '/settings' },
    ];

    const getPageTitle = () => {
        const p = location.pathname;
        if (p === '/') return t('dashboard');
        if (p.includes('history')) return t('service_history');
        if (p.includes('booking') || p.includes('book-service')) return t('booking');
        if (p.includes('glovebox')) return t('car_documents') || (isAr ? 'وثائق السيارة' : 'Car Documents');
        if (p.includes('invoices')) return t('invoices');
        if (p.includes('appointments')) return t('appointments');
        if (p.includes('vehicles')) return t('my_vehicles');
        if (p.includes('settings')) return t('settings');
        return t('autolog');
    };

    const getPageSubtitle = () => {
        const p = location.pathname;
        if (p === '/') return isAr ? 'نظرة سريعة وشاملة على حالة سيارتك وسجل الصيانة' : "Quick overview of your car's health and service history";
        if (p.includes('history')) return isAr ? 'السجل الرقمي الكامل لعمليات الفحص والصيانة' : 'Complete digital service ledger and inspection history';
        if (p.includes('booking') || p.includes('book-service')) return isAr ? 'حجز موعد صيانة جديد عبر باقاتنا المتخصصة' : 'Reserve a certified technician bay for your vehicle';
        if (p.includes('glovebox')) return isAr ? 'مستندات ورخص المركبات مؤمنة سحابياً' : 'Encrypted storage for vehicle licenses, insurance, and inspection certificates';
        if (p.includes('invoices')) return isAr ? 'كشوف الحساب والفواتير الضريبية المعتمدة' : 'Official VAT statements, service quotes, and payment receipts';
        return isAr ? 'إدارة دقيقة ومتكاملة لصيانة سياراتك' : 'Precision automotive fleet operations';
    };

    return (
        <div className={`h-screen overflow-hidden flex bg-slate-50 dark:bg-[#070709] text-slate-900 dark:text-slate-100 ${darkMode ? 'dark' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
            
            {/* ── WCAG Skip to Main Content Link ── */}
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xl transition-all"
            >
                {isAr ? 'الانتقال إلى المحتوى الرئيسي' : 'Skip to main content'}
            </a>

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
                    <Link to="/" className="flex items-center gap-3 group flex-1">
                        <img 
                            src="/logo.png"
                            alt="GoCar Auto"
                            className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden w-10 h-10 bg-amber-400 rounded-xl items-center justify-center text-slate-950 font-bold">
                            <Car size={22} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-extrabold text-lg tracking-tight text-slate-950 dark:text-white leading-tight">
                                GoCar <span className="text-amber-500">Auto</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                {isAr ? 'بوابة العميل' : 'CUSTOMER PORTAL'}
                            </span>
                        </div>
                    </Link>

                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors ml-1"
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
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                                    isActive
                                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={19} className={isActive ? 'text-slate-950 stroke-[2.2px]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} />
                                    <span>{item.label}</span>
                                </div>
                                {isActive && (
                                    <ChevronRight size={15} className={`text-slate-950/70 ${isAr ? 'rotate-180' : ''}`} />
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
                                    <img src={user.avatar} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0) || 'C'
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                                    {user?.name || (isAr ? 'عميل مميز' : 'Customer')}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user?.phone || user?.email || (isAr ? 'حساب معتمد' : 'Verified Member')}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={logout}
                            title={t('logout')}
                            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
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
                <header className="h-20 flex flex-col justify-center px-4 sm:px-8 bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] sticky top-0 z-30">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
                                aria-label="Open menu"
                            >
                                <Menu size={22} />
                            </button>

                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white truncate">
                                    {getPageTitle()}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                                    {getPageSubtitle()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            {/* Desktop Search Input */}
                            <form onSubmit={handleSearchSubmit} className={`hidden md:flex items-center gap-2 h-10 px-3.5 rounded-xl border transition-all duration-150 ${
                                searchFocused 
                                    ? 'w-64 border-amber-400 ring-2 ring-amber-400/20 bg-white dark:bg-[#12131a]' 
                                    : 'w-48 border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.04]'
                            }`}>
                                <Search size={16} className="text-slate-400 shrink-0" />
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('search_placeholder')}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    aria-label="Search records"
                                    className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                                <kbd className="hidden lg:inline-block text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-white/[0.08] px-1.5 py-0.5 rounded">
                                    ⌘K
                                </kbd>
                            </form>

                            {/* Mobile Search Toggle Icon */}
                            <button
                                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                aria-label="Toggle search"
                            >
                                <Search size={18} />
                            </button>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                title={darkMode ? 'Light mode' : 'Dark mode'}
                            >
                                {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                            </button>

                            {/* Language Switcher */}
                            <button
                                onClick={toggleLanguage}
                                className="h-10 px-2.5 sm:px-3.5 flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
                            >
                                <Globe size={16} />
                                <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
                            </button>

                            {/* Notifications */}
                            <button
                                className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                aria-label="Notifications"
                            >
                                <Bell size={18} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#0c0d12]" />
                            </button>

                            {/* Primary Action Button (Desktop/Tablet) */}
                            <Link
                                to="/book-service"
                                className="hidden sm:flex h-10 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl items-center gap-2 transition-colors shadow-sm shrink-0"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span>{t('book_vip_service') || 'Book Service'}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Expandable Search Bar */}
                    <AnimatePresence>
                        {mobileSearchOpen && (
                            <motion.form 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={(e) => {
                                    handleSearchSubmit(e);
                                    setMobileSearchOpen(false);
                                }}
                                className="md:hidden pt-2 pb-1 overflow-hidden"
                            >
                                <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-amber-400 ring-2 ring-amber-400/20 bg-white dark:bg-[#12131a]">
                                    <Search size={16} className="text-amber-500 shrink-0" />
                                    <input 
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={t('search_placeholder')}
                                        autoFocus
                                        aria-label="Search records mobile"
                                        className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setMobileSearchOpen(false)}
                                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </header>

                {/* ── Page Content Stream ── */}
                <main id="main-content" tabIndex="-1" className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto focus:outline-none pb-24 lg:pb-8">
                    <Outlet />
                </main>

                {/* ── Fixed Mobile Bottom Navigation Bar (Thumbs-First Ergonomics) ── */}
                <nav 
                    className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/[0.08] px-3 py-2 flex items-center justify-around shadow-2xl"
                    aria-label="Mobile Bottom Navigation"
                >
                    {/* Dashboard */}
                    <Link
                        to="/"
                        className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl transition-all ${
                            location.pathname === '/' 
                                ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <LayoutDashboard size={20} className={location.pathname === '/' ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">{t('dashboard') || 'Home'}</span>
                    </Link>

                    {/* Vehicles */}
                    <Link
                        to="/vehicles"
                        className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl transition-all ${
                            location.pathname.startsWith('/vehicles')
                                ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Car size={20} className={location.pathname.startsWith('/vehicles') ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">{t('my_vehicles') || 'Fleet'}</span>
                    </Link>

                    {/* Center Prominent CTA: Book Service */}
                    <Link
                        to="/book-service"
                        className="flex flex-col items-center justify-center -mt-6 active:scale-95 transition-transform"
                        aria-label={t('booking') || 'Book Service'}
                    >
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-white dark:border-[#0c0d12]">
                            <Wrench size={22} strokeWidth={2.4} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{isAr ? 'حجز' : 'Book'}</span>
                    </Link>

                    {/* History */}
                    <Link
                        to="/history"
                        className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl transition-all ${
                            location.pathname.startsWith('/history')
                                ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <FileText size={20} className={location.pathname.startsWith('/history') ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">{t('service_history') || 'History'}</span>
                    </Link>

                    {/* Menu / Drawer Toggle */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                        aria-label="Open full menu"
                    >
                        <Menu size={20} className="stroke-[1.8px]" />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">{isAr ? 'المزيد' : 'More'}</span>
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default Layout;
