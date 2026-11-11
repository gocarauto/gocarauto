import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Car, Wrench, Receipt, BarChart, LogOut, Settings, Search, Bell, Shield, Menu, X, Plus, Sparkles, Tag, ChevronRight, Sun, Moon
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'clients', label: 'Clients', icon: Users, path: '/customers' },
        { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/vehicles' },
        { id: 'consignment', label: 'Consignment & Sales', icon: Tag, path: '/consignment' },
        { id: 'service', label: 'Service Ops', icon: Wrench, path: '/service-requests' },
        { id: 'reminders', label: 'Reminders', icon: Bell, path: '/reminders' },
        { id: 'finance', label: 'Finance', icon: Receipt, path: '/financial' },
        { id: 'reports', label: 'Reports', icon: BarChart, path: '/reports' },
        ...(user?.role === 'Admin' ? [{ id: 'credentials', label: 'Credentials', icon: Shield, path: '/credentials' }] : []),
    ];

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Command Operations Deck';
        if (path.startsWith('/customers')) return 'Client Management';
        if (path.startsWith('/vehicles')) return 'Fleet Asset Telemetry';
        if (path.startsWith('/consignment')) return 'Used Car Consignment Hub';
        if (path.startsWith('/service-requests')) return 'Service Operations';
        if (path.startsWith('/reminders')) return 'Due Maintenance Reminders';
        if (path.startsWith('/financial')) return 'Financial Accounting';
        if (path.startsWith('/reports')) return 'Business Analytics';
        if (path.startsWith('/credentials')) return 'IAM & Security Credentials';
        return 'GoCar Auto SFMS';
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        // Global search redirect logic
        navigate(`/service-requests?search=${encodeURIComponent(searchTerm.trim())}`);
    };

    return (
        <div className={`min-h-screen flex bg-slate-50 dark:bg-[#070709] text-slate-900 dark:text-slate-100 relative ${darkMode ? 'dark' : ''}`}>
            
            {/* ── WCAG Skip Link ── */}
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xl transition-all"
            >
                Skip to main content
            </a>

            {/* ── Mobile/Tablet Backdrop Overlay ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar (Responsive & Shop-Floor Optimized) ── */}
            <aside className={`w-[276px] bg-white dark:bg-[#0c0d12] border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
                mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
            }`}>
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
                                GoCar <span className="text-amber-500 dark:text-amber-400">Auto</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                Staff Portal
                            </span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-white/5 cursor-pointer ml-1"
                        aria-label="Close sidebar menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Staff Navigation">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                                    isActive
                                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={19} className={isActive ? 'text-slate-950 stroke-[2.2px]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} />
                                    <span>{item.label}</span>
                                </div>
                                {isActive && (
                                    <ChevronRight size={15} className="text-slate-950/70" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-500 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold text-sm shrink-0">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                                    {user?.name || 'Staff Specialist'}
                                </p>
                                <p className="text-xs text-amber-500 dark:text-amber-400 truncate font-medium">
                                    {user?.role || 'Operator'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            title="Logout"
                            aria-label="Logout"
                            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Panel (Responsive Margin) ── */}
            <div className="flex-1 lg:pl-[276px] flex flex-col min-w-0 bg-slate-50 dark:bg-[#070709] transition-colors duration-200">
                
                {/* Header */}
                <header className="h-20 flex flex-col justify-center px-4 sm:px-6 md:px-8 relative z-30 border-b border-slate-200/80 dark:border-white/[0.08] sticky top-0 backdrop-blur-2xl bg-white/80 dark:bg-[#070709]/90">
                    <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer shrink-0"
                                aria-label="Open sidebar menu"
                            >
                                <Menu size={20} />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                                    {getPageTitle()}
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal hidden sm:block truncate mt-0.5">
                                    GoCar Auto SFMS • Master Console
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <form onSubmit={handleSearchSubmit} className="hidden md:flex h-10 w-60 bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl items-center px-3.5 gap-2 group focus-within:border-amber-400 transition-all duration-200">
                                <Search className="text-slate-400 group-focus-within:text-amber-500 dark:group-focus-within:text-amber-400 transition-colors shrink-0" size={16} />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search order, client, or VIN..." 
                                    aria-label="Search order, client, or VIN"
                                    className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </form>

                            {/* Mobile Search Toggle */}
                            <button
                                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
                                aria-label="Toggle search"
                            >
                                <Search size={18} />
                            </button>

                            {/* Theme Toggle (Identical to Customer Portal) */}
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                title={darkMode ? 'Light mode' : 'Dark mode'}
                            >
                                {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                            </button>

                            <Link
                                to="/reminders"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-amber-400/50 transition-all relative shrink-0"
                                title="Active Reminders"
                                aria-label="Active Reminders"
                            >
                                <Bell size={18} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white dark:ring-[#070709]"></span>
                            </Link>

                            <Link
                                to="/service-requests/new"
                                className="h-10 px-3.5 sm:px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 sm:gap-2 shadow-md shadow-amber-400/20 active:scale-95 transition-all duration-150 shrink-0"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span className="hidden sm:inline">New Work Order</span>
                                <span className="sm:hidden">Intake</span>
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
                                        placeholder="Search order, client, or VIN..." 
                                        autoFocus
                                        aria-label="Search mobile"
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

                {/* Page Content */}
                <main id="main-content" tabIndex="-1" className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-x-hidden relative w-full flex flex-col focus:outline-none pb-24 lg:pb-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-[2400px] mx-auto flex-1 flex flex-col"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* ── Fixed Mobile Bottom Navigation Bar (Staff Operations) ── */}
                <nav 
                    className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070709]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/[0.08] px-3 py-2 flex items-center justify-around shadow-2xl"
                    aria-label="Staff Mobile Bottom Navigation"
                >
                    {/* Dashboard */}
                    <Link
                        to="/"
                        className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl transition-all ${
                            location.pathname === '/' 
                                ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <LayoutDashboard size={20} className={location.pathname === '/' ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">Deck</span>
                    </Link>

                    {/* Service Ops */}
                    <Link
                        to="/service-requests"
                        className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl transition-all ${
                            location.pathname.startsWith('/service-requests') && location.pathname !== '/service-requests/new'
                                ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Wrench size={20} className={location.pathname.startsWith('/service-requests') ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">Orders</span>
                    </Link>

                    {/* Center Intake CTA */}
                    <Link
                        to="/service-requests/new"
                        className="flex flex-col items-center justify-center -mt-6 active:scale-95 transition-transform"
                        aria-label="New Work Order"
                    >
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-white dark:border-[#070709]">
                            <Plus size={22} strokeWidth={2.6} />
                        </div>
                        <span className="text-xs font-bold text-amber-500 dark:text-amber-400 mt-1">Intake</span>
                    </Link>

                    {/* Vehicles */}
                    <Link
                        to="/vehicles"
                        className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl transition-all ${
                            location.pathname.startsWith('/vehicles')
                                ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Car size={20} className={location.pathname.startsWith('/vehicles') ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">Fleet</span>
                    </Link>

                    {/* Clients */}
                    <Link
                        to="/customers"
                        className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl transition-all ${
                            location.pathname.startsWith('/customers')
                                ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Users size={20} className={location.pathname.startsWith('/customers') ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                        <span className="text-xs mt-1 tracking-tight truncate max-w-[62px]">Clients</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
};

export default Layout;
