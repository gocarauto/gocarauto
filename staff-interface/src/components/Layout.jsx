import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import DirectionSwitcher, { useStaffUIDirection } from './DirectionSwitcher';
import {
    LayoutDashboard, Users, Car, Wrench, Receipt, BarChart, LogOut, Settings, Search, Bell, Shield, Menu, X, Plus, Sparkles, Tag
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { direction } = useStaffUIDirection();
    const [mobileOpen, setMobileOpen] = useState(false);
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

    const isDir2 = direction === '2';
    const isDir3 = direction === '3';

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        // Global search redirect logic
        navigate(`/service-requests?search=${encodeURIComponent(searchTerm.trim())}`);
    };

    return (
        <div className={`min-h-screen flex text-white relative transition-colors duration-500 ${
            isDir2 ? 'bg-[#0b0f17]' : isDir3 ? 'bg-[#0f172a]' : 'bg-[#070709]'
        }`}>
            
            {/* ── Mobile/Tablet Backdrop Overlay ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar (Responsive & Shop-Floor Optimized) ── */}
            <aside className={`w-[280px] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out ${
                isDir2 ? 'bg-[#0e131f]' : isDir3 ? 'bg-[#111827]' : 'bg-[#0c0d12]'
            } ${
                mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="p-6 pb-8 flex items-center justify-between">
                    <Link to="/" className="w-full flex-1 group">
                        <div className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#fbbf24]/40 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1.5 shadow-xl backdrop-blur-xl transition-all duration-300">
                            <img 
                                src="/logo.png"
                                alt="GoCar Auto"
                                style={{ maxHeight: '52px', objectFit: 'contain' }}
                                className="h-[52px] w-auto relative z-10 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_14px_rgba(251,191,36,0.35)]"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="hidden w-11 h-11 bg-[#fbbf24] rounded-2xl items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 relative z-10 text-black">
                                <Car size={24} fill="currentColor" />
                            </div>
                            <div className="text-[10px] font-black tracking-[0.25em] text-[#fbbf24] uppercase font-display leading-none mt-0.5">
                                GoCar Auto
                            </div>
                        </div>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 cursor-pointer ml-2"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
                                    isActive
                                        ? 'bg-white text-black shadow-xl shadow-black/30 font-black'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5 font-bold'
                                }`}
                            >
                                <Icon size={19} className={isActive ? 'stroke-[2.5px] text-black' : 'group-hover:scale-110 transition-transform'} />
                                <span className="text-xs uppercase tracking-wider">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto border-t border-white/5 bg-black/40">
                    <div className="flex items-center gap-3.5 mb-5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#fbbf24] to-[#fcd34d] text-black flex items-center justify-center font-black text-sm shadow-md shrink-0">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <div className="text-xs font-black truncate text-white uppercase tracking-tight">{user?.name || 'Staff Specialist'}</div>
                            <div className="text-[10px] text-[#fbbf24] uppercase font-black tracking-widest mt-0.5">{user?.role || 'Operator'}</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                        <LogOut size={15} />
                        <span>LOGOUT</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Panel (Responsive Margin) ── */}
            <div className="flex-1 lg:pl-[280px] flex flex-col min-w-0">
                
                {/* Header */}
                <header className={`h-[90px] md:h-[100px] flex items-center justify-between px-6 md:px-10 relative z-30 border-b border-white/5 sticky top-0 backdrop-blur-2xl ${
                    isDir2 ? 'bg-[#0b0f17]/90' : isDir3 ? 'bg-[#0f172a]/90' : 'bg-[#070709]/90'
                }`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                            aria-label="Open sidebar menu"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-3xl font-display font-black text-white tracking-tighter uppercase leading-none mb-1 truncate">
                                {getPageTitle()}
                            </h1>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                                GoCar Auto SFMS • Master Console
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        <form onSubmit={handleSearchSubmit} className="hidden xl:flex h-12 w-64 bg-white/5 border border-white/10 rounded-full items-center px-5 gap-3 group focus-within:border-[#fbbf24] transition-all duration-300">
                            <Search className="text-gray-400 group-focus-within:text-[#fbbf24] transition-colors" size={17} />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search work order or VIN..." 
                                className="bg-transparent border-none outline-none text-xs font-medium w-full text-white placeholder-gray-500"
                            />
                        </form>

                        <div className="flex items-center gap-2">
                            <Link
                                to="/reminders"
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-[#fbbf24] transition-all relative"
                                title="Active Reminders"
                            >
                                <Bell size={18} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#fbbf24] rounded-full ring-2 ring-[#070709]"></span>
                            </Link>

                            <Link
                                to="/service-requests/new"
                                className="h-10 px-4 md:h-[50px] md:px-6 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black text-xs uppercase tracking-wider rounded-full flex items-center gap-2 shadow-xl shadow-yellow-500/20 active:scale-95 transition-all duration-200 shrink-0"
                            >
                                <Plus size={17} strokeWidth={3} />
                                <span className="hidden sm:inline">New Work Order</span>
                                <span className="sm:hidden">Intake</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10 overflow-x-hidden relative w-full flex flex-col">
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
            </div>

            {/* WHY: Omni Protocol v10.0 Staff True Multi-Direction Switcher (non-intrusive bottom-right) */}
            <DirectionSwitcher />
        </div>
    );
};

export default Layout;
