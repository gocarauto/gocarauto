import React, { useState } from 'react';
import { AlertTriangle, Archive, X, Check, Info } from 'lucide-react';
import api from '../utils/api';

const PREDEFINED_REASONS = [
    {
        id: 'SOLD',
        label: 'Sold / Ownership Transferred',
        desc: 'Vehicle was sold or ownership transferred to another individual.'
    },
    {
        id: 'NEW_CAR',
        label: 'Owner Got a New Car',
        desc: 'Customer upgraded or purchased a replacement vehicle.'
    },
    {
        id: 'DECEASED_INACTIVE',
        label: 'Owner Inactive / Deceased',
        desc: 'Owner is no longer with us or customer account is inactive.'
    },
    {
        id: 'TOTAL_LOSS',
        label: 'Vehicle Scrapped / Total Loss',
        desc: 'Accident write-off, parted out, or vehicle scrapped.'
    },
    {
        id: 'OTHER',
        label: 'Other Reason',
        desc: 'Specify a custom operational reason below.'
    }
];

const ArchiveVehicleModal = ({ vehicle, isOpen, onClose, onArchived }) => {
    const [selectedReasonId, setSelectedReasonId] = useState('SOLD');
    const [otherReasonText, setOtherReasonText] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !vehicle) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const selectedOption = PREDEFINED_REASONS.find(r => r.id === selectedReasonId);
        let finalReason = selectedOption ? selectedOption.label : selectedReasonId;

        if (selectedReasonId === 'OTHER') {
            if (!otherReasonText.trim()) {
                setError('Please specify the custom reason for decommissioning.');
                return;
            }
            finalReason = `Other: ${otherReasonText.trim()}`;
        }

        setLoading(true);
        try {
            await api.post(`/vehicles/${vehicle.id}/archive`, {
                reason: finalReason,
                notes: notes.trim() || undefined
            });

            if (onArchived) {
                onArchived(vehicle.id, finalReason);
            }
            onClose();
        } catch (err) {
            console.error('Failed to archive vehicle:', err);
            setError(err.response?.data?.error || 'Failed to archive vehicle. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                        <Archive size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Decommission Vehicle
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                            Asset Archival & Reminder Disconnection
                        </p>
                    </div>
                </div>

                {/* Vehicle Target Card */}
                <div className="my-5 p-4 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                            {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Plate: {vehicle.license_plate || 'No Plate'} • VIN: {vehicle.vin || 'N/A'}
                        </div>
                    </div>
                    {vehicle.client_name && (
                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-black block">Owner</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{vehicle.client_name}</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reason Selection */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                            Reason for Decommissioning <span className="text-amber-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {PREDEFINED_REASONS.map((reason) => {
                                const isSelected = selectedReasonId === reason.id;
                                return (
                                    <label
                                        key={reason.id}
                                        onClick={() => setSelectedReasonId(reason.id)}
                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-amber-400/10 border-amber-500 text-slate-900 dark:text-white shadow-xs'
                                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 transition-all ${
                                            isSelected ? 'border-amber-500 bg-amber-400 text-slate-950' : 'border-slate-300 dark:border-white/20'
                                        }`}>
                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold leading-none">{reason.label}</div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{reason.desc}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom explanation if OTHER */}
                    {selectedReasonId === 'OTHER' && (
                        <div>
                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                                Specify Custom Reason <span className="text-amber-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="input-glass"
                                placeholder="eg. Exported abroad, impounded, etc."
                                value={otherReasonText}
                                onChange={(e) => setOtherReasonText(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Optional Notes */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                            Additional Operational Notes <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                        </label>
                        <textarea
                            className="input-glass min-h-[70px] resize-none"
                            placeholder="Add any relevant details (eg. new owner contact, date sold)..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Data Safety & Reminder Cancellation Notice */}
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2.5">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <span className="font-bold">Automated Reminder Cancellation:</span> Archiving this vehicle will immediately cancel all pending reminders and prevent any new notifications. Past invoices and work orders remain fully preserved.
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 font-bold"
                            disabled={loading}
                        >
                            <Archive size={16} />
                            {loading ? 'Decommissioning...' : 'Decommission & Archive'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArchiveVehicleModal;
