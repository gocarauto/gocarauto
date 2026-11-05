import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { getVehicleSketch } from '../utils/sketchHelper';
import { formatDate } from '../utils/dateUtils';
import {
    Car,
    Shield,
    Hash,
    Calendar,
    Activity,
    ChevronRight,
    Search,
    Wrench
} from 'lucide-react';

const VehicleFleet = () => {
    const { t, lang } = useLanguage();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/customer-portal/vehicles');
                setVehicles(response.data.data);
            } catch (err) {
                console.error('Failed to synchronize garage data');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    const filteredVehicles = vehicles.filter(v =>
        v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>)}
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search garage..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-full py-5 pl-16 pr-8 text-sm outline-none shadow-xl focus:ring-2 focus:ring-primary/20 transition-all text-black dark:text-white"
                    />
                </div>
                <div className="flex bg-white dark:bg-white/5 p-2 rounded-full border border-gray-100 dark:border-white/5 shadow-xl">
                    <div className="flex flex-col px-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Garage Items</span>
                        <span className="text-xl font-black text-black dark:text-white tracking-tighter">{vehicles.length}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {filteredVehicles.map((v, i) => {
                    const sketch = getVehicleSketch(v.make, v.model, v.year);
                    return (
                        <motion.div
                            key={v.id || i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-2xl group flex flex-col md:flex-row"
                        >
                            {/* Sketch Area */}
                            <div className="md:w-1/3 bg-gray-50 dark:bg-black/40 flex items-center justify-center p-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <img
                                    src={sketch}
                                    alt="Vehicle Detail"
                                    className="w-full h-auto object-contain z-10 scale-125 group-hover:scale-150 transition-transform duration-700 brightness-110 contrast-110 drop-shadow-2xl"
                                />
                            </div>

                            {/* Info Area */}
                            <div className="md:w-2/3 p-10 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tighter text-black dark:text-white uppercase leading-none mb-1">{v.make}</h3>
                                            <p className="text-lg text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">{v.model} - {v.year}</p>
                                        </div>
                                        <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:bg-primary group-hover:text-black transition-colors duration-300">
                                            <Car size={24} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Hash size={10} /> VIN Identification
                                            </p>
                                            <p className="text-sm font-black text-black dark:text-white tracking-wider">{v.vin || '—'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Calendar size={10} /> Next Duty
                                            </p>
                                            <p className="text-sm font-black text-primary tracking-tight">
                                                {v.next_service_due ? formatDate(v.next_service_due) : '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Activity size={10} /> Mission Count
                                            </p>
                                            <p className="text-sm font-black text-black dark:text-white tracking-tighter">{v.services_count || 0} Service Trips</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Wrench size={10} /> Maintenance Logged
                                            </p>
                                            <p className="text-sm font-black text-black dark:text-white tracking-tighter">EGP {v.total_spent?.toLocaleString() || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                                    <div className="bg-gray-100 dark:bg-white/5 px-5 py-2 rounded-full flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-gray-300">{v.license_plate}</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/book-service?vehicleId=${v.id}`)}
                                        className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform"
                                    >
                                        Book Service <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {filteredVehicles.length === 0 && (
                <div className="p-20 text-center bg-white dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-black/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-gray-300">
                        <Car size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Workspace Undetected</h3>
                    <p className="text-gray-400 dark:text-gray-500 max-w-sm mx-auto">It appears you haven't linked any garage items to your profile. Contact support to register new vehicles.</p>
                </div>
            )}
        </div>
    );
};

export default VehicleFleet;
