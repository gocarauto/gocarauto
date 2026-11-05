import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [slowNotice, setSlowNotice] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSlowNotice(false);

        // Show cold start notice if request takes longer than 2.5 seconds
        const timer = setTimeout(() => {
            setSlowNotice(true);
        }, 2500);

        try {
            const result = await login(identifier, password);
            clearTimeout(timer);

            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch (err) {
            clearTimeout(timer);
            setError(err.message || 'An unexpected connection error occurred');
        } finally {
            clearTimeout(timer);
            setLoading(false);
            setSlowNotice(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden font-sans">
            {/* Holographic Background Nodes */}
            <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[70%] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00E5FF]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[440px] relative z-10"
            >
                <div className="bg-[#0f172a]/80 backdrop-p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
                    {/* Top Glow Edge */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                    <div className="text-center mb-10">
                        <img src="/logo.png" alt="GoCar Auto" style={{ maxHeight: '80px', objectFit: 'contain' }} className="h-20 w-auto mx-auto mb-6 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                        <h1 className="text-3xl font-display font-black text-white tracking-widest uppercase italic">SFMS PORTAL</h1>
                        <p className="text-primary text-[10px] uppercase font-black tracking-[0.3em] mt-2">ELITE STAFF MANAGEMENT</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/15 border border-red-500/40 text-red-300 p-4 rounded-xl text-xs font-semibold mb-6 flex flex-col gap-1 tracking-wide"
                        >
                            <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                Authentication Notice
                            </div>
                            <p className="text-gray-300 leading-relaxed">{error}</p>
                        </motion.div>
                    )}

                    {slowNotice && loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs font-medium mb-6 flex items-center gap-2"
                        >
                            <Loader2 size={14} className="animate-spin text-amber-400 shrink-0" />
                            <span>Contacting cloud service... Render instances may take 15–30s to wake up on first launch.</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                                <Shield size={12} /> Staff Username / Email
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="admin or admin@gocar.com"
                                className="w-full bg-black/40 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 rounded-2xl py-4 px-5 text-sm outline-none transition-all text-white placeholder-gray-600 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                                <Key size={12} /> Security Key
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 rounded-2xl py-4 px-5 text-sm outline-none transition-all text-white placeholder-gray-600 font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 mt-4 uppercase tracking-[0.2em] text-xs"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Establishing Connection...</span>
                                </>
                            ) : (
                                <>
                                    Establish Connection
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center opacity-60 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-2">Default Staff Credentials</p>
                        <p className="text-xs font-mono text-gray-400 bg-black/50 py-2 px-4 rounded-lg inline-block border border-white/5">
                            admin@gocar.com / password123
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
