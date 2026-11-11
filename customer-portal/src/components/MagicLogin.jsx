import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader2, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const MagicLogin = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    const [status, setStatus] = useState(() => (token ? 'VERIFYING' : 'ERROR'));
    const [error, setError] = useState(() => (token ? '' : 'Missing Security Token.'));

    useEffect(() => {
        if (!token) return;

        const processMagicToken = async () => {
            try {
                const response = await api.get(`/auth/customer/magic-login/${token}`);
                const { token: sessionToken, user } = response.data;
                
                // Established verification swipe
                setAuth(sessionToken, user);
                setStatus('SUCCESS');
                
                // Controlled transition to dashboard
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } catch (err) {
                console.error('Magic Link Swipe Failed:', err);
                setStatus('ERROR');
                setError(err.response?.data?.error || 'Intelligence Link Expired or Invalid.');
            }
        };

        processMagicToken();
    }, [token, setAuth, navigate]);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-10 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[3rem] p-12 text-center relative z-10 shadow-2xl"
            >
                {status === 'VERIFYING' && (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto animate-pulse">
                            <Activity size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Synchronizing Link</h2>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Verifying security intelligence...</p>
                        </div>
                        <div className="pt-4 flex justify-center">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center text-green-400 mx-auto">
                            <CheckCircle2 size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mission Authorized</h2>
                            <p className="text-green-400/80 font-bold text-xs uppercase tracking-widest">Transitioning to Portal Control...</p>
                        </div>
                        <div className="pt-4 flex justify-center">
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-green-400"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Intelligence Blocked</h2>
                            <p className="text-red-400 font-bold text-xs uppercase tracking-widest">{error}</p>
                        </div>
                        <div className="pt-6">
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Return to Login
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Security */}
                <div className="mt-12 flex items-center justify-center gap-2 text-xs font-black text-gray-600 uppercase tracking-widest border-t border-white/5 pt-8">
                    <Shield size={14} /> Protocol 442-B Secured
                </div>
            </motion.div>
        </div>
    );
};

export default MagicLogin;
