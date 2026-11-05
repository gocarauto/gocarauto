import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    Languages
} from 'lucide-react';

const Settings = () => {
    const { user, setAuth } = useAuth();
    const { lang, toggleLanguage } = useLanguage();
    const { darkMode, toggleTheme } = useTheme();
    // WHY: Support both user.phone and user.mobile to prevent erasing phone number on save
    const [formData, setFormData] = useState({
        full_name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || user?.mobile || '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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
            setMessage('Profile Intelligence Synchronized.');
        } catch {
            setMessage('Transmission Error.');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header>
                <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Systems Intelligence</h1>
                <p className="text-gray-400 dark:text-gray-500 font-bold tracking-tight italic">Manage your profile and protocol preferences.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Profile Form */}
                <div className="lg:col-span-2 space-y-10">
                    <section className="bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-100 dark:border-white/5 p-12 shadow-2xl space-y-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary text-black rounded-2xl flex items-center justify-center">
                                <User size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter leading-none">Identity Core</h2>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-1.5">
                                        <Shield size={10} /> Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-[1.5rem] py-4 px-6 text-sm font-bold text-black dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-1.5">
                                        <Mail size={10} /> Contact Manifold
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-[1.5rem] py-4 px-6 text-sm font-bold text-black dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Email Address"
                                    />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-1.5">
                                        <Smartphone size={10} /> Comms Vector
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-[1.5rem] py-4 px-6 text-sm font-bold text-black dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Mobile Number"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex items-center justify-between">
                                <p className={`text-[10px] font-black uppercase tracking-widest transition-opacity ${message ? 'opacity-100 text-primary' : 'opacity-0'}`}>
                                    {message}
                                </p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
                                >
                                    <Save size={16} />
                                    Update Identity
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                         <div className="space-y-2 relative z-10 text-center md:text-left">
                            <h3 className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">Access Key Management</h3>
                            <p className="text-xs text-red-500/80 font-bold">Rotate your authentication frequency for maximum security.</p>
                         </div>
                         <button className="px-8 py-3.5 bg-red-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-all relative z-10">
                            <Key size={14} /> Reset Pass-protocol
                         </button>
                    </section>
                </div>

                {/* Vertical Preference Sidebar */}
                <div className="space-y-10">
                    <section className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 border-b border-gray-50 dark:border-white/5 pb-4">UI Protocol</h3>
                        <div className="space-y-4">
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Design Mode</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{darkMode ? 'Aether' : 'Lumos'}</span>
                            </button>

                            <button
                                onClick={toggleLanguage}
                                className="w-full flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#fbbf24] text-black rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                                        <Languages size={18} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Linguistic Core</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{lang === 'en' ? 'LAT-ALPH' : 'ARAB-ALPH'}</span>
                            </button>
                        </div>
                    </section>

                    <section className="bg-black text-white rounded-[2.5rem] p-10 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-primary mb-2 group-hover:scale-110 duration-500">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg uppercase tracking-tighter leading-none mb-2">Protocol Verified</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-relaxed">System identity is confirmed. All transmission lines are encrypted at 2048-bit standards.</p>
                        </div>
                        <div className="pt-4 border-t border-white/10 w-full flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <Smartphone size={12} /> Registered Device Map
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Settings;
