import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Receipt, CreditCard, ChevronRight, Download, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const FinancialList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/financial');
            setInvoices(response.data.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = async (transactionId) => {
        try {
            const response = await api.get(`/financial/${transactionId}/view`);
            const newWindow = window.open('', '_blank');
            if (!newWindow) {
                alert('Please allow pop-ups for this site to view the invoice.');
                return;
            }
            newWindow.document.write(response.data);
            newWindow.document.close();
        } catch (error) {
            console.error('Error viewing invoice:', error);
            alert(`Failed to view invoice: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleOpenPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        const outstanding = invoice.total_amount_due - (invoice.amount_paid || 0);
        setPaymentAmount(outstanding);
        setPaymentMethod('Cash');
        setIsPaymentModalOpen(true);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/financial/${selectedInvoice.id}/payment`, {
                additionalAmount: Number(paymentAmount),
                paymentMethod: paymentMethod
            });
            setIsPaymentModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error('Error updating payment:', error);
            alert(`Failed to process payment: ${error.response?.data?.error || error.message}`);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Financial Treasury</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Settlements & Revenue Tracking</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-white/5 flex gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-inner">
                            <Receipt size={20} />
                        </div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">Treasury Log</h3>
                    </div>
                    <div className="badge badge-info flex items-center gap-2 px-4 py-2">
                        {invoices.length} TRANSACTIONS
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center animate-glow text-gray-500 font-bold tracking-widest text-xs uppercase">
                        LOADING FINANCIAL DATA...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Invoice #</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Client</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Amount Due</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center p-20 text-gray-500 font-bold tracking-widest text-xs uppercase">
                                            NO TRANSACTIONS FOUND.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5 font-mono font-black text-primary text-base tracking-widest">
                                                {inv.invoice_number}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-400">
                                                {formatDate(inv.created_at)}
                                            </td>
                                            <td className="px-8 py-5 font-black text-white uppercase tracking-tight">
                                                {inv.client_name}
                                            </td>
                                            <td className="px-8 py-5 font-black text-blue-400 text-base">
                                                {inv.total_amount_due ? `${parseFloat(inv.total_amount_due).toLocaleString()} EGP` : '0 EGP'}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border inline-flex items-center gap-2 ${
                                                    inv.payment_status === 'Paid' 
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                    {inv.payment_status === 'Paid' && <CheckCircle2 size={12} />}
                                                    {inv.payment_status === 'Paid' ? 'PAID' : 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {inv.client_phone && (
                                                        <a
                                                            href={`https://wa.me/${inv.client_phone.replace(/\\D/g, '')}?text=${encodeURIComponent('Hi ' + inv.client_name + ',\\nYour invoice ' + inv.invoice_number + ' from GoCar Auto is ready.\\nAmount Due: ' + inv.total_amount_due + ' EGP\\nThank you! 🚗')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="h-10 w-10 bg-green-500/10 hover:bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/20 hover:border-green-500/50 text-green-500 transition-all shadow-sm"
                                                            title="Send WhatsApp"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewInvoice(inv.id)}
                                                        className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/10 hover:border-primary/50 text-gray-400 hover:text-white transition-all shadow-sm"
                                                        title="View Invoice"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    {inv.payment_status !== 'Paid' && (
                                                        <button
                                                            onClick={() => handleOpenPaymentModal(inv)}
                                                            className="h-10 px-4 bg-primary hover:bg-primary-dark text-black rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                                                        >
                                                            <CreditCard size={14} />
                                                            PAY
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isPaymentModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">Process Payment</h3>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">Invoice #{selectedInvoice.invoice_number}</p>
                            </div>
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitPayment} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Total Due:</span>
                                    <span className="text-white font-black">{parseFloat(selectedInvoice.total_amount_due).toLocaleString()} EGP</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Already Paid:</span>
                                    <span className="text-green-400 font-black">{parseFloat(selectedInvoice.amount_paid || 0).toLocaleString()} EGP</span>
                                </div>
                                <div className="flex justify-between text-base border-t border-white/5 pt-4">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Outstanding:</span>
                                    <span className="text-amber-500 font-black">
                                        {parseFloat(selectedInvoice.total_amount_due - (selectedInvoice.amount_paid || 0)).toLocaleString()} EGP
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Payment Amount (EGP)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={selectedInvoice.total_amount_due - (selectedInvoice.amount_paid || 0)}
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="Cash" className="bg-neutral-900">Cash</option>
                                        <option value="Card" className="bg-neutral-900">Card</option>
                                        <option value="Bank Transfer" className="bg-neutral-900">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary-dark text-black rounded-xl font-black tracking-widest uppercase transition-all shadow-lg shadow-primary/20"
                            >
                                Confirm Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialList;
