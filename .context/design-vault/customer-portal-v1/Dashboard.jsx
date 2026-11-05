import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getVehicleSketch } from '../utils/sketchHelper';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import {
    History,
    Car,
    TrendingUp,
    ChevronRight,
    Calendar,
    FolderLock,
    Bot,
    Wrench,
    CheckCircle
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const { t, lang } = useLanguage();
    const { darkMode } = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashRes, remRes] = await Promise.all([
                    api.get('/customer-portal/dashboard'),
                    api.get('/customer-portal/reminders').catch(() => ({ data: { data: [] } }))
                ]);
                setData({
                    ...dashRes.data.data,
                    reminders: remRes.data.data || []
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex flex-col space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-white/5 rounded-[2rem]"></div>)}
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-[3.5rem]"></div>
            </div>
        );
    }

    const vehicle = data?.upcomingService?.[0] || null;
    const stats = data?.stats || { totalVehicles: 0, totalServices: 0, totalSpent: 0 };
    const sketch = vehicle ? getVehicleSketch(vehicle.make, vehicle.model, vehicle.year) : null;

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* ── Top Summary Header (Small Cards) ── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                {[
                    { label: t('total_visits'), value: stats.totalServices, icon: History, color: 'text-blue-500' },
                    { label: 'YTD Maintenance', value: `${stats.totalSpent.toLocaleString()} EGP`, icon: TrendingUp, color: 'text-green-500' },
                    { label: t('registered_vehicles'), value: stats.totalVehicles, icon: Car, color: 'text-amber-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#0a0a0a] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 text-black dark:text-white flex items-center justify-between shadow-xl">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">{stat.label}</span>
                            <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 text-gray-400 p-4 rounded-2xl">
                            <stat.icon size={24} className={stat.color} />
                        </div>
                    </div>
                ))}
            </section>

            {/* ── High-Fidelity Hero Showcase ── */}
            <section className="flex-1 bg-black dark:bg-[#050505] rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row border border-white/5 shadow-2xl relative">
                
                {/* Background Pattern/Glow */}
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(251,191,36,0.15)_0%,transparent_70%)] rounded-full -translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

                {/* Left Area (Actions & Status) */}
                <div className="md:w-[45%] p-12 flex flex-col justify-between relative z-10 text-white border-r border-white/5">
                    
                    {vehicle ? (
                        <div>
                            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-primary/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                ACTIVE VEHICLE
                            </div>
                            
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-1 leading-none">{vehicle.make}</h2>
                            <p className="text-xl md:text-2xl text-gray-400 font-medium tracking-tight mb-8">{vehicle.model} - {vehicle.year}</p>
                            
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2">MILEAGE</p>
                                    {/* WHY: Support current_mileage column from database */}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black tracking-tighter">
                                            {(vehicle.current_mileage || vehicle.mileage) ? (vehicle.current_mileage || vehicle.mileage).toLocaleString() : '—'}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">km</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/10 text-gray-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                NO ACTIVE VEHICLES
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">Welcome to GoCar Auto</h2>
                            <p className="text-sm text-gray-400 leading-relaxed mb-8">Register a vehicle with us to track your service requirements, view technical garage details, and manage upcoming schedules.</p>
                        </div>
                    )}

                    {/* Active Service Tracker */}
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                                <Wrench size={16} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tighter">Next Action Required</h4>
                            </div>
                        </div>
                        {data?.reminders && data.reminders.length > 0 ? (
                            <>
                                <p className="text-xs text-gray-400 font-bold leading-relaxed mb-4">
                                    {data.reminders[0].notes || `Scheduled maintenance reminder for your ${data.reminders[0].make} ${data.reminders[0].model}.`}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-black text-primary tracking-tighter">{data.reminders[0].service_type}</span>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        DUE {formatDate(data.reminders[0].due_date)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-gray-400 font-bold leading-relaxed mb-4">All systems clear. No upcoming service tasks or routine checkups are currently flagged.</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-black text-green-400 tracking-tighter">Fleet Healthy</span>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">OK</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-3">
                        <Link to="/book-service" className="bg-white text-black hover:bg-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group">
                            <Calendar size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-center">Book Service</span>
                        </Link>
                        <Link to="/glovebox" className="bg-white/5 hover:bg-white/10 text-white border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group">
                            <FolderLock size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-center">Glovebox</span>
                        </Link>
                        <Link to="/ai-advisor" className="bg-white/5 hover:bg-white/10 text-white border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group">
                            <Bot size={20} className="text-primary group-hover:text-white transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-center">AI Advisor</span>
                        </Link>
                    </div>

                </div>

                {/* Right Area (Vehicle Sketch) */}
                <div className="md:w-[55%] relative flex items-center justify-center p-12 overflow-hidden bg-gradient-to-l from-[#111] to-transparent">
                     {sketch ? (
                         <motion.img
                            src={sketch}
                            alt="Vehicle Technical Sketch"
                            className="w-full h-full object-contain object-right z-10 scale-125 md:scale-[1.8] translate-x-12"
                            initial={{ opacity: 0, x: 50, scale: 1.5 }}
                            animate={{ opacity: 1, x: 0, scale: 1.8 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                     ) : (
                         <div className="text-gray-600 font-bold uppercase tracking-widest text-xs z-10">No Sketch Map Loaded</div>
                     )}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
