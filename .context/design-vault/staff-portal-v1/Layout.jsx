import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Car, Wrench, Receipt, BarChart, LogOut, Settings, Search, Bell, Shield
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'clients', label: 'Clients', icon: Users, path: '/customers' },
        { id: 'vehicles', label: 'Vehicles', icon: Car, path: '/vehicles' },
        { id: 'service', label: 'Service Ops', icon: Wrench, path: '/service-requests' },
        { id: 'reminders', label: 'Reminders', icon: Bell, path: '/reminders' },
        { id: 'finance', label: 'Finance', icon: Receipt, path: '/financial' },
        { id: 'reports', label: 'Reports', icon: BarChart, path: '/reports' },
        ...(user?.role === 'Admin' ? [{ id: 'credentials', label: 'Credentials', icon: Shield, path: '/credentials' }] : []),
    ];

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/customers')) return 'Clients';
        if (path.startsWith('/vehicles')) return 'Vehicles';
        if (path.startsWith('/service-requests')) return 'Service Operations';
        if (path.startsWith('/reminders')) return 'Service Reminders';
        if (path.startsWith('/financial')) return 'Finance';
        if (path.startsWith('/reports')) return 'Reports';
        if (path.startsWith('/credentials')) return 'IAM & Credentials';
        return 'GoCar Auto';
    };

    return (
        <div className="min-h-screen flex bg-[#050505] text-white">
            {/* Sidebar */}
            <aside className="w-[280px] bg-[#0a0a0a] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 transition-colors duration-500">
                <div className="p-8 pb-12">
                    <Link to="/" className="flex items-center justify-center gap-3 group relative w-full">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-primary/5 h-16 rounded-full opacity-50 blur-md"></div>
                        <img 
                            src="/logo.png"
                            alt="GoCar Auto"
                            style={{ maxHeight: '60px', objectFit: 'contain' }}
                            className="h-[60px] w-auto relative z-10 transition-transform duration-300 group-hover:scale-110 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden w-12 h-12 bg-primary rounded-xl items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300 relative z-10">
                            <Car className="text-black" size={26} fill="currentColor" />
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center gap-4 px-6 py-4 rounded-[1.25rem] transition-all duration-300 group ${isActive
                                        ? 'bg-primary text-black shadow-lg shadow-primary/10'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'stroke-[3px]' : 'group-hover:translate-x-1 transition-transform'} />
                                <span className={`text-sm font-bold uppercase tracking-widest ${isActive ? 'tracking-normal' : ''}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto border-t border-white/5 bg-black/40">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-[10px] bg-[#0a0a0a] flex items-center justify-center border border-white/10 text-xl shadow-inner">
                            👤
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold truncate text-white uppercase">{user?.name || 'Staff User'}</div>
                            <div className="text-[10px] text-primary uppercase font-black tracking-widest mt-0.5">{user?.role || 'Operator'}</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full btn-secondary text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
                    >
                        <LogOut size={16} />
                        LOGOUT
                    </button>
                </div>
            </aside>

            {/* Main Panel */}
            <div className="flex-1 lg:pl-[280px] flex flex-col min-w-0 bg-[#050505]">
                
                {/* Header */}
                <header className="h-[100px] flex items-center justify-between px-10 relative z-40 bg-[#050505] border-b border-white/5 sticky top-0">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-display font-black text-white tracking-tighter uppercase leading-none mb-1">
                            {getPageTitle()}
                        </h1>
                        <p className="text-xs font-bold text-gray-500 tracking-wide uppercase">
                            GoCar Auto Management System • v2.0
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="h-12 w-64 bg-white/5 border border-white/10 rounded-full flex items-center px-5 gap-3 group focus-within:border-primary transition-all duration-300">
                            <Search className="text-gray-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Global search..." 
                                className="bg-transparent border-none outline-none text-sm font-medium w-full text-white placeholder-gray-600"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-primary/50 transition-all"
                                >
                                    <Bell size={20} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-10 overflow-x-hidden relative">

                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="max-w-[1800px] mx-auto w-full"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
