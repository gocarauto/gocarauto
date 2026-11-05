import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import { Search, UserCog, History, ChevronRight, ShieldCheck } from 'lucide-react';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api.get(`/clients?search=${searchTerm}`);
                setCustomers(response.data.data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, [searchTerm]);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Client Registry</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Management of registered service partners</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="badge badge-success px-4 py-2">
                        <ShieldCheck size={14} className="mr-2 inline" />
                        {customers.length} REGISTERED
                    </div>
                    <Link to="/customers/new">
                        <button className="btn-primary">
                            + REGISTER NEW CLIENT
                        </button>
                    </Link>
                </div>
            </div>

            {/* High-Tech Search Bar */}
            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        className="input-glass pl-14 h-14 text-base"
                        placeholder="SEARCH CLIENTS BY NAME, EMAIL, OR PHONE..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-white/5 flex gap-4 items-center">
                    <UsersIcon />
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">Mission Partners</h3>
                    <div className="ml-auto animate-pulse badge badge-success flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        STABLE
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center animate-glow text-gray-500 font-bold tracking-widest text-xs uppercase">
                        LOADING RECORDS...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Client Name</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Contact</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Total Spent</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center p-20 text-gray-500 font-bold tracking-widest text-xs uppercase">
                                            DATABASE EMPTY: NO CLIENTS FOUND.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="font-black text-white text-lg tracking-tight uppercase">{customer.full_name}</div>
                                                <div className="text-xs text-gray-500 font-bold uppercase mt-1">ID: {String(customer.id).padStart(4, '0')}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-bold text-primary">{customer.phone}</div>
                                                <div className="text-xs text-gray-500 mt-1">{customer.email || '---'}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-base font-black text-white">
                                                    {customer.total_spent ? `${parseFloat(customer.total_spent).toLocaleString()} EGP` : '0 EGP'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/customers/${customer.id}`}>
                                                        <button className="h-10 px-4 bg-primary hover:bg-primary-dark text-black rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center gap-1 transition-all shadow-lg shadow-primary/20">
                                                            PROFILE
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </Link>
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
        </div>
    );
};

const UsersIcon = () => (
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
);

export default CustomerList;
