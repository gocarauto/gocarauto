import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPlus, Settings, Save, X, AlertTriangle, ShieldCheck } from 'lucide-react';

const CustomerForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        referral_source: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
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
                referral_source: customer.referral_source || '',
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
        <div className="space-y-8 pb-20 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">
                        {isEditMode ? 'Update Client Profile' : 'New Client Registration'}
                    </h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                        {isEditMode ? `Modifying records for Client ID: ${id}` : 'Registering a new client to the database'}
                    </p>
                </div>
                <button onClick={() => navigate('/customers')} className="btn-secondary">
                    <X size={16} /> CANCEL
                </button>
            </div>

            <div className="glass-card p-10 md:p-12">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl text-xs font-bold mb-10 flex items-center gap-3 uppercase tracking-wide">
                        <AlertTriangle size={20} className="text-red-500" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Primary Identity Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">
                                <span className="text-primary mr-2">01</span> PRIMARY IDENTITY
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Full Name <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. John Anderson"
                                    className="input-glass"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Phone <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="+20 1X XXX XXXX"
                                    className="input-glass"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Email Address
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

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Referral Source
                                </label>
                                <select
                                    name="referral_source"
                                    value={formData.referral_source}
                                    onChange={handleChange}
                                    className="input-glass appearance-none bg-black/40"
                                >
                                    <option value="" className="bg-gray-900 text-gray-400">SELECT SOURCE...</option>
                                    <option value="Google Search" className="bg-gray-900">Google Search</option>
                                    <option value="Facebook" className="bg-gray-900">Facebook</option>
                                    <option value="Friend Referral" className="bg-gray-900">Friend Referral</option>
                                    <option value="Walk-in" className="bg-gray-900">Walk-in</option>
                                    <option value="Other" className="bg-gray-900">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Intel Section */}
                    <div className="space-y-8 pt-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                                <Settings size={20} />
                            </div>
                            <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">
                                <span className="text-gray-500 mr-2">02</span> ADDITIONAL INFO
                            </h3>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="Client address..."
                                    className="input-glass resize-none p-4"
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Internal notes..."
                                    className="input-glass resize-none p-4"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-10 mt-10 border-t border-white/5">
                        <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">
                            CANCEL
                        </button>
                        <button type="submit" className="btn-primary min-w-[200px]" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'SAVING...' : isEditMode ? 'UPDATE CLIENT' : 'REGISTER CLIENT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm;
