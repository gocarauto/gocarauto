import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Shield, UserPlus, Trash2, Edit3, Key, Mail, Phone, User, CheckCircle2, AlertTriangle, X, Users, Search, Lock } from 'lucide-react';

const CredentialManager = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Operator', mobile: '', password: '' });
    const [message, setMessage] = useState(null);

    // Customer Portal Access State
    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState([]);
    const [clientSearching, setClientSearching] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [newClientPassword, setNewClientPassword] = useState('');
    const [clientMsg, setClientMsg] = useState(null);
    const [clientPasswordModalOpen, setClientPasswordModalOpen] = useState(false);

    useEffect(() => { fetchStaff(); }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/users');
            setStaff(response.data.data);
        } catch {
            showNotify('Failed to sync staff directory', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
                showNotify('STAFF CREDENTIALS UPDATED', 'success');
            } else {
                await api.post('/users', formData);
                showNotify('NEW STAFF MEMBER AUTHORIZED', 'success');
            }
            setModalOpen(false);
            fetchStaff();
        } catch (error) {
            showNotify(error.response?.data?.error || 'OPERATION FAILED', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('PERMANENTLY REVOKE ACCESS FOR THIS ACCOUNT?')) return;
        try {
            await api.delete(`/users/${id}`);
            showNotify('ACCESS REVOKED', 'success');
            fetchStaff();
        } catch {
            showNotify('REVOCATION FAILED', 'error');
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ name: user.name, email: user.email, role: user.role, mobile: user.mobile || '', password: '' });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', role: 'Operator', mobile: '', password: '' });
        }
        setModalOpen(true);
    };

    const showNotify = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleClientSearch = async () => {
        if (!clientSearch.trim()) return;
        setClientSearching(true);
        try {
            const res = await api.get(`/clients?search=${encodeURIComponent(clientSearch)}`);
            setClientResults(res.data.data || []);
        } catch {
            setClientMsg({ text: 'Search failed', type: 'error' });
        } finally {
            setClientSearching(false);
        }
    };

    const handleSetClientPassword = async (e) => {
        e.preventDefault();
        if (!newClientPassword || newClientPassword.length < 6) {
            setClientMsg({ text: 'Password must be at least 6 characters', type: 'error' });
            return;
        }
        try {
            await api.post(`/clients/${selectedClient.id}/reset-password`, { newPassword: newClientPassword });
            setClientMsg({ text: `Password set for ${selectedClient.full_name}`, type: 'success' });
            setClientPasswordModalOpen(false);
            setNewClientPassword('');
            setSelectedClient(null);
        } catch (e) {
            setClientMsg({ text: e.response?.data?.error || 'Failed to set password', type: 'error' });
        }
        setTimeout(() => setClientMsg(null), 5000);
    };

    if (loading && staff.length === 0) return (
        <div className="flex items-center justify-center p-20 animate-glow text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
            SECURE LINK ESTABLISHED... SYNCHRONIZING ENCRYPTION...
        </div>
    );

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── STAFF SECTION HEADER ── */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        <Shield className="text-blue-500" size={32} />
                        Access &amp; Credentials
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold">Identity &amp; Access Management (IAM)</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20">
                    <UserPlus size={18} />
                    AUTHORIZE NEW STAFF
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 border ${
                    message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-500'
                } animate-in zoom-in duration-300`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                </div>
            )}

            {/* ── STAFF GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((user) => (
                    <div key={user.id} className="glass-card p-6 group hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                user.role === 'Admin' ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400' : 'bg-amber-500/20 text-amber-500 dark:text-amber-400'
                            }`}>
                                <User size={24} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(user)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                                    <Edit3 size={16} />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{user.name}</h3>
                        <div className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mb-4 ${
                            user.role === 'Admin' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                        }`}>
                            {user.role}
                        </div>
                        <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold tracking-tight">
                                <Mail size={14} className="text-slate-500 dark:text-slate-400" />
                                {user.email}
                            </div>
                            {user.mobile && (
                                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold tracking-tight">
                                    <Phone size={14} className="text-slate-500 dark:text-slate-400" />
                                    {user.mobile}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── CUSTOMER PORTAL ACCESS SECTION ── */}
            <div className="mt-16 pt-10 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-widest">Customer Portal Access</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold">Set or reset a client's portal login password</p>
                    </div>
                </div>

                {clientMsg && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 border mb-6 ${
                        clientMsg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-500'
                    }`}>
                        {clientMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{clientMsg.text}</span>
                    </div>
                )}

                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
                        <input
                            type="text"
                            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-green-500/50 transition-colors"
                            placeholder="Search client by name, email or phone..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleClientSearch()}
                        />
                    </div>
                    <button onClick={handleClientSearch} disabled={clientSearching} className="btn-secondary border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 px-6">
                        {clientSearching ? 'SEARCHING...' : 'SEARCH'}
                    </button>
                </div>

                {clientResults.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 divide-y divide-slate-100 dark:divide-white/5">
                        {clientResults.map(client => (
                            <div key={client.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{client.full_name}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex gap-4">
                                        <span>{client.email || 'No email'}</span>
                                        <span className="font-mono">{client.phone}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedClient(client); setNewClientPassword(''); setClientPasswordModalOpen(true); }}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-xl px-4 py-2 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Lock size={12} /> SET PASSWORD
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── IAM Modal (Staff) ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-card bg-white dark:bg-[#121319] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border-slate-200 dark:border-white/10">
                        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                            <h3 className="font-display font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <Key size={18} className="text-blue-500" />
                                {editingUser ? 'Update Security Clearance' : 'New Identity Provisioning'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Full Legal Name</label>
                                    <input type="text" required className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Enter staff name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Email Address (Login)</label>
                                    <input type="email" required className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="name@gocarauto.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Access Level</label>
                                        <select className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                            <option value="Operator">Operator</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Mobile</label>
                                        <input type="text" className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="+20..." value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">
                                        {editingUser ? 'Override Password (Optional)' : 'Security Key (Password)'}
                                    </label>
                                    <input type="password" required={!editingUser} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors font-mono" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                                    <p className="text-[8px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-tight">Minimum 8 characters for high encryption</p>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full btn-primary bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 py-4 font-black uppercase tracking-widest text-xs">
                                {loading ? 'COMMITTING TO LEDGER...' : (editingUser ? 'CONFIRM SECURITY UPDATE' : 'PROVISION ACCOUNT')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Customer Password Modal ── */}
            {clientPasswordModalOpen && selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-card bg-white dark:bg-[#121319] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border-slate-200 dark:border-white/10">
                        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                            <h3 className="font-display font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <Lock size={18} className="text-green-500 dark:text-green-400" />
                                Set Portal Password
                            </h3>
                            <button onClick={() => setClientPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSetClientPassword} className="p-8 space-y-6">
                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Setting password for</div>
                                <div className="text-slate-900 dark:text-white font-black uppercase tracking-tight">{selectedClient.full_name}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{selectedClient.email || selectedClient.phone}</div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">New Portal Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-green-500/50 transition-colors font-mono"
                                    placeholder="Min. 6 characters"
                                    value={newClientPassword}
                                    onChange={(e) => setNewClientPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2">
                                <Lock size={16} /> CONFIRM &amp; SET PASSWORD
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CredentialManager;
