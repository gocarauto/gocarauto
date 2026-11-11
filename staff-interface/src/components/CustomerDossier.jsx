import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import ReminderManager from './ReminderManager';
import { User, Mail, Phone, MapPin, Link as LinkIcon, Lock, Save, AlertTriangle, CheckCircle2, Copy, Shield, Settings, Activity, Car, CreditCard, Trash2, Edit2, Share2 } from 'lucide-react';

const CustomerDossier = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [magicLink, setMagicLink] = useState('');
    const [copyStatus, setCopyStatus] = useState('COPY');
    const [activeTab, setActiveTab] = useState('overview'); // overview, credentials, reminders

    // Password Reset State
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');

    useEffect(() => {
        fetchDossier();
    }, [id]);

    const fetchDossier = async () => {
        try {
            const clientRes = await api.get(`/clients/${id}`);
            const clientData = clientRes.data.data;
            setClient(clientData);
            setVehicles(clientData.vehicles || []);
        } catch (error) {
            console.error('Error fetching dossier:', error);
            setError('System Error: Could not retrieve client dossier.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        try {
            const response = await api.get(`/clients/${id}/magic-link`);
            setMagicLink(response.data.data.url);
        } catch (err) {
            console.error('Failed to generate magic link:', err);
            alert('Could not generate magic link.');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(magicLink);
        setCopyStatus('COPIED!');
        setTimeout(() => setCopyStatus('COPY'), 2000);
    };

    const handleDeleteVehicle = async (vehicleId, make, model) => {
        if (!window.confirm(`Are you sure you want to remove the ${make} ${model} from the fleet? This action cannot be undone.`)) {
            return;
        }
        try {
            await api.delete(`/vehicles/${vehicleId}`);
            setVehicles(vehicles.filter(v => v.id !== vehicleId));
            alert('Vehicle removed successfully.');
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            alert('Could not delete vehicle. It may have associated service requests that prevent deletion.');
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }
        
        setResetLoading(true);
        setResetSuccess('');
        try {
            await api.post(`/clients/${id}/reset-password`, { newPassword });
            setResetSuccess('Credentials successfully updated.');
            setNewPassword('');
            setTimeout(() => setResetSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to reset password:', err);
            alert('Could not reset credentials.');
        } finally {
            setResetLoading(false);
        }
    };

    if (loading) return (
        <div className="p-20 text-center animate-glow text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">
            LOADING DOSSIER...
        </div>
    );
    
    if (error) return (
        <div className="glass-card p-10 mt-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4">
                <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">SYSTEM ERROR</h3>
            <p className="text-red-500 dark:text-red-400 font-bold">{error}</p>
        </div>
    );
    
    if (!client) return (
        <div className="glass-card p-10 mt-10 text-center text-slate-600 dark:text-slate-400 font-bold tracking-widest uppercase">
            CLIENT RECORD NOT FOUND.
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">Client Intelligence</h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold mt-1">
                        Dossier for {client.full_name}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/customers')} className="btn-secondary">
                        RETURN TO DIRECTORY
                    </button>
                    <Link to={`/customers/${id}/edit`}>
                        <button className="btn-primary">
                            MODIFY RECORDS
                        </button>
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200/80 dark:border-white/10 gap-8">
                <TabButton 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')}
                    icon={<Activity size={14} />}
                    label="DOSSIER OVERVIEW"
                    activeColor="text-amber-500 dark:text-primary border-amber-400 dark:border-primary"
                />
                <TabButton 
                    active={activeTab === 'credentials'} 
                    onClick={() => setActiveTab('credentials')}
                    icon={<Shield size={14} />}
                    label="SECURITY & CREDENTIALS"
                    activeColor="text-blue-500 border-blue-500"
                />
                <TabButton 
                    active={activeTab === 'reminders'} 
                    onClick={() => setActiveTab('reminders')}
                    icon={<Activity size={14} />}
                    label="SERVICE REMINDERS"
                    activeColor="text-purple-500 border-purple-500"
                />
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8 animate-in fade-in duration-300">
                    {/* Profile Information Card */}
                    <div className="glass-card p-10 h-fit space-y-8">
                        <div className="text-center relative">
                            <div className="absolute inset-0 bg-primary/5 rounded-full"></div>
                            <div className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-black/50 border border-amber-400/30 flex items-center justify-center text-4xl mx-auto mb-4 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                                <span className="drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">👤</span>
                            </div>
                            <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">{client.full_name}</h3>
                            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-black tracking-widest uppercase">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
                                Active Client
                            </div>
                        </div>

                        <div className="space-y-4">
                            <InfoRow icon={<Mail size={14} />} label="EMAIL" value={client.email || 'NO EMAIL ON RECORD'} />
                            <InfoRow icon={<Phone size={14} />} label="PHONE" value={client.phone} highlight={true} />
                            <InfoRow icon={<MapPin size={14} />} label="ADDRESS" value={client.address || 'UNDISCLOSED LOCATION'} />
                            <InfoRow icon={<LinkIcon size={14} />} label="SOURCE" value={client.referral_source || 'ORGANIC ACQUISITION'} />
                            {client.referred_by_name && (
                                <InfoRow 
                                    icon={<Share2 size={14} className="text-amber-500 dark:text-amber-400" />} 
                                    label="REFERRED BY" 
                                    value={`${client.referred_by_name} (${client.referred_by_phone || 'Client'})`} 
                                    highlight={true} 
                                />
                            )}
                        </div>

                        {/* ── Referral Network Section ── */}
                        {client.referredClients && client.referredClients.length > 0 && (
                            <div className="pt-6 border-t border-slate-200/80 dark:border-white/5 space-y-3">
                                <div className="text-xs font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Share2 size={13} /> Referral Network</span>
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono text-xs">
                                        {client.referredClients.length} Referred
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                    {client.referredClients.map(ref => (
                                        <div key={ref.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">{ref.full_name}</span>
                                                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{ref.phone}</span>
                                            </div>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                                                {parseFloat(ref.total_spent || 0).toLocaleString()} EGP
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-slate-200/80 dark:border-white/5 space-y-4">
                            <div className="text-xs font-black uppercase tracking-widest text-amber-500 dark:text-primary flex items-center gap-2">
                                <Shield size={14} /> Portal Access Gateway
                            </div>
                            
                            {!magicLink ? (
                                <button onClick={handleGenerateLink} className="w-full btn-secondary border-amber-400/20 hover:border-amber-400/50 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white justify-center">
                                    GENERATE SECURE ACCESS LINK
                                </button>
                            ) : (
                                <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
                                    <div className="font-mono text-xs text-slate-700 dark:text-slate-400 break-all bg-white dark:bg-black/60 p-3 rounded-xl border border-slate-200 dark:border-white/5 max-h-24 overflow-y-auto">
                                        {magicLink}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={copyToClipboard} className="flex-1 btn-primary justify-center text-xs">
                                            <Copy size={14} /> {copyStatus}
                                        </button>
                                        <WhatsAppButton phone={client.phone} customerName={client.full_name} customerId={client.id} size="md" showText={true} magicLink={magicLink} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-200/80 dark:border-white/5 space-y-2">
                            <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                <Settings size={14} /> Intelligence Notes
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                {client.notes || 'No intelligence notes on file.'}
                            </p>
                        </div>
                    </div>

                    <div className="glass-card p-10 h-fit">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 dark:text-primary">
                                    <Car size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Fleet Repository</h3>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-black tracking-widest uppercase">Registered Vehicles</div>
                                </div>
                            </div>
                            <div className="badge badge-info">{vehicles.length} IDENTIFIED</div>
                        </div>

                        {vehicles.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                                <p className="text-slate-600 dark:text-slate-400 text-xs font-black tracking-widest uppercase mb-4">NO VEHICLES REGISTERED.</p>
                                <Link to="/vehicles/new"><button className="btn-secondary">+ ADD ASSET TO FLEET</button></Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {vehicles.map(vehicle => (
                                    <div key={vehicle.id} className="p-6 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 rounded-2xl transition-all group">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-amber-500 dark:text-primary mb-1 opacity-80 group-hover:opacity-100">{vehicle.year} MODEL</div>
                                                <h4 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 group-hover:text-amber-500">{vehicle.make} {vehicle.model}</h4>
                                                <div className="flex gap-8">
                                                    <div>
                                                        <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">PLATE ID</div>
                                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-1" dir="auto">{vehicle.license_plate || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">VIN HASH</div>
                                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-1">{vehicle.vin || 'UNDISCLOSED'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link to={`/vehicles/${vehicle.id}/edit`}>
                                                    <button className="h-10 w-10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl flex items-center justify-center border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all shadow-sm">
                                                        <Edit2 size={16} />
                                                    </button>
                                                </Link>
                                                <button onClick={() => handleDeleteVehicle(vehicle.id, vehicle.make, vehicle.model)} className="h-10 w-10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl flex items-center justify-center border border-slate-200/80 dark:border-white/10 hover:border-red-500/50 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                                <Link to={`/vehicles/${vehicle.id}`}>
                                                    <button className="h-10 w-10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 group-hover:text-amber-500 dark:group-hover:text-primary transition-all">
                                                        →
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'credentials' && (
                <div className="animate-in fade-in duration-300 glass-card p-8 md:p-10 w-full max-w-4xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500"><Lock size={24} /></div>
                        <div>
                            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Security Credentials</h3>
                            <p className="text-xs font-black tracking-widest text-slate-600 dark:text-slate-400 uppercase mt-1">Manage portal authentication</p>
                        </div>
                    </div>
                    {resetSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-3 uppercase tracking-wide"><CheckCircle2 size={16} />{resetSuccess}</div>}
                    <form onSubmit={handlePasswordReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 ml-4">NEW OVERRIDE PASSWORD</label>
                            <div className="relative"><Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" /><input type="password" className="input-glass pl-12 font-mono" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-200/80 dark:border-white/5"><button type="submit" className="btn-primary bg-blue-500 hover:bg-blue-400 text-black shadow-blue-500/20" disabled={resetLoading}>{resetLoading ? 'PROCESSING...' : 'OVERRIDE CREDENTIALS'}</button></div>
                    </form>
                </div>
            )}

            {activeTab === 'reminders' && (
                <div className="animate-in fade-in duration-300 glass-card p-8 md:p-10 w-full">
                    <ReminderManager clientId={id} vehicles={vehicles} />
                </div>
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label, activeColor }) => (
    <button onClick={onClick} className={`pb-4 text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${active ? activeColor : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'}`}>
        {icon} {label}
    </button>
);

const InfoRow = ({ icon, label, value, highlight }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-200/80 dark:border-white/5 last:border-0 group">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200/80 dark:border-white/10 group-hover:bg-slate-200 dark:group-hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors">{icon}</div>
            <span className="text-xs font-black tracking-widest text-slate-600 dark:text-slate-400 uppercase">{label}</span>
        </div>
        <span className={`text-sm font-bold text-right ${highlight ? 'text-amber-500 dark:text-primary' : 'text-slate-900 dark:text-slate-200'} uppercase max-w-[60%] truncate`}>{value}</span>
    </div>
);

export default CustomerDossier;
