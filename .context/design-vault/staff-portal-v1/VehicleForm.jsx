import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Wrench, Crosshair, Save, X, AlertTriangle, Car as CarIcon } from 'lucide-react';

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
            setClients(response.data.data);
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

    return (
        <div className="space-y-8 pb-20 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">
                        {isEditMode ? 'Update Vehicle Details' : 'New Vehicle Registration'}
                    </h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                        {isEditMode ? `Modifying specifications for Vehicle ID: ${id}` : 'Adding a new vehicle to the fleet'}
                    </p>
                </div>
                <button onClick={() => navigate('/vehicles')} className="btn-secondary">
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
                    {/* Owner Section */}
                    <div className="space-y-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                            Owner (Client) <span className="text-primary">*</span>
                        </label>
                        <select
                            name="client_id"
                            value={formData.client_id}
                            onChange={handleChange}
                            required
                            className="input-glass appearance-none bg-black/40"
                        >
                            <option value="" className="bg-gray-900">SELECT CLIENT...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id} className="bg-gray-900">
                                    {c.full_name} [{c.phone}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Specifications Section */}
                    <div className="space-y-8 pt-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Wrench size={20} />
                            </div>
                            <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">
                                <span className="text-primary mr-2">01</span> VEHICLE SPECIFICATIONS
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Make <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="make"
                                    value={formData.make}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. BMW"
                                    className="input-glass"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Model <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. M4 Competition"
                                    className="input-glass"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Year <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                    required
                                    className="input-glass"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    License Plate
                                </label>
                                <input
                                    type="text"
                                    name="license_plate"
                                    value={formData.license_plate}
                                    onChange={handleChange}
                                    placeholder="e.g. ABC 1234 or أ ب ج ١٢٣٤"
                                    className="input-glass font-mono tracking-wider"
                                    dir="auto"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Identification Section */}
                    <div className="space-y-8 pt-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                                <Crosshair size={20} />
                            </div>
                            <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">
                                <span className="text-gray-500 mr-2">02</span> IDENTIFICATION & MILEAGE
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    VIN
                                </label>
                                <input
                                    type="text"
                                    name="vin"
                                    value={formData.vin}
                                    onChange={handleChange}
                                    placeholder="17-Digit Identifier"
                                    className="input-glass uppercase font-mono tracking-widest"
                                    maxLength={17}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    Current Mileage (km)
                                </label>
                                <input
                                    type="number"
                                    name="current_mileage"
                                    value={formData.current_mileage}
                                    onChange={handleChange}
                                    placeholder="000,000"
                                    className="input-glass font-mono tracking-widest"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-10 mt-10 border-t border-white/5">
                        <button type="button" onClick={() => navigate('/vehicles')} className="btn-secondary">
                            CANCEL
                        </button>
                        <button type="submit" className="btn-primary min-w-[220px]" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'SAVING...' : isEditMode ? 'UPDATE VEHICLE' : 'REGISTER VEHICLE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleForm;
