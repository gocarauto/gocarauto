import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoading(false);
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
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-bold mb-8 flex items-center justify-center text-center gap-2 uppercase tracking-wide"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                                <Mail size={12} /> Email Access
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@gocarauto.com"
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
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Establish Connection
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center opacity-50 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-2">Demo Credentials</p>
                        <p className="text-xs font-mono text-gray-400 bg-black/50 py-2 px-4 rounded-lg inline-block border border-white/5">
                            admin@gocarauto.com / password123
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
