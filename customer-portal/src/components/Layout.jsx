import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut,
    Globe,
    CalendarCheck,
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
    X
} from 'lucide-react';
import DirectionSwitcher from './DirectionSwitcher';

const Layout = () => {
    const { user, logout } = useAuth();
    const { lang, toggleLanguage, t } = useLanguage();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isAr = lang === 'ar';

    const menuItems = [
        { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'history', label: t('service_history') || 'Service Books', icon: FileText, path: '/history' },
        { id: 'invoices', label: t('invoices') || 'Invoices', icon: Receipt, path: '/invoices' },
        { id: 'appointments', label: t('appointments') || 'Appointments', icon: Calendar, path: '/appointments' },
        { id: 'vehicles', label: t('my_vehicles') || 'My Vehicles', icon: Car, path: '/vehicles' },
        { id: 'glovebox', label: t('digital_glovebox') || 'Digital Glovebox', icon: FolderLock, path: '/glovebox' },
        { id: 'advisor', label: t('ai_advisor') || 'AI Advisor', icon: Bot, path: '/ai-advisor' },
        { id: 'settings', label: t('settings') || 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <div className={`h-screen overflow-hidden flex ${darkMode ? 'dark' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
            
            {/* ── Mobile Backdrop ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar (Responsive & RTL Aligned) ── */}
            <aside
                className={`w-[280px] bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-white/5 flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out
                    ${isAr ? 'right-0 border-l' : 'left-0 border-r'}
                    ${mobileOpen ? 'translate-x-0 shadow-2xl' : isAr ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="p-8 pb-10 flex items-center justify-between">
                    <Link to="/" className="flex items-center justify-center gap-3 group relative flex-1">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#fbbf24]/5 h-16 rounded-full opacity-50 blur-md"></div>
                        <img 
                            src="/logo.png"
                            alt="GoCar Auto"
                            style={{ maxHeight: '55px', objectFit: 'contain' }}
                            className="h-[55px] w-auto relative z-10 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.2)] dark:drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden w-10 h-10 bg-[#fbbf24] rounded-xl items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform duration-300 relative z-10">
                            <Car className="text-black" size={22} fill="currentColor" />
                        </div>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-xl bg-gray-50 dark:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-4 px-6 py-3.5 rounded-[1.25rem] transition-all duration-300 group ${isActive
                                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/10'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'group-hover:scale-110 transition-transform'} />
                                <span className={`text-sm font-bold ${isActive ? 'tracking-tight' : 'tracking-normal'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Area */}
                <div className="p-6">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-[2rem] flex items-center gap-4 border border-transparent dark:border-white/5 transition-all duration-300 hover:border-gray-200 dark:hover:border-white/10">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#fbbf24] to-[#fcd34d] flex items-center justify-center text-black font-black text-lg overflow-hidden border-2 border-white dark:border-[#0a0a0a] shrink-0">
                            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : (user?.name?.charAt(0) || 'C')}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-black truncate text-black dark:text-white">{user?.name || (isAr ? 'عميل مميز' : 'Customer')}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest leading-none mt-0.5">{t('premium_plan')}</p>
                        </div>
                        <motion.button 
                            onClick={logout}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            title={t('logout')}
                            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        >
                            <LogOut size={18} />
                        </motion.button>
                    </div>
                </div>
            </aside>

            {/* ── Main Panel (Responsive Padding + RTL Alignment) ── */}
            <div className={`flex-1 flex flex-col min-w-0 bg-[#f9fafb] dark:bg-[#050505] transition-colors duration-500
                ${isAr ? 'lg:pr-[280px] lg:pl-0' : 'lg:pl-[280px] lg:pr-0'}
            `}>
                
                {/* ── Header ── */}
                <header className="h-[90px] md:h-[100px] flex items-center justify-between px-6 md:px-10 relative z-30 bg-[#f9fafb]/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-[#fbbf24] transition-all"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-3xl font-black text-black dark:text-white tracking-tighter uppercase leading-none mb-1 truncate">
                                {location.pathname === '/' ? t('dashboard') : 
                                 location.pathname.includes('history') ? t('service_history') : 
                                 location.pathname.includes('booking') ? t('booking') :
                                 location.pathname.includes('glovebox') ? (isAr ? 'الدرج الرقمي' : 'Digital Glovebox') :
                                 location.pathname.includes('advisor') ? (isAr ? 'المستشار الذكي' : 'AI Advisor') :
                                 location.pathname.includes('invoices') ? t('invoices') :
                                 location.pathname.includes('appointments') ? t('appointments') :
                                 location.pathname.includes('vehicles') ? t('my_vehicles') :
                                 location.pathname.includes('settings') ? t('settings') : t('autolog')}
                            </h1>
                            <p className="text-[11px] md:text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wide hidden sm:block">
                                {location.pathname === '/' 
                                    ? (isAr ? 'مرحباً بك في لوحة تحكم أسطولك وصياناتك.' : 'Welcome back to your premium overview.') 
                                    : (isAr ? 'إدارة دقيقة ومتكاملة لصيانة سياراتك.' : 'Manage your vehicle maintenance precisely.')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="hidden xl:flex h-12 w-64 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full items-center px-5 gap-3 group focus-within:border-[#fbbf24] transition-all duration-300">
                            <Search className="text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder={t('search_placeholder')} 
                                className="bg-transparent border-none outline-none text-sm font-medium w-full text-black dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={toggleTheme}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-[#fbbf24] transition-all"
                            >
                                {darkMode ? <Sun size={18} className="fill-[#fbbf24] text-[#fbbf24]" /> : <Moon size={18} />}
                            </motion.button>

                            <motion.button
                                onClick={toggleLanguage}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                className="h-10 px-3 md:h-12 md:px-5 flex items-center justify-center gap-1.5 md:gap-2 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-black dark:hover:text-white hover:border-[#fbbf24] transition-all"
                            >
                                <Globe size={16} />
                                <span className="hidden sm:inline">{lang === 'en' ? 'عربي' : 'English'}</span>
                            </motion.button>

                            <div className="relative hidden sm:block">
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 transition-all"
                                >
                                    <Bell size={18} />
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#fbbf24] rounded-full ring-2 ring-white dark:ring-[#050505]"></span>
                                </motion.button>
                            </div>
                        </div>

                        <Link
                            to="/book-service"
                            className="h-10 px-4 md:h-[52px] md:px-7 bg-[#fbbf24] hover:bg-[#d97706] text-black font-black text-xs md:text-sm uppercase tracking-wider rounded-full flex items-center gap-2 shadow-xl shadow-yellow-500/20 active:scale-95 transition-all duration-300 shrink-0"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span className="hidden sm:inline">{t('new_service_entry')}</span>
                            <span className="sm:hidden">{isAr ? 'حجز' : 'Book'}</span>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-10 overflow-x-hidden overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* WHY: Omni Protocol v10.0 True Multi-Direction Switcher (non-intrusive bottom-right) */}
            <DirectionSwitcher />
        </div>
    );
};

export default Layout;
