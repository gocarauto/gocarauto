import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar, Plus, Trash2, Bell, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDate, isOverdue } from '../utils/dateUtils';

const ReminderManager = ({ clientId, vehicles }) => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState("");
    const [formData, setFormData] = useState({
        vehicleId: '',
        serviceType: '',
        dueDate: '',
        notes: ''
    });

    useEffect(() => {
        fetchReminders();
    }, [clientId]);

    const fetchReminders = async () => {
        try {
            const response = await api.get(`/reminders/client/${clientId}`);
            setReminders(response.data.data);
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/reminders', { ...formData, clientId });
            setShowForm(false);
            setFormData({ vehicleId: '', serviceType: '', dueDate: '', notes: '' });
            fetchReminders();
        } catch (error) {
            console.error('Failed to create reminder:', error);
            alert('Failed to create reminder.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this reminder?')) return;
        try {
            await api.delete(`/reminders/${id}`);
            fetchReminders();
        } catch (error) {
            console.error('Failed to delete reminder:', error);
        }
    };

    const handleSaveDate = async (rem) => {
        try {
            await api.put(`/reminders/${rem.id}`, {
                serviceType: rem.service_type,
                dueDate: editDate,
                notes: rem.notes,
                status: rem.status,
                intervalKm: rem.interval_km,
                intervalMonths: rem.interval_months
            });
            setEditingId(null);
            fetchReminders();
        } catch (error) {
            console.error('Failed to update due date:', error);
            alert('Failed to update date');
        }
    };

    if (loading) return <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest animate-pulse">Synchronizing Reminders...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-purple-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Reminders</h3>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="btn-secondary text-xs py-2"
                >
                    {showForm ? 'CANCEL' : '+ NEW REMINDER'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="glass-card p-6 bg-purple-500/5 border-purple-500/20 space-y-4 animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Vehicle Asset</label>
                            <select 
                                className="input-glass h-10 py-0 text-xs bg-slate-50 dark:bg-black/40 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white"
                                value={formData.vehicleId}
                                onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                                required
                            >
                                <option value="" className="bg-white dark:bg-gray-900">Select Vehicle...</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id} className="bg-white dark:bg-gray-900">
                                        {v.make} {v.model} {v.license_plate ? `(${v.license_plate})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Maintenance Scope</label>
                            <input 
                                type="text"
                                className="input-glass h-10 py-0 text-xs"
                                placeholder="eg. Oil Change, Tyre Service..."
                                value={formData.serviceType}
                                onChange={e => setFormData({...formData, serviceType: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Target Date</label>
                        <input 
                            type="date"
                            className="input-glass h-10 py-0 text-xs"
                            value={formData.dueDate}
                            onChange={e => setFormData({...formData, dueDate: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Protocol Notes</label>
                        <textarea 
                            className="input-glass text-xs p-3 min-h-[80px]"
                            placeholder="Details for the owner..."
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-xs bg-purple-500 text-black border-none shadow-purple-500/20">
                            {saving ? 'ENCRYPTING...' : 'INITIALIZE REMINDER'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {reminders.length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">No active reminders detected.</p>
                    </div>
                ) : (
                    reminders.map(reminder => (
                        <div key={reminder.id} className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isOverdue(reminder.due_date) ? 'bg-red-400 animate-pulse' : 'bg-purple-400'}`}></div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{reminder.service_type}</h4>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                        <span>{reminder.make} {reminder.model}</span>
                                        <span>•</span>
                                        {editingId === reminder.id ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="date" 
                                                    value={editDate} 
                                                    onChange={(e) => setEditDate(e.target.value)}
                                                    className="input-glass text-xs p-1 px-2 h-6 text-slate-900 dark:text-white bg-white dark:bg-black/40 border-purple-500/20 rounded"
                                                />
                                                <button onClick={() => handleSaveDate(reminder)} className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 h-6 rounded hover:bg-green-500/40">SAVE</button>
                                                <button onClick={() => setEditingId(null)} className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 h-6 rounded hover:bg-red-500/40">CANCEL</button>
                                            </div>
                                        ) : (
                                            <span 
                                                className={`cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors ${isOverdue(reminder.due_date) ? 'text-red-500 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}
                                                onClick={() => { setEditingId(reminder.id); setEditDate(reminder.due_date.split('T')[0]); }}
                                                title="Click to edit date"
                                            >
                                                {formatDate(reminder.due_date)}
                                            </span>
                                        )}
                                    </div>
                                    {reminder.notes && <p className="text-xs text-slate-600 dark:text-gray-400 mt-2 bg-slate-100 dark:bg-black/20 p-2 rounded border border-slate-200 dark:border-white/5">{reminder.notes}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-black" onClick={() => handleDelete(reminder.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReminderManager;
