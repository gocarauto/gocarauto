import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Search, UserPlus, Pickaxe, MapPin, X, Target, Car, User, 
    Calendar, Gauge, Wrench, CheckCircle2, ChevronRight, Phone, ShieldCheck
} from 'lucide-react';

const ServiceRequestForm = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [clients, setClients] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Open');
    const [mileage, setMileage] = useState('');
    const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
    const [serviceType, setServiceType] = useState('Maintenance');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data.data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleClientSelect = async (clientId) => {
        const client = clients.find(c => c.id === parseInt(clientId));
        setSelectedClient(client);
        setError('');

        if (!client) return;

        try {
            const response = await api.get(`/clients/${clientId}`);
            const vehicleData = response.data.data.vehicles || [];
            setVehicles(vehicleData);
            if (vehicleData.length > 0) {
                setStep(2);
            } else {
                setError(`Client "${client.full_name}" has no registered vehicles. Please register a vehicle for this client first.`);
            }
        } catch (error) {
            console.error('Error fetching client vehicles:', error);
            setError('Could not retrieve client vehicle assets.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                clientId: selectedClient.id,
                vehicleId: selectedVehicle.id,
                status: status,
                serviceType: serviceType,
                mileage: parseInt(mileage) || 0,
                requestDate: requestDate,
                notes: notes
            };

            const response = await api.post('/service-requests', payload);
            const newRequestId = response.data.data.id;

            navigate(`/service-requests/${newRequestId}`);
        } catch (error) {
            console.error('Error creating service request:', error);
            setError(error.response?.data?.error || 'Failed to dispatch work order. Please verify parameters and try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-8 pb-20 w-full max-w-[2200px] mx-auto">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/80 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        New Service Work Order
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold mt-1">
                        Dispatch a new workshop service ticket for a registered client asset
                    </p>
                </div>
                <button onClick={() => navigate('/service-requests')} className="btn-secondary">
                    <X size={16} /> CANCEL
                </button>
            </div>

            {/* Expansive Master Card */}
            <div className="glass-card p-8 md:p-10 2xl:p-12 w-full">
                {/* Progress Tracker (Full Width) */}
                <div className="flex mb-10 gap-6">
                    <StepIndicator num="01" label="CLIENT SELECTION" active={step >= 1} current={step === 1} />
                    <StepIndicator num="02" label="VEHICLE ASSET" active={step >= 2} current={step === 2} />
                    <StepIndicator num="03" label="WORK ORDER PARAMETERS" active={step >= 3} current={step === 3} />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold mb-8 animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                            <span>{error}</span>
                        </div>
                        <button type="button" onClick={() => setError('')} className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1">
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* ── STEP 1: CLIENT SELECTION ── */}
                {step === 1 && (
                    <div className="animate-in fade-in duration-300 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    Step 01: Select Client
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    Search by client name, mobile phone, or email address
                                </p>
                            </div>
                            <Link to="/customers/new">
                                <button className="btn-secondary text-xs">
                                    <UserPlus size={15} /> + REGISTER NEW CLIENT
                                </button>
                            </Link>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={20} />
                            <input
                                type="text"
                                className="input-glass pl-14 h-14 text-sm"
                                placeholder="TYPE CLIENT NAME OR PHONE NUMBER TO SEARCH..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Expansive Responsive Client Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 max-h-[550px] overflow-y-auto pr-2">
                            {filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => handleClientSelect(client.id)}
                                    className="p-5 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 hover:border-amber-400/50 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                                                ID #{String(client.id).padStart(4, '0')}
                                            </span>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400/80 group-hover:scale-125 transition-transform" />
                                        </div>

                                        <div>
                                            <div className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-amber-500 dark:group-hover:text-primary transition-colors">
                                                {client.full_name}
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                                                <Phone size={12} className="text-slate-500 dark:text-slate-400" />
                                                <span>{client.phone}</span>
                                            </div>
                                            {client.email && (
                                                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                                    {client.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-500 dark:text-primary">
                                        <span>Select Client</span>
                                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}

                            {filteredClients.length === 0 && (
                                <div className="col-span-full py-16 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-widest">
                                    No clients matching search query. Click "+ Register New Client" to create one.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STEP 2: VEHICLE SELECTION ── */}
                {step === 2 && (
                    <div className="animate-in fade-in duration-300 space-y-6">
                        {/* Selected Client Summary Bar */}
                        <div className="p-5 bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-500 dark:text-primary font-black">
                                    <User size={22} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-primary">Selected Customer</div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase">{selectedClient?.full_name}</h4>
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{selectedClient?.phone}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link to={`/vehicles/new?clientId=${selectedClient?.id}`}>
                                    <button className="btn-secondary text-xs">
                                        + REGISTER NEW VEHICLE
                                    </button>
                                </Link>
                                <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 dark:hover:text-white text-xs font-bold uppercase transition-all">
                                    CHANGE CLIENT
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">
                                Step 02: Select Vehicle Asset
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">
                                Choose which vehicle to attach to this active work order
                            </p>
                        </div>

                        {/* Expansive Responsive Vehicle Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {vehicles.map(vehicle => (
                                <div
                                    key={vehicle.id}
                                    onClick={() => {
                                        setSelectedVehicle(vehicle);
                                        setStep(3);
                                    }}
                                    className="p-6 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 hover:border-amber-400/50 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-primary">
                                                {vehicle.year} MODEL
                                            </span>
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-amber-500 dark:group-hover:text-primary transition-colors">
                                                <Car size={16} />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-amber-500 dark:group-hover:text-primary transition-colors">
                                                {vehicle.make} {vehicle.model}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-xs font-mono">
                                                <span className="text-slate-600 dark:text-slate-400">LICENSE PLATE:</span>
                                                <span className="text-slate-900 dark:text-white font-bold" dir="auto">{vehicle.license_plate || 'N/A'}</span>
                                            </div>
                                            {vehicle.vin && (
                                                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                                                    <span className="text-slate-500 dark:text-slate-400">VIN:</span>
                                                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{vehicle.vin}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-500 dark:text-primary">
                                        <span>Select Asset</span>
                                        <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── STEP 3: WORK ORDER PARAMETERS & DIRECTIVES ── */}
                {step === 3 && (
                    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300 space-y-8">
                        {/* Summary Deck */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-500 dark:text-primary">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">CLIENT</span>
                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase">{selectedClient?.full_name}</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">{selectedClient?.phone}</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setStep(1)} className="text-[10px] text-amber-500 dark:text-primary hover:underline font-bold uppercase">
                                    Change
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                        <Car size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">VEHICLE ASSET</span>
                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase">{selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.year})</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono" dir="auto">Plate: {selectedVehicle?.license_plate || 'N/A'}</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setStep(2)} className="text-[10px] text-amber-500 dark:text-primary hover:underline font-bold uppercase">
                                    Change
                                </button>
                            </div>
                        </div>

                        {/* Standardized Master Grid (7 cols / 5 cols) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* Left Panel: Service Scope & Operational Parameters (7 cols) */}
                            <div className="lg:col-span-7 space-y-6 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-500 dark:text-primary">
                                        <Wrench size={16} />
                                    </div>
                                    <h4 className="text-sm font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        Service Scope & Timeline
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label htmlFor="service-classification" className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <span>Service Classification *</span>
                                        </label>
                                        <select
                                            id="service-classification"
                                            className="input-glass appearance-none bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white"
                                            value={serviceType}
                                            onChange={(e) => setServiceType(e.target.value)}
                                        >
                                            <option value="Maintenance" className="bg-white text-slate-900 dark:bg-neutral-900 dark:text-white">Periodic Maintenance (صيانة دورية)</option>
                                            <option value="Repair" className="bg-white text-slate-900 dark:bg-neutral-900 dark:text-white">Mechanical / Electrical Repair (إصلاح)</option>
                                            <option value="Inspection" className="bg-white text-slate-900 dark:bg-neutral-900 dark:text-white">Vehicle Diagnostic & Inspection (فحص)</option>
                                            <option value="Other" className="bg-white text-slate-900 dark:bg-neutral-900 dark:text-white">Other Custom Scope (أخرى)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="initial-floor-status" className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <span>Initial Floor Status</span>
                                        </label>
                                        <select
                                            id="initial-floor-status"
                                            className="input-glass appearance-none bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                        >
                                            <option value="Open" className="bg-white text-slate-900 dark:bg-neutral-900 dark:text-white">OPEN — PENDING INTAKE</option>
                                            <option value="In Progress" className="bg-white text-slate-900 dark:bg-neutral-900 dark:text-white">IN PROGRESS — ON FLOOR</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="service-intake-mileage" className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Gauge size={11} className="text-primary" />
                                            <span>Current Mileage (KM)</span>
                                        </label>
                                        <input
                                            id="service-intake-mileage"
                                            type="number"
                                            className="input-glass font-mono tracking-widest"
                                            value={mileage}
                                            onChange={(e) => setMileage(e.target.value)}
                                            placeholder="e.g. 78,500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="service-intake-date" className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Calendar size={11} className="text-slate-500 dark:text-slate-400" />
                                            <span>Intake Arrival Date *</span>
                                        </label>
                                        <input
                                            id="service-intake-date"
                                            type="date"
                                            className="input-glass font-mono tracking-widest"
                                            value={requestDate}
                                            onChange={(e) => setRequestDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Technician Directives & Notes (5 cols) */}
                            <div className="lg:col-span-5 space-y-6 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300">
                                            <Target size={16} />
                                        </div>
                                        <label htmlFor="service-workshop-notes" className="text-sm font-display font-black text-slate-900 dark:text-white uppercase tracking-wider cursor-pointer">
                                            Workshop Directives & Complaint
                                        </label>
                                    </div>

                                    <textarea
                                        id="service-workshop-notes"
                                        className="input-glass resize-none p-4 leading-relaxed flex-1 min-h-[170px]"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Record client complaint, required parts, technician notes, or special handling directives..."
                                    ></textarea>
                                </div>

                                <div className="pt-3 border-t border-slate-200/80 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-400 font-mono flex items-center justify-between">
                                    <span>TICKET DISPATCH: READY</span>
                                    <span className="text-amber-500 dark:text-primary font-bold">STATION 1</span>
                                </div>
                            </div>

                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-white/5">
                            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                                ← BACK TO VEHICLE
                            </button>
                            <button type="submit" className="btn-primary min-w-[240px]" disabled={loading}>
                                <Pickaxe size={18} />
                                {loading ? 'CREATING WORK ORDER...' : 'DISPATCH WORK ORDER'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const StepIndicator = ({ num, label, active, current }) => (
    <div className={`flex-1 flex flex-col gap-3 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-30'}`}>
        <div className={`h-1.5 rounded-full transition-all duration-500 ${current ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : active ? 'bg-blue-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black ${current ? 'text-amber-500 dark:text-primary' : 'text-slate-900 dark:text-white'}`}>{num}</span>
            <span className={`text-[10px] font-black tracking-widest uppercase ${current ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
        </div>
    </div>
);

export default ServiceRequestForm;
