import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVehicleSketch } from '../utils/sketchHelper';
import { formatDate } from '../utils/dateUtils';
import { 
    Activity, Clock, User, Car, FileText, CheckCircle2, AlertCircle, 
    Zap, ChevronRight, Wrench, ClipboardList, Info, Download, Trash2, MessageCircle
} from 'lucide-react';

const ServiceRequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [request, setRequest] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [addMode] = useState('manual');

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceData, setInvoiceData] = useState({
        serviceFee: '',
        sparePartsMarkup: 0,
        taxRate: 14
    });

    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderForm, setReminderForm] = useState({
        serviceType: '',
        intervalMonths: 8,
        intervalKm: 10000,
        notes: ''
    });

    const [_serviceItems, setServiceItems] = useState([]);
    const [newItem, setNewItem] = useState({
        itemId: '',
        itemName: '',
        itemNameAr: '',
        quantity: 1,
        unitPrice: 0,
        notes: ''
    });

    const [bulkItems, setBulkItems] = useState([
        { itemName: '', itemNameAr: '', quantity: 1, unitPrice: 0, notes: '' }
    ]);
    const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
    const [whatsappText, setWhatsappText] = useState('');

    const [isEditingMileage, setIsEditingMileage] = useState(false);
    const [tempMileage, setTempMileage] = useState('');

    const [users, setUsers] = useState([]);
    const [assignedTo, setAssignedTo] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchRequestDetails();
        fetchServiceItems();
        fetchUsers();
        fetchComments();
    }, [id]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await api.get(`/service-requests/${id}/comments`);
            setComments(response.data.data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const fetchRequestDetails = async (options = {}) => {
        try {
            const response = await api.get(`/service-requests/${id}`, options);
            const requestData = response.data?.data;
            if (!requestData) {
                throw new Error('Mission data not found');
            }
            setRequest(requestData);
            setAssignedTo(requestData.assigned_to_name || requestData.assigned_to || '');
            setRecords(requestData.records || []);
            setError('');
        } catch (error) {
            console.error('Error fetching request details:', error);
            setError('System Link Failure: Could not synchronize operation data.');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setError('');
        setLoading(true);
        fetchRequestDetails({ skipCache: true });
        fetchServiceItems();
        fetchUsers();
        fetchComments();
    };

    const fetchServiceItems = async () => {
        try {
            const response = await api.get('/service-items');
            setServiceItems(response.data.data);
        } catch (error) {
            console.error('Error fetching service items:', error);
        }
    };

    const handleAssign = async (technicianId) => {
        try {
            await api.patch(`/service-requests/${id}/assign`, { technicianId });
            setAssignedTo(technicianId);
            fetchRequestDetails();
        } catch (error) {
            console.error('Error assigning technician:', error);
            alert('Failed to assign technician.');
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/service-requests/${id}/comments`, { 
                authorName: user?.name || 'Staff', 
                content: newComment 
            });
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment.');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.patch(`/service-requests/${id}/status`, { status: newStatus });
            if (newStatus === 'Completed' || newStatus === 'Complete' || newStatus === 'Invoiced') {
                const detectedRules = [];
                const rules = [
                    { match: ['engine oil', 'زيت موتور', 'زيت ١٠٠٠٠', 'زيت 10000', 'زيت توتال', 'زيت شيل', 'زيت كوارتز'], type: 'تغيير زيت الموتور', months: 8, km: 10000 },
                    { match: ['transmission', 'فتيس'], type: 'تغيير زيت الفتيس', months: 24, km: 30000 },
                    { match: ['brake fluid', 'زيت فرامل', 'زيت باور'], type: 'تغيير زيت الفرامل', months: 24, km: 40000 },
                    { match: ['coolant', 'مياه ردياتير', 'مياه خضراء', 'مياه حمراء'], type: 'تغيير مياه التبريد', months: 24, km: 40000 },
                    { match: ['filter', 'فلتر هواء', 'فلتر تكييف', 'فيلتر'], type: 'تغيير الفلاتر', months: 12, km: 15000 }
                ];
                
                records.forEach(r => {
                    const name = ((r.item_name || '') + ' ' + (r.item_name_ar || '')).toLowerCase();
                    rules.forEach(rule => {
                        if (rule.match.some(keyword => name.includes(keyword))) {
                            if (!detectedRules.some(dr => dr.type === rule.type)) {
                                detectedRules.push(rule);
                            }
                        }
                    });
                });

                if (detectedRules.length > 0) {
                    const targetRule = detectedRules[0];
                    try {
                        const dupRes = await api.get(`/reminders/check?vehicleId=${request.vehicle_id}&serviceType=${encodeURIComponent(targetRule.type)}`);
                        if (!dupRes.data.data.exists) {
                            const requestDateStr = request.request_date ? request.request_date.split('T')[0] : new Date().toISOString().split('T')[0];
                            setReminderForm({
                                serviceType: targetRule.type,
                                intervalMonths: targetRule.months,
                                intervalKm: targetRule.km,
                                notes: `Auto-detected from service request #${id}\nLast done: ${requestDateStr}`
                            });
                            setShowReminderModal(true);
                        }
                    } catch (e) {
                        console.error('Duplicate check failed', e);
                    }
                }
            }
            fetchRequestDetails();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleCreateReminder = async () => {
        try {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + parseInt(reminderForm.intervalMonths));
            
            await api.post('/reminders', {
                clientId: request.client_id,
                vehicleId: request.vehicle_id,
                serviceType: reminderForm.serviceType,
                dueDate: dueDate.toISOString().split('T')[0],
                notes: reminderForm.notes,
                intervalKm: parseInt(reminderForm.intervalKm),
                intervalMonths: parseInt(reminderForm.intervalMonths)
            });
            setShowReminderModal(false);
        } catch (error) {
            console.error('Error creating reminder:', error);
            alert('Failed to set reminder.');
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                requestId: parseInt(id),
                itemId: addMode === 'dropdown' ? parseInt(newItem.itemId) : null,
                quantity: parseFloat(newItem.quantity),
                unitPrice: parseFloat(newItem.unitPrice),
                notes: newItem.notes
            };

            if (addMode === 'manual') {
                const itemResponse = await api.post('/service-items', {
                    itemName: newItem.itemName,
                    itemNameAr: newItem.itemNameAr,
                    category: 'Service',
                    salePrice: newItem.unitPrice
                });
                payload.itemId = itemResponse.data.data.id;
                fetchServiceItems();
            }

            await api.post('/service-records', payload);
            setShowAddItem(false);
            setNewItem({ itemId: '', itemName: '', itemNameAr: '', quantity: 1, unitPrice: 0, notes: '' });
            fetchRequestDetails();
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const handleParseWhatsApp = () => {
        if (!whatsappText) return;
        
        // Protocol: Convert Arabic numerals (٠-٩) to English (0-9)
        const convertArabicNumerals = (str) => {
            const map = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
            return str.replace(/[٠-٩]/g, d => map[d]);
        };

        const lines = whatsappText.split('\n');
        const parsedItems = lines.map(line => {
            // Clean and normalize
            const rawLine = convertArabicNumerals(line.replace(/^\d+[.)]\s*/, '').replace(/^-\s*/, '').trim());
            if (!rawLine) return null;

            // Strategy: Split by common delimiters or large spaces
            let [p1, p2] = rawLine.split(/[-:|\t]|\s{2,}/).map(s => s.trim());
            let name = p1;
            let price = p2;

            // Intelligent Fallback: Check if price is at start or end of string
            if (!price || isNaN(parseFloat(price))) {
                const startMatch = rawLine.match(/^(\d+(?:\.\d+)?)\s+(.*)$/);
                if (startMatch) {
                    price = startMatch[1];
                    name = startMatch[2].trim();
                } else {
                    const endMatch = rawLine.match(/^(.*)\s+(\d+(?:\.\d+)?)$/);
                    if (endMatch) {
                        name = endMatch[1].trim();
                        price = endMatch[2];
                    }
                }
            }

            if (!name) return null;

            return {
                itemName: name,
                itemNameAr: name, // Protocol: Populate both to satisfy backend mandatory fields
                quantity: 1,
                unitPrice: parseFloat(price) || 0,
                notes: ''
            };
        }).filter(item => item !== null);

        if (parsedItems.length > 0) {
            setBulkItems(parsedItems);
            setShowBulkAdd(true);
        }
    };

    const handleBulkAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            // WHY: Single network round-trip batch operation instead of N sequential/parallel HTTP calls
            const validItems = bulkItems.filter(item => item.itemName || item.itemNameAr);
            if (validItems.length === 0) {
                setSubmitting(false);
                return;
            }

            const bulkEnsureResponse = await api.post('/service-items/bulk-ensure', {
                items: validItems.map(item => ({
                    itemName: item.itemName || item.itemNameAr,
                    itemNameAr: item.itemNameAr || item.itemName,
                    category: 'Service',
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    quantity: parseFloat(item.quantity) || 1,
                    notes: item.notes || ''
                }))
            });

            const finalItems = bulkEnsureResponse.data.data;

            await api.post('/service-records/bulk', {
                requestId: parseInt(id),
                items: finalItems
            });

            await fetchRequestDetails();
            setShowBulkAdd(false);
            setBulkItems([{ itemName: '', itemNameAr: '', quantity: 1, unitPrice: 0, notes: '' }]);
            setWhatsappText('');
        } catch (err) {
            console.error('Bulk add error:', err);
            alert('Failed to save bulk items.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateInvoice = async () => {
        try {
            const isUpdate = request.status === 'Invoiced' || request.status === 'Paid';
            const endpoint = isUpdate ? '/financial/update-invoice' : '/financial/generate-invoice';
            const method = isUpdate ? 'put' : 'post';
            
            const response = await api[method](endpoint, {
                requestId: id,
                serviceFee: parseFloat(invoiceData.serviceFee === '' ? projectedFee : invoiceData.serviceFee),
                sparePartsMarkup: parseFloat(invoiceData.sparePartsMarkup || 0),
                taxRate: parseFloat(invoiceData.taxRate || 14)
            });
            const transactionId = response.data.data.id;
            setShowInvoiceModal(false);
            await fetchRequestDetails();
            handleViewInvoice(transactionId);
        } catch (error) {
            console.error('Error generating/updating invoice:', error);
        }
    };

    const handleViewInvoice = async (transactionId) => {
        try {
            let txId = transactionId || request.invoice?.id;
            if (!txId) {
                const financialResponse = await api.get(`/financial?requestId=${id}`);
                if (financialResponse.data.data.length > 0) txId = financialResponse.data.data[0].id;
                else return;
            }
            const response = await api.get(`/financial/${txId}/view`);
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(response.data);
                newWindow.document.close();
            }
        } catch (error) {
            console.error('Error viewing invoice:', error);
        }
    };

    const handleDeleteRequest = async () => {
        if (!window.confirm('DELETE THIS OPERATION RECORD?')) return;
        try {
            await api.delete(`/service-requests/${id}`);
            navigate('/service-requests');
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    const handleUpdateMileage = async () => {
        try {
            await api.patch(`/service-requests/${id}/mileage`, { mileage: parseInt(tempMileage) });
            setIsEditingMileage(false);
            fetchRequestDetails();
        } catch (error) {
            console.error('Error updating mileage:', error);
        }
    };

    if (loading) return (
        <div className="p-20 text-center animate-glow text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">
            LOADING OPERATION INTEL...
        </div>
    );
    
    if (error) return (
        <div className="p-20 text-center">
             <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-500 p-8 rounded-3xl text-sm font-bold flex flex-col items-center gap-4 uppercase tracking-widest max-w-lg mx-auto">
                <AlertCircle size={40} />
                {error}
                <button onClick={handleRetry} className="btn-secondary mt-4">RETRY MISSION</button>
            </div>
        </div>
    );

    if (!request) return <div className="p-20 text-center text-slate-600 dark:text-slate-400 uppercase font-black">MISSION DATA NOT FOUND.</div>;

    const vehicleParts = request.vehicle_info ? request.vehicle_info.split(' ') : ['Generic', 'Vehicle'];
    const totalAmount = records.reduce((sum, r) => sum + (r.total_price || 0), 0);
    const sketchBg = getVehicleSketch(vehicleParts[0], vehicleParts[1]) || '/sketches/generic-car.png';
    const isAdmin = user?.role === 'Admin';
    const canEditItems = (request.status !== 'Invoiced' && request.status !== 'Paid') || isAdmin;

    const calculateServiceFee = (subtotal) => {
        if (subtotal <= 0) return 0;
        if (subtotal <= 10000) return subtotal * 0.15;
        if (subtotal <= 20000) return subtotal * 0.14;
        if (subtotal <= 30000) return subtotal * 0.13;
        if (subtotal <= 40000) return subtotal * 0.12;
        if (subtotal <= 50000) return subtotal * 0.11;
        return subtotal * 0.10;
    };
    const projectedFee = calculateServiceFee(totalAmount);

    return (
        <div className="space-y-8 pb-20">
            {/* Mission Hero Section */}
            <div className="relative overflow-hidden glass-card p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none grayscale brightness-200" 
                     style={{ backgroundImage: `url('${sketchBg}')`, backgroundSize: 'contain', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat' }}></div>
                
                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="badge badge-warning text-xs font-black uppercase tracking-widest px-3 py-1 bg-amber-500/10 border-amber-500/20 text-amber-500">
                            OP #{String(request.id || '').padStart(5, '0')}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                            request.status === 'Completed' || request.status === 'Paid' ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' : 
                            request.status === 'In Progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400 animate-pulse' :
                            'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }`}>
                            {request.status?.toUpperCase()}
                        </div>
                        {request.source === 'PORTAL' && <div className="text-xs font-black text-amber-600 dark:text-amber-500 drop-shadow-[0_0_5px_currentColor]">✦ PORTAL ORIGIN</div>}
                    </div>
                    <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                        {request.client_name || 'N/A'}
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold mt-2 flex items-center gap-2">
                        <Car size={14} className="text-primary" /> {request.vehicle_info || 'Unknown Vehicle'}
                    </p>
                </div>

                <div className="relative z-10 flex flex-wrap gap-3">
                    {request.status !== 'Invoiced' && request.status !== 'Paid' && (
                        <>
                            <button className="btn-secondary text-xs" onClick={() => handleStatusChange('Waiting for Parts')}>WAITING FOR PARTS</button>
                            <button className="btn-secondary text-xs" onClick={() => handleStatusChange('In Progress')}>ENGAGE</button>
                            <button className="btn-primary text-xs bg-green-500 text-black border-none" onClick={() => handleStatusChange('Completed')}>COMPLETE MISSION</button>
                        </>
                    )}
                    {(request.status === 'Completed' || request.status === 'Complete') && (
                        <button className="btn-primary text-xs" onClick={() => {
                            setInvoiceData({ serviceFee: projectedFee, sparePartsMarkup: request.spare_parts_markup || 0, taxRate: request.tax_rate || 14 });
                            setShowInvoiceModal(true);
                        }}>GENERATE INVOICE</button>
                    )}
                    {(request.status === 'Invoiced' || request.status === 'Paid') && (
                        <>
                            {isAdmin && <button className="btn-secondary text-xs" onClick={() => {
                                setInvoiceData({ serviceFee: request.service_fee || projectedFee, sparePartsMarkup: request.spare_parts_markup || 0, taxRate: request.tax_rate || 14 });
                                setShowInvoiceModal(true);
                            }}>UPDATE INVOICE</button>}
                            <button className="btn-primary text-xs flex items-center gap-2" onClick={() => handleViewInvoice()}>
                                <Download size={14} /> VIEW INVOICE
                            </button>
                        </>
                    )}
                    <button className="btn-secondary border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={handleDeleteRequest}><Trash2 size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Financial Exposure" value={`${(request.total_amount_due || totalAmount || 0).toLocaleString()} EGP`} sub={request.invoice_number ? 'Finalized Amount' : 'Current Ledger Total'} color="text-primary" />
                <StatCard title="Mission Elapsed" value={`${request.days_open || 0} DAYS`} sub="Total Operational Time" color="text-blue-600 dark:text-blue-400" />
                <StatCard title="Fleet Status" value={(request.status || 'N/A').toUpperCase()} sub="Current Phase" color="text-green-600 dark:text-green-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                <div className="space-y-8">
                    <div className="glass-card overflow-hidden">
                        <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-3">
                            <Wrench size={18} className="text-primary" />
                            <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-widest">Operations Ledger</h3>
                        </div>
                        {canEditItems && (
                            <div className="flex gap-2">
                                <button className="btn-secondary text-xs py-2" onClick={() => { setShowAddItem(!showAddItem); setShowBulkAdd(false); }}>{showAddItem ? 'CLOSE' : 'ADD ITEM'}</button>
                                <button className="btn-secondary text-xs py-2 border-primary/30 text-primary" onClick={() => { setShowBulkAdd(!showBulkAdd); setShowAddItem(false); }}>{showBulkAdd ? 'CLOSE' : 'BULK IMPORT'}</button>
                            </div>
                        )}
                    </div>

                    {showAddItem && <div className="p-8 bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/5 animate-in slide-in-from-top duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="md:col-span-2">
                                <FormInput label="Operation Item" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} placeholder="Engine Oil, Filter, Brake Pads..." />
                            </div>
                            <FormInput label="Qty" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} type="number" />
                            <FormInput label="Unit Price (EGP)" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: e.target.value})} type="number" />
                        </div>
                        <FormInput label="Mission Notes" value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} />
                        <button className="btn-primary w-full text-xs mt-6" onClick={handleAddItem}>SAVE OPERATION ENTRY</button>
                    </div>}

                    {showBulkAdd && <div className="p-10 bg-slate-100/70 dark:bg-black/40 border-b border-slate-200 dark:border-white/10 animate-in slide-in-from-top duration-300 space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-4 text-left">
                                <div className="text-xs font-black text-[#25D366] uppercase tracking-widest px-4 flex justify-between items-end">
                                    <span>Incoming Log Parser</span>
                                    <span className="opacity-70 italic">e.g., 1. Oil - 2500</span>
                                </div>
                                <textarea 
                                    className="input-glass bg-white dark:bg-black/60 border-slate-200 dark:border-white/5 h-40 p-5 text-xs font-medium focus:border-[#25D366]/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                                    placeholder="PASTE WHATSAPP LOG HERE..."
                                    value={whatsappText}
                                    onChange={e => setWhatsappText(e.target.value)}
                                ></textarea>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleParseWhatsApp} className="h-12 w-full bg-slate-900 text-white dark:bg-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary transition-all">
                                        <Wrench size={16} /> PARSE DATA
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const url = `https://wa.me/${request.client_phone?.replace(/[+ -]/g, '')}?text=${encodeURIComponent(whatsappText)}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="h-12 bg-[#25D366] text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                                    >
                                        <Zap size={16} /> SEND MSG
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <div className="text-xs font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest px-4 text-left">
                                    Remote Fleet Sync (Sheets)
                                </div>
                                <div className="bg-white dark:bg-black/60 p-5 rounded-3xl border border-slate-200 dark:border-white/5 h-40 flex flex-col justify-center gap-4">
                                    <FormInput label="Sheet Protocol URL" placeholder="https://docs.google.com/spreadsheets/..." value={googleSheetsUrl} onChange={e => setGoogleSheetsUrl(e.target.value)} />
                                </div>
                                <button className="h-12 w-full bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 opacity-50 cursor-not-allowed" disabled>
                                    <Zap size={16} /> SYNC FROM REMOTE
                                </button>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                            <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.3em] mb-8 text-center bg-slate-200/60 dark:bg-white/5 py-2 rounded-lg text-left px-5">Review Bulk Staging Rows</div>
                            <div className="grid grid-cols-1 gap-5">
                                {bulkItems.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-200 dark:border-white/5 group hover:border-slate-300 dark:hover:border-white/10 transition-all">
                                        <div className="flex-1 w-full text-left">
                                            <FormInput label={`Item #${idx + 1}`} value={item.itemName} onChange={e => {
                                                const newItems = [...bulkItems];
                                                newItems[idx].itemName = e.target.value;
                                                setBulkItems(newItems);
                                            }} />
                                        </div>
                                        <div className="w-full md:w-24 text-left">
                                            <FormInput label="Qty" value={item.quantity} onChange={e => {
                                                const newItems = [...bulkItems];
                                                newItems[idx].quantity = e.target.value;
                                                setBulkItems(newItems);
                                            }} type="number" />
                                        </div>
                                        <div className="w-full md:w-40 text-left">
                                            <FormInput label="Price (EGP)" value={item.unitPrice} onChange={e => {
                                                const newItems = [...bulkItems];
                                                newItems[idx].unitPrice = e.target.value;
                                                setBulkItems(newItems);
                                            }} type="number" />
                                        </div>
                                        {canEditItems && (
                                            <button onClick={() => {
                                                const newItems = [...bulkItems];
                                                newItems.splice(idx, 1);
                                                setBulkItems(newItems.length ? newItems : [{ itemName: '', itemNameAr: '', quantity: 1, unitPrice: 0, notes: '' }]);
                                            }} className="h-14 w-14 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-5 mt-10">
                                <button className="btn-secondary flex-1 py-4 text-xs font-black" onClick={() => setBulkItems([...bulkItems, { itemName: '', itemNameAr: '', quantity: 1, unitPrice: 0, notes: '' }])}>+ ADD ROW</button>
                                <button 
                                    className={`flex-2 py-4 text-xs font-black rounded-2xl transition-all shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] ${submitting ? 'bg-primary/50 text-white cursor-wait' : 'bg-primary text-black hover:scale-[1.02]'}`}
                                    onClick={handleBulkAdd}
                                    disabled={submitting}
                                >
                                    {submitting ? 'SAVING MISSION LOG...' : 'SAVE BULK ITEMS'}
                                </button>
                            </div>
                        </div>
                    </div>}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 text-left">Component / Description</th>
                                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 text-right">Qty</th>
                                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 text-right">Unit Price</th>
                                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-bold uppercase tracking-tight">
                                {records.length === 0 ? (
                                    <tr><td colSpan="4" className="p-20 text-center text-slate-500 dark:text-slate-500 font-bold text-xs">NO ENTRIES RECORDED IN MISSION LOG.</td></tr>
                                ) : (
                                    records.map(record => (
                                        <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-5 text-left">
                                                <div className="text-slate-900 dark:text-white text-sm">{record.item_name}</div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1" dir="rtl">{record.item_name_ar}</div>
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{record.quantity}</td>
                                            <td className="px-8 py-5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{(parseFloat(record.unit_price) || 0).toLocaleString()} EGP</td>
                                            <td className="px-8 py-5 text-right text-primary">{(parseFloat(record.total_price) || 0).toLocaleString()} EGP</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-slate-100/60 dark:bg-black/40 font-black uppercase tracking-widest">
                                <tr>
                                    <td colSpan="3" className="px-8 py-6 text-right text-xs text-slate-600 dark:text-slate-400">Subtotal Ledger</td>
                                    <td className="px-8 py-6 text-right text-slate-900 dark:text-white">{(totalAmount || 0).toLocaleString()} EGP</td>
                                </tr>
                                {request.invoice_number && (
                                    <>
                                        <tr className="text-blue-600 dark:text-blue-400/80">
                                            <td colSpan="3" className="px-8 py-2 text-right text-xs">Operational Surcharge</td>
                                            <td className="px-8 py-2 text-right text-xs">{(parseFloat(request.service_fee || 0) + parseFloat(request.spare_parts_markup || 0)).toLocaleString()} EGP</td>
                                        </tr>
                                        <tr className="bg-primary/5">
                                            <td colSpan="3" className="px-8 py-8 text-right text-sm text-primary">Final Settlement</td>
                                            <td className="px-8 py-8 text-right text-2xl text-primary font-display tracking-tighter">{(parseFloat(request.total_amount_due) || 0).toLocaleString()} EGP</td>
                                        </tr>
                                    </>
                                )}
                            </tfoot>
                        </table>
                    </div>
                    </div>

                    {/* Internal Notes & Timeline */}
                    <div className="glass-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageCircle size={18} className="text-primary" />
                            <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-widest">Internal Notes & Timeline</h3>
                        </div>
                        <div className="space-y-4 max-h-80 overflow-y-auto mb-6 pr-2">
                            {comments.length === 0 ? (
                                <div className="text-center text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest py-8">No internal notes yet.</div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="bg-slate-100 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-primary">{comment.author_name}</span>
                                            <span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(comment.created_at)}</span>
                                        </div>
                                        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                className="input-glass flex-1 text-sm" 
                                placeholder="Add a note or update..." 
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                            />
                            <button className="btn-primary px-6" onClick={handlePostComment}>POST</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-8 space-y-6 text-left">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock size={18} className="text-blue-500" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest text-left">Protocol Logs</h3>
                        </div>
                        
                        <IntelligenceItem label="Mission Initiation" value={formatDate(request.request_date || request.created_at)} />
                        <IntelligenceItem label="Primary Target" value={request.client_name} />
                        
                        <div className="flex justify-between items-center gap-4 py-1 text-left">
                            <div className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Assigned Tech</div>
                            <div className="h-px border-b border-dashed border-slate-200 dark:border-white/10 flex-1 mb-1"></div>
                            <select 
                                className="bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white p-1 focus:border-primary/50 outline-none w-32"
                                value={assignedTo || ''}
                                onChange={(e) => handleAssign(e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-200 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-left">
                                <IntelligenceLabel text="Fleet Asset" />
                                {!isEditingMileage && <button onClick={() => { setIsEditingMileage(true); setTempMileage(request.mileage || 0); }} className="text-xs font-black text-primary hover:underline">CALIBRATE KM</button>}
                            </div>
                            <div className="text-sm text-slate-900 dark:text-white font-bold text-left">{request.vehicle_info}</div>
                            {isEditingMileage ? (
                                <div className="flex gap-2">
                                    <input type="number" className="input-glass h-10 py-0 flex-1 text-xs" value={tempMileage} onChange={e => setTempMileage(e.target.value)} autoFocus />
                                    <button onClick={handleUpdateMileage} className="h-10 px-3 bg-green-500 text-black rounded-xl font-black text-xs">FIX</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-left">
                                    <Zap size={14} className="text-amber-500" />
                                    <span className="text-xl font-display font-black text-slate-900 dark:text-white tracking-widest">{(request.mileage || 0).toLocaleString()} <span className="text-xs text-slate-600 dark:text-slate-400 align-middle">KM</span></span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-white/5 space-y-3">
                            <IntelligenceLabel text="Mission Parameters" />
                            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 whitespace-pre-wrap text-left">
                                {request.notes || 'NO EXTRA PARAMETERS DEFINED.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showInvoiceModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="glass-card p-12 max-w-md w-full border-primary/20 bg-white dark:bg-[#121319]">
                    <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 text-left">Finalize Treasury Report</h3>
                    <div className="space-y-6">
                        <FormInput label={`Platform Fee (Automated: ${projectedFee.toLocaleString()} EGP)`} value={invoiceData.serviceFee} onChange={e => setInvoiceData({...invoiceData, serviceFee: e.target.value})} type="number" />
                        <FormInput label="Inventory Margin (EGP)" value={invoiceData.sparePartsMarkup} onChange={e => setInvoiceData({...invoiceData, sparePartsMarkup: e.target.value})} type="number" />
                        <FormInput label="Tax Resolution (%)" value={invoiceData.taxRate} onChange={e => setInvoiceData({...invoiceData, taxRate: e.target.value})} type="number" />
                    </div>
                    <div className="flex gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-white/5">
                        <button className="flex-1 btn-secondary text-xs" onClick={() => setShowInvoiceModal(false)}>ABORT</button>
                        <button className="flex-2 btn-primary text-xs" onClick={handleGenerateInvoice}>COMMIT REPORT</button>
                    </div>
                </div>
            </div>}

            {showReminderModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="glass-card p-12 max-w-md w-full border-blue-500/20 bg-white dark:bg-[#121319]">
                    <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 text-left text-blue-600 dark:text-blue-400">Set Service Reminder</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-8 text-left">We detected a service that requires a recurring reminder. You can customize the scope or details below.</p>
                    <div className="space-y-6">
                        <FormInput label="Service Scope" value={reminderForm.serviceType} onChange={e => setReminderForm({...reminderForm, serviceType: e.target.value})} />
                        <FormInput label="Interval (Months)" value={reminderForm.intervalMonths} onChange={e => setReminderForm({...reminderForm, intervalMonths: e.target.value})} type="number" />
                        <FormInput label="Interval (KM)" value={reminderForm.intervalKm} onChange={e => setReminderForm({...reminderForm, intervalKm: e.target.value})} type="number" />
                        <FormInput label="Internal Notes" value={reminderForm.notes} onChange={e => setReminderForm({...reminderForm, notes: e.target.value})} />
                    </div>
                    <div className="flex gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-white/5">
                         <button className="flex-1 btn-secondary text-xs" onClick={() => setShowReminderModal(false)}>SKIP</button>
                         <button className="flex-2 btn-primary text-xs bg-blue-500 text-black border-none" onClick={handleCreateReminder}>SET REMINDER</button>
                    </div>
                </div>
            </div>}
        </div>
    );
};

const StatCard = ({ title, value, sub, color }) => (
    <div className="glass-card p-8 relative group overflow-hidden text-left">
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
        <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">{title}</div>
        <div className={`text-3xl font-display font-black tracking-tighter mb-1 ${color}`}>{value}</div>
        <div className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{sub}</div>
    </div>
);

const IntelligenceItem = ({ label, value }) => (
    <div className="flex justify-between items-end gap-4 py-1 text-left">
        <div className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</div>
        <div className="h-px border-b border-dashed border-slate-200 dark:border-white/10 flex-1 mb-1"></div>
        <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight text-right">{value}</div>
    </div>
);

const IntelligenceLabel = ({ text }) => <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 text-left">{text}</div>;

const FormInput = ({ label, value, onChange, type = "text", placeholder = "" }) => (
    <div className="space-y-2 text-left">
        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-4">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="input-glass font-mono tracking-widest w-full" />
    </div>
);

export default ServiceRequestDetail;
