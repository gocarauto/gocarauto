import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Wrench, Crosshair, Save, X, AlertTriangle, Car as CarIcon, User, ShieldCheck, Gauge, Hash, Calendar } from 'lucide-react';

const VehicleForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        client_id: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: '',
        current_mileage: ''
    });
    const [originalClientId, setOriginalClientId] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClients();
        if (isEditMode) {
            fetchVehicle();
        }
    }, [id]);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data.data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchVehicle = async () => {
        try {
            const response = await api.get(`/vehicles/${id}`);
            const vehicle = response.data.data;

            let latestMileage = vehicle.current_mileage || '';
            
            // Auto-pull latest mileage from history
            try {
                const historyRes = await api.get(`/service-requests?vehicleId=${id}`);
                const requests = historyRes.data.data;
                if (requests && requests.length > 0) {
                    const maxMileage = Math.max(...requests.map(r => r.mileage || 0));
                    if (maxMileage > (latestMileage || 0)) {
                        latestMileage = maxMileage;
                    }
                }
            } catch (historyErr) {
                console.error('Could not fetch vehicle history for mileage', historyErr);
            }

            setOriginalClientId(vehicle.client_id);
            setFormData({
                client_id: vehicle.client_id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                license_plate: vehicle.license_plate || '',
                vin: vehicle.vin || '',
                current_mileage: latestMileage
            });
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            setError('System Link Failure: Could not synchronize vehicle data.');
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
                clientId: formData.client_id,
                make: formData.make,
                model: formData.model,
                year: parseInt(formData.year),
                licensePlate: formData.license_plate,
                vin: formData.vin,
                currentMileage: parseInt(formData.current_mileage) || 0
            };

            if (isEditMode) {
                // If owner has changed, execute ownership transfer protocol
                if (formData.client_id && String(formData.client_id) !== String(originalClientId)) {
                    const targetClient = clients.find(c => String(c.id) === String(formData.client_id));
                    const clientName = targetClient ? targetClient.full_name : 'New Owner';
                    const confirmTransfer = window.confirm(
                        `⚠️ WARNING: Transfer Ownership\n\nAre you sure you want to transfer this vehicle to ${clientName}?\nThis will reassign all active service requests, pending reminders, and ledger entries.`
                    );
                    if (!confirmTransfer) {
                        setLoading(false);
                        return;
                    }
                    await api.patch(`/vehicles/${id}/transfer`, { newClientId: formData.client_id });
                }
                await api.put(`/vehicles/${id}`, payload);
            } else {
                await api.post('/vehicles', payload);
            }
            navigate('/vehicles');
        } catch (error) {
            console.error('Error saving vehicle:', error);
            setError(error.response?.data?.error || 'Registration Failure: Could not commit vehicle to registry.');
        } finally {
            setLoading(false);
        }
    };

    const selectedClient = clients.find(c => String(c.id) === String(formData.client_id));

    return (
        <div className="space-y-8 pb-20 w-full max-w-[2200px] mx-auto">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/80 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {isEditMode ? 'Modify Vehicle Record' : 'Intake New Fleet Asset'}
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold mt-1">
                        {isEditMode ? `Updating telemetry for Asset #${id}` : 'Register a new customer vehicle into the master fleet repository'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/vehicles')} className="btn-secondary">
                        <X size={16} /> CANCEL
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="btn-primary min-w-[200px]" 
                        disabled={loading}
                    >
                        <Save size={18} />
                        {loading ? 'SAVING...' : isEditMode ? 'UPDATE VEHICLE' : 'REGISTER VEHICLE'}
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
                        
                        {/* ── Panel 1: Asset Ownership & Client ── */}
                        <div className="space-y-6 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200/80 dark:border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            01. Asset Ownership
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">
                                            Registered Proprietor
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="vehicle-client-id" className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <span>Registered Client *</span>
                                        </label>
                                        <select
                                            id="vehicle-client-id"
                                            name="client_id"
                                            value={formData.client_id}
                                            onChange={handleChange}
                                            required
                                            className="input-glass appearance-none bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white font-medium"
                                        >
                                            <option value="" className="bg-white text-slate-600 dark:bg-neutral-900 dark:text-slate-400">SELECT CLIENT FROM REGISTRY...</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id} className="bg-white text-slate-900 dark:bg-neutral-900 dark:text-white">
                                                    {c.full_name} ({c.phone})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedClient ? (
                                        <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2 text-xs">
                                            <div className="text-xs font-black text-amber-500 dark:text-primary uppercase tracking-wider flex items-center gap-1.5">
                                                <ShieldCheck size={13} />
                                                <span>Active Client Verified</span>
                                            </div>
                                            <div className="font-bold text-slate-900 dark:text-white uppercase">{selectedClient.full_name}</div>
                                            <div className="text-slate-600 dark:text-slate-400 font-mono text-xs">{selectedClient.phone}</div>
                                            {selectedClient.address && (
                                                <div className="text-slate-600 dark:text-slate-400 text-xs truncate">{selectedClient.address}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-600 dark:text-slate-400 text-xs">
                                            <span>No client selected yet. Choose an owner above.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>TOTAL CLIENTS: {clients.length}</span>
                                <Link to="/customers/new" className="text-amber-500 dark:text-primary hover:underline font-bold uppercase">
                                    + Add New Client
                                </Link>
                            </div>
                        </div>

                        {/* ── Panel 2: Vehicle Specifications ── */}
                        <div className="space-y-6 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200/80 dark:border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300">
                                        <CarIcon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            02. Vehicle Identification
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">
                                            Make, Model & Plate
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="vehicle-make" className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <span>Make *</span>
                                            </label>
                                            <input
                                                id="vehicle-make"
                                                type="text"
                                                name="make"
                                                value={formData.make}
                                                onChange={handleChange}
                                                placeholder="e.g. BMW, Mercedes"
                                                required
                                                className="input-glass"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="vehicle-model" className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <span>Model *</span>
                                            </label>
                                            <input
                                                id="vehicle-model"
                                                type="text"
                                                name="model"
                                                value={formData.model}
                                                onChange={handleChange}
                                                placeholder="e.g. 320i, C200"
                                                required
                                                className="input-glass"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="vehicle-year" className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Calendar size={11} className="text-slate-500 dark:text-slate-400" />
                                                <span>Year *</span>
                                            </label>
                                            <input
                                                id="vehicle-year"
                                                type="number"
                                                name="year"
                                                value={formData.year}
                                                onChange={handleChange}
                                                min="1950"
                                                max={new Date().getFullYear() + 2}
                                                required
                                                className="input-glass font-mono"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="vehicle-license-plate" className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Hash size={11} className="text-slate-500 dark:text-slate-400" />
                                                <span>License Plate</span>
                                            </label>
                                            <input
                                                id="vehicle-license-plate"
                                                type="text"
                                                name="license_plate"
                                                value={formData.license_plate}
                                                onChange={handleChange}
                                                placeholder="e.g. س ع د 1234"
                                                className="input-glass font-mono tracking-wider"
                                                dir="auto"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                                ARABIC / ENGLISH PLATES SUPPORTED
                            </div>
                        </div>

                        {/* ── Panel 3: Telemetry & VIN Identifier ── */}
                        <div className="space-y-6 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200/80 dark:border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300">
                                        <Crosshair size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            03. Telemetry & VIN
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">
                                            Odometer & Chassis Number
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="vehicle-current-mileage" className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Gauge size={11} className="text-primary" />
                                            <span>Current Mileage (KM)</span>
                                        </label>
                                        <input
                                            id="vehicle-current-mileage"
                                            type="number"
                                            name="current_mileage"
                                            value={formData.current_mileage}
                                            onChange={handleChange}
                                            placeholder="e.g. 78,500"
                                            className="input-glass font-mono tracking-wider text-base"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="vehicle-vin" className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Hash size={11} className="text-slate-500 dark:text-slate-400" />
                                            <span>VIN Chassis Code (17-Digit)</span>
                                        </label>
                                        <input
                                            id="vehicle-vin"
                                            type="text"
                                            name="vin"
                                            value={formData.vin}
                                            onChange={handleChange}
                                            placeholder="17-Digit Identifier..."
                                            maxLength={17}
                                            className="input-glass uppercase font-mono tracking-widest"
                                        />
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                        <div className="font-bold text-slate-900 dark:text-white uppercase">Automated Telemetry Sync</div>
                                        <div>Mileage updates will automatically synchronize with next scheduled maintenance cycles.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                                <span>TELEMETRY: ACTIVE</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">READY</span>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-white/5">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                            Mandatory fields marked with <span className="text-primary">*</span>
                        </span>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => navigate('/vehicles')} className="btn-secondary">
                                CANCEL
                            </button>
                            <button type="submit" className="btn-primary min-w-[220px]" disabled={loading}>
                                <Save size={18} />
                                {loading ? 'SAVING...' : isEditMode ? 'UPDATE VEHICLE' : 'REGISTER VEHICLE'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleForm;
