import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUIDirection } from './DirectionSwitcher';
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
    Wrench,
    FolderLock,
    History,
    Sparkles,
    Fuel,
    Gauge,
    Tag,
    ShieldCheck
} from 'lucide-react';
import SellCarModal from './SellCarModal';

const VehicleFleet = () => {
    const { lang } = useLanguage();
    const isAr = lang === 'ar';
    const { direction } = useUIDirection();
    const navigate = useNavigate();

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMake, setSelectedMake] = useState('All');
    const [sellModalVehicle, setSellModalVehicle] = useState(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/customer-portal/vehicles');
                setVehicles(response.data?.data || []);
            } catch {
                console.error('Failed to synchronize garage data');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    // Unique makes for filter pills
    const uniqueMakes = ['All', ...new Set(vehicles.map(v => v.make).filter(Boolean))];

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = 
            v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.vin?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesMake = selectedMake === 'All' || v.make === selectedMake;
        return matchesSearch && matchesMake;
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]"></div>)}
            </div>
        );
    }

    const isDir2 = direction === '2';
    const isDir3 = direction === '3';
    const accentColor = isDir2 ? '#10b981' : isDir3 ? '#c0673f' : '#fbbf24';

    return (
        <div className="space-y-8 pb-20">
            {/* Header Controls */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tighter">
                        {isAr ? 'أسطول السيارات في الجراج' : 'VIP Garage Fleet'}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {isAr ? 'إدارة وتتبع مواصفات وصيانات أسطولك' : 'Manage telemetry & service logbooks for each asset'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-64 md:w-80">
                        <Search className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                        <input
                            type="text"
                            placeholder={isAr ? 'البحث بالماركة، الموديل أو اللوحة...' : 'Search make, model, plate, VIN...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-[#0c0d12] border border-gray-100 dark:border-white/10 rounded-full py-3.5 ltr:pl-12 rtl:pr-12 px-6 text-xs font-semibold outline-none shadow-md focus:ring-2 focus:ring-[#fbbf24] transition-all text-black dark:text-white"
                        />
                    </div>
                    <div className="bg-white dark:bg-[#0c0d12] px-5 py-3 rounded-2xl border border-gray-100 dark:border-white/10 shadow-md text-center shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">{isAr ? 'العدد' : 'Assets'}</span>
                        <span className="text-lg font-black text-black dark:text-white leading-none">{vehicles.length}</span>
                    </div>
                </div>
            </header>

            {/* Make Filter Pills */}
            {uniqueMakes.length > 2 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {uniqueMakes.map(m => (
                        <button
                            key={m}
                            onClick={() => setSelectedMake(m)}
                            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                selectedMake === m
                                    ? 'bg-[#fbbf24] text-black shadow-lg scale-105'
                                    : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-100 dark:border-white/5'
                            }`}
                        >
                            {m === 'All' ? (isAr ? 'كل السيارات' : 'All Fleet') : m}
                        </button>
                    ))}
                </div>
            )}

            {/* Vehicle Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredVehicles.map((v, i) => {
                    const sketch = getVehicleSketch(v.make, v.model, v.year);
                    const mileage = v.current_mileage || v.mileage || 0;

                    return (
                        <motion.div
                            key={v.id || i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white dark:bg-[#0c0d12] rounded-[3rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-2xl group flex flex-col md:flex-row hover:border-primary/40 transition-all duration-300 relative"
                        >
                            {/* Technical Blueprint Display */}
                            <div className="md:w-[42%] bg-gray-50 dark:bg-black/40 flex flex-col items-center justify-center p-8 relative overflow-hidden border-b md:border-b-0 ltr:md:border-r rtl:md:border-l border-gray-100 dark:border-white/5">
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full blur-2xl"
                                    style={{ backgroundColor: accentColor }}
                                />
                                <img
                                    src={sketch}
                                    alt={`${v.make} ${v.model}`}
                                    className="w-full max-h-40 object-contain z-10 group-hover:scale-110 transition-transform duration-700 contrast-110 filter drop-shadow-xl"
                                />
                                <div className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest z-10">
                                    {v.license_plate}
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="md:w-[58%] p-8 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-black dark:text-white uppercase leading-none font-display">
                                                {v.make}
                                            </h3>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                {v.model} • {v.year}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                            <Car size={20} />
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block flex items-center gap-1">
                                                <Gauge size={10} /> {isAr ? 'العداد' : 'Odometer'}
                                            </span>
                                            <p className="font-mono font-black text-black dark:text-white text-sm">
                                                {mileage ? mileage.toLocaleString() : '—'} <span className="text-[10px] text-gray-400 uppercase font-sans">km</span>
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block flex items-center gap-1">
                                                <Calendar size={10} /> {isAr ? 'الموعد القادم' : 'Next Due'}
                                            </span>
                                            <p className="font-black text-[#fbbf24] text-xs truncate">
                                                {v.next_service_due ? formatDate(v.next_service_due) : (isAr ? 'محدث' : 'Up to date')}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block flex items-center gap-1">
                                                <Activity size={10} /> {isAr ? 'الزيارات' : 'Services'}
                                            </span>
                                            <p className="font-black text-black dark:text-white text-xs">
                                                {v.services_count || 0} {isAr ? 'زيارة' : 'Visits'}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block flex items-center gap-1">
                                                <Hash size={10} /> VIN
                                            </span>
                                            <p className="font-mono text-black dark:text-white text-[11px] truncate">
                                                {v.vin || '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={() => navigate('/history')}
                                            className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                                        >
                                            <History size={14} />
                                            <span>{isAr ? 'السجل' : 'Logbook'}</span>
                                        </button>

                                        <a
                                            href={`/api/vehicles/${v.id}/service-passport/pdf?token=${localStorage.getItem('token') || ''}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                                            title={isAr ? 'تحميل جواز الصيانة المعتمد للسيارة' : 'Download Certified Service Passport'}
                                        >
                                            <ShieldCheck size={14} />
                                            <span>{isAr ? 'جواز الصيانة' : 'Passport'}</span>
                                        </a>

                                        <button
                                            onClick={() => setSellModalVehicle(v)}
                                            className="text-xs font-bold text-[#fbbf24] hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                                            title={isAr ? 'طلب بيع السيارة عبر جوكار' : 'Sell with GoCar'}
                                        >
                                            <Tag size={13} />
                                            <span>{isAr ? 'بيع عبر جوكار' : 'Sell Car'}</span>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => navigate(`/book-service?vehicleId=${v.id}`)}
                                        className="py-2.5 px-4 rounded-2xl bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
                                    >
                                        <span>{isAr ? 'حجز صيانة' : 'Book VIP'}</span>
                                        <ChevronRight size={15} className={isAr ? 'rotate-180' : ''} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Sell Car Modal */}
            <SellCarModal
                isOpen={!!sellModalVehicle}
                vehicle={sellModalVehicle}
                onClose={() => setSellModalVehicle(null)}
                onSuccess={() => setSellModalVehicle(null)}
            />

            {filteredVehicles.length === 0 && (
                <div className="p-20 text-center bg-white dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-black/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-gray-300">
                        <Car size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">
                        {isAr ? 'لم يتم العثور على سيارات مطابقة' : 'No Matching Vehicles'}
                    </h3>
                    <p className="text-gray-400 max-w-sm mx-auto text-xs">
                        {isAr ? 'جرب البحث بكلمات مختلفة أو اتصل بالدعم لإضافة سيارة جديدة.' : 'Try adjusting your search filters or contact GoCar concierge to register a new vehicle.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default VehicleFleet;
