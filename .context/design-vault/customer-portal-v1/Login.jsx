import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Shield, Key, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const { darkMode } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const success = await login(email, password);
            if (!success) {
                setError('Invalid security credentials');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Biometric/Network link failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px]"
            >
                <div className="bg-surface-light dark:bg-surface-dark p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                    {/* Decorative Accent */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-primary-dark"></div>

                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Shield size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tighter uppercase">Portal Access</h2>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2 font-medium">AutoLog Premiere Concierge</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold mb-8 flex items-center gap-3"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark ml-4">Identifier</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                {/* WHY: type="text" allows clients to log in using either their mobile number or email address */}
                                <input
                                    type="text"
                                    placeholder="your@email.com or 010..."
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary/30 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark ml-4">Keyphrase</label>
                            <div className="relative group">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary/30 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    AUTHENTICATE
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Secure Channel Enabled</p>
                        <div className="flex justify-center gap-2 opacity-20">
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
