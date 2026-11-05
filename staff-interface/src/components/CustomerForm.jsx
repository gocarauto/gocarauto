import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPlus, Settings, Save, X, AlertTriangle, ShieldCheck, Phone, Mail, MapPin, Share2, FileText, CheckCircle2 } from 'lucide-react';

const CustomerForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        referral_source: 'Friend Referral',
        referred_by_client_id: '',
        notes: ''
    });
    const [existingClients, setExistingClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch client list for referrer attribution
        api.get('/clients?sortBy=full_name&order=ASC')
            .then(res => setExistingClients(res.data?.data || []))
            .catch(() => {});

        if (isEditMode) {
            fetchCustomer();
        }
    }, [id]);

    const fetchCustomer = async () => {
        try {
            const response = await api.get(`/clients/${id}`);
            const customer = response.data.data;
            setFormData({
                full_name: customer.full_name,
                email: customer.email || '',
                phone: customer.phone,
                address: customer.address || '',
                referral_source: customer.referral_source || 'Friend Referral',
                referred_by_client_id: customer.referred_by_client_id || '',
                notes: customer.notes || ''
            });
        } catch (error) {
            console.error('Error fetching client:', error);
            setError('System Link Failure: Could not synchronize client data.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                fullName: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                referralSource: formData.referral_source,
                referredByClientId: formData.referred_by_client_id || null,
                notes: formData.notes
            };

            if (isEditMode) {
                await api.put(`/clients/${id}`, payload);
            } else {
                await api.post('/clients', payload);
            }
            navigate('/customers');
        } catch (error) {
            console.error('Error saving client:', error);
            setError(error.response?.data?.error || 'Authorization Failure: Could not commit data to registry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 w-full max-w-[2200px] mx-auto">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">
                        {isEditMode ? 'Update Client Profile' : 'New Client Registration'}
                    </h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                        {isEditMode ? `Modifying records for Client ID: ${id}` : 'Registering a new client into the garage central repository'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">
                        <X size={16} /> CANCEL
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="btn-primary min-w-[180px]" 
                        disabled={loading}
                    >
                        <Save size={18} />
                        {loading ? 'SAVING...' : isEditMode ? 'UPDATE CLIENT' : 'REGISTER CLIENT'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 uppercase tracking-wide">
                    <AlertTriangle size={20} className="text-red-500" />
                    {error}
                </div>
            )}

            {/* Expansive Form Canvas */}
            <div className="glass-card p-8 md:p-10 2xl:p-12 w-full">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Standardized 3-Column Master Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* ── Panel 1: Core Identification ── */}
                        <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 pb-4 mb-6 border-b border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">
                                            01. Primary Identity
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            Client Identification
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                            <span>Full Legal Name</span>
                                            <span className="text-primary">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            placeholder="e.g. Ahmed Hafez"
                                            required
                                            className="input-glass"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                            <Phone size={11} className="text-primary" />
                                            <span>Primary Phone (WhatsApp)</span>
                                            <span className="text-primary">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="01XXXXXXXXX"
                                            required
                                            className="input-glass font-mono"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                            <Mail size={11} className="text-gray-400" />
                                            <span>Email Address</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="name@domain.com"
                                            className="input-glass"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                <CheckCircle2 size={13} />
                                <span>Direct WhatsApp Gateway Linked</span>
                            </div>
                        </div>

                        {/* ── Panel 2: Contact & Demographics ── */}
                        <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 pb-4 mb-6 border-b border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">
                                            02. Demographics & Source
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            Address & Acquisition
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                            <Share2 size={11} className="text-gray-400" />
                                            <span>Referral Source</span>
                                        </label>
                                        <select
                                            name="referral_source"
                                            value={formData.referral_source}
                                            onChange={handleChange}
                                            className="input-glass appearance-none bg-black/40"
                                        >
                                            <option value="Friend Referral" className="bg-gray-900">Word of Mouth / Client Referral</option>
                                            <option value="Direct Call" className="bg-gray-900">Direct Inbound Call</option>
                                            <option value="Corporate Fleet" className="bg-gray-900">Corporate Fleet Account</option>
                                            <option value="Other" className="bg-gray-900">Other</option>
                                        </select>
                                    </div>

                                    {/* ── Referred By Client Linkage ── */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                                            <span>⭐ Referred By Existing Client</span>
                                        </label>
                                        <select
                                            name="referred_by_client_id"
                                            value={formData.referred_by_client_id}
                                            onChange={handleChange}
                                            className="input-glass appearance-none bg-black/40 border-amber-500/30 text-white"
                                        >
                                            <option value="" className="bg-gray-900 text-gray-400">-- NO REFERRING CLIENT LINKED --</option>
                                            {existingClients
                                                .filter(c => !id || c.id !== parseInt(id, 10))
                                                .map(c => (
                                                    <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                                                        {c.full_name} ({c.phone})
                                                    </option>
                                                ))}
                                        </select>
                                        <p className="text-[9px] text-gray-400">Links this new client to their referrer for network LTV attribution</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                            <MapPin size={11} className="text-gray-400" />
                                            <span>Physical / Workshop Address</span>
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder="Street name, district, area (e.g. New Cairo, 5th Settlement, Cairo)..."
                                            className="input-glass resize-none p-4 leading-relaxed"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-500 font-mono">
                                GEODATA: EGYPT (CAIRO/GIZA METRO)
                            </div>
                        </div>

                        {/* ── Panel 3: Workshop Notes & Preferences ── */}
                        <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center gap-3 pb-4 mb-6 border-b border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">
                                            03. Workshop Intel & Notes
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            Internal Directives
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                        <Settings size={11} className="text-gray-400" />
                                        <span>Customer Directives, VIP Tags, or Preferences</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Record special customer requirements, VIP privileges, payment habits, corporate fleet billing terms, or technician handling instructions..."
                                        className="input-glass resize-none p-4 leading-relaxed flex-1 min-h-[160px]"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                <span>ENCRYPTION: AES-256</span>
                                <span className="text-primary font-bold">VIP COMPATIBLE</span>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                            Mandatory fields marked with <span className="text-primary">*</span>
                        </span>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">
                                CANCEL
                            </button>
                            <button type="submit" className="btn-primary min-w-[200px]" disabled={loading}>
                                <Save size={18} />
                                {loading ? 'SAVING...' : isEditMode ? 'UPDATE CLIENT' : 'REGISTER CLIENT'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm;
