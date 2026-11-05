import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { Search, UserPlus, FileText, Pickaxe, MapPin, X, Target, Car } from 'lucide-react';

const ServiceRequestForm = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [clients, setClients] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
            setClients(response.data.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleClientSelect = async (clientId) => {
        const client = clients.find(c => c.id === parseInt(clientId));
        setSelectedClient(client);

        if (!client) return;

        try {
            const response = await api.get(`/clients/${clientId}`);
            const vehicleData = response.data.data.vehicles || [];
            setVehicles(vehicleData);
            if (vehicleData.length > 0) {
                setStep(2);
            } else {
                alert('ALERT: No vehicles assigned to this client. Register a vehicle first.');
            }
        } catch (error) {
            console.error('Error fetching client vehicles:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

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
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-8 pb-20 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">New Service Request</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Create a new service ticket for a client vehicle</p>
                </div>
                <button onClick={() => navigate('/service-requests')} className="btn-secondary">
                    <X size={16} /> CANCEL
                </button>
            </div>

            <div className="glass-card p-10 md:p-12">
                {/* Progress Tracker */}
                <div className="flex mb-12 gap-4">
                    <StepIndicator num="01" label="CLIENT" active={step >= 1} current={step === 1} />
                    <StepIndicator num="02" label="VEHICLE" active={step >= 2} current={step === 2} />
                    <StepIndicator num="03" label="DETAILS" active={step >= 3} current={step === 3} />
                </div>

                {step === 1 && (
                    <div className="animate-in fade-in duration-300">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest mb-8">CLIENT SELECTION</h3>
                        
                        <div className="relative mb-6">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                className="input-glass pl-14 h-14 text-base"
                                placeholder="SEARCH CLIENT BY NAME OR PHONE..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 divide-y divide-white/5">
                            {filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => handleClientSelect(client.id)}
                                    className="p-5 cursor-pointer hover:bg-white/5 transition-all group flex items-center justify-between"
                                >
                                    <div>
                                        <div className="font-bold text-white text-lg tracking-tight uppercase group-hover:text-primary transition-colors">{client.full_name}</div>
                                        <div className="font-mono text-sm text-gray-400 mt-1">{client.phone}</div>
                                    </div>
                                    <Target className="text-gray-600 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" size={20} />
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <Link to="/customers/new">
                                <button className="btn-secondary w-full md:w-auto mx-auto border-white/20">
                                    <UserPlus size={16} /> REGISTER NEW CLIENT
                                </button>
                            </Link>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-8">
                            <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">VEHICLE SELECTION</h3>
                            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mt-2">
                                CLIENT: <span className="text-primary">{selectedClient.full_name}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {vehicles.map(vehicle => (
                                <div
                                    key={vehicle.id}
                                    onClick={() => {
                                        setSelectedVehicle(vehicle);
                                        setMileage(vehicle.last_service_mileage || vehicle.current_mileage || '');
                                        setStep(3);
                                    }}
                                    className="p-6 border border-white/10 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/5 hover:border-primary/50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                                        <Car size={100} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="font-black text-white text-xl uppercase tracking-tighter group-hover:text-primary transition-colors">{vehicle.make} {vehicle.model}</div>
                                        <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2 flex flex-col gap-1">
                                            <span>PLATE: {vehicle.license_plate || 'N/A'}</span>
                                            <span className="text-primary/70">{vehicle.year} MODEL</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 flex flex-col md:flex-row gap-4">
                            <button onClick={() => setStep(1)} className="btn-secondary md:w-1/3">BACK</button>
                            <Link to="/vehicles/new" className="flex-1 w-full">
                                <button className="btn-secondary w-full border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50">
                                    <Car size={16} /> REGISTER NEW VEHICLE
                                </button>
                            </Link>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300 space-y-10">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">REQUEST DETAILS</h3>

                        <div className="bg-white/[0.02] rounded-2xl p-6 border border-primary/20 flex gap-8">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">CLIENT</div>
                                <div className="font-black text-white text-lg tracking-tight uppercase">{selectedClient.full_name}</div>
                            </div>
                            <div className="w-px bg-white/10"></div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">VEHICLE</div>
                                <div className="font-black text-white text-lg tracking-tight uppercase">{selectedVehicle.make} {selectedVehicle.model}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">STATUS</label>
                                <select
                                    className="input-glass appearance-none bg-black/40"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="Open" className="bg-gray-900">OPEN</option>
                                    <option value="In Progress" className="bg-gray-900">IN PROGRESS</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">CURRENT MILEAGE (KM) <span className="opacity-50">(OPTIONAL)</span></label>
                                <input
                                    type="number"
                                    className="input-glass font-mono tracking-widest"
                                    value={mileage}
                                    onChange={(e) => setMileage(e.target.value)}
                                    placeholder="000,000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">SERVICE DATE</label>
                                <input
                                    type="date"
                                    className="input-glass font-mono tracking-widest"
                                    value={requestDate}
                                    onChange={(e) => setRequestDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">SERVICE TYPE</label>
                            <select
                                className="input-glass appearance-none bg-black/40"
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                            >
                                <option value="Maintenance" className="bg-gray-900">Maintenance</option>
                                <option value="Repair" className="bg-gray-900">Repair</option>
                                <option value="Inspection" className="bg-gray-900">Inspection</option>
                                <option value="Other" className="bg-gray-900">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">NOTES / REQUEST INFO</label>
                            <textarea
                                className="input-glass resize-none p-4 min-h-[150px]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Details about the service request..."
                            ></textarea>
                        </div>

                        <div className="flex gap-4 pt-8 border-t border-white/5">
                            <button type="button" onClick={() => setStep(2)} className="btn-secondary w-1/3">BACK</button>
                            <button type="submit" className="btn-primary w-2/3" disabled={loading}>
                                <Pickaxe size={18} />
                                {loading ? 'SAVING...' : 'CREATE REQUEST'}
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
        <div className={`h-1.5 rounded-full transition-all duration-500 ${current ? 'bg-primary shadow-[0_0_15px_rgba(251,191,36,0.5)]' : active ? 'bg-blue-500' : 'bg-white/10'}`}></div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black ${current ? 'text-primary' : 'text-white'}`}>{num}</span>
            <span className={`text-[10px] font-black tracking-widest uppercase ${current ? 'text-white' : 'text-gray-500'}`}>{label}</span>
        </div>
    </div>
);

export default ServiceRequestForm;
