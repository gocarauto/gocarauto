import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Car, DollarSign, ExternalLink, ShieldCheck,
    CheckCircle, Clock, AlertCircle, Plus, Search, Tag,
    TrendingUp, FileText, X, ArrowRight, UserCheck, Eye
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const STAGE_CONFIG = {
    'Intake': { label: 'Intake & Inspection', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    'Staged': { label: 'Staged (Photos Taken)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    'Listed': { label: 'Active on Marketplaces', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    'Buyer Viewing': { label: 'Buyer Viewing', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    'Sold': { label: 'Sold & Settled', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    'Withdrawn': { label: 'Withdrawn', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
};

const ConsignmentHub = () => {
    const [listings, setListings] = useState([]);
    const [inboundRequests, setInboundRequests] = useState([]);
    const [pipelineStats, setPipelineStats] = useState(null);
    const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'inbound' | 'settled'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Modals
    const [settleModalOpen, setSettleModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [activeListingToSettle, setActiveListingToSettle] = useState(null);
    const [settleForm, setSettleForm] = useState({ soldPrice: '', commissionRate: '2.50', notes: '' });

    // New Listing Form
    const [vehiclesList, setVehiclesList] = useState([]);
    const [createForm, setCreateForm] = useState({
        vehicleId: '',
        clientId: '',
        askingPrice: '',
        commissionType: 'Percentage',
        commissionRate: '2.50',
        fbMarketplaceUrl: '',
        notes: '',
        requestId: null
    });

    const fetchData = async () => {
        try {
            const [listingsRes, requestsRes, statsRes] = await Promise.all([
                api.get('/consignment/listings'),
                api.get('/consignment/requests'),
                api.get('/consignment/pipeline/summary')
            ]);

            if (listingsRes.data?.success) setListings(listingsRes.data.data || []);
            if (requestsRes.data?.success) setInboundRequests(requestsRes.data.data || []);
            if (statsRes.data?.success) setPipelineStats(statsRes.data.data);
        } catch (err) {
            console.error('Failed to load consignment hub data:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            try {
                const [listingsRes, requestsRes, statsRes] = await Promise.all([
                    api.get('/consignment/listings'),
                    api.get('/consignment/requests'),
                    api.get('/consignment/pipeline/summary')
                ]);

                if (isMounted) {
                    if (listingsRes.data?.success) setListings(listingsRes.data.data || []);
                    if (requestsRes.data?.success) setInboundRequests(requestsRes.data.data || []);
                    if (statsRes.data?.success) setPipelineStats(statsRes.data.data);
                }
            } catch (err) {
                console.error('Failed to load consignment hub data:', err);
            }
        };

        loadInitialData();
        // Pre-fetch vehicles for creation modal
        api.get('/vehicles').then(res => {
            if (isMounted) {
                if (res.data?.data) setVehiclesList(res.data.data);
                else if (Array.isArray(res.data)) setVehiclesList(res.data);
            }
        }).catch(err => console.error('Error fetching vehicles:', err));

        return () => { isMounted = false; };
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.patch(`/consignment/listings/${id}`, { listingStatus: newStatus });
            fetchData();
        } catch (err) {
            console.error('Failed to update listing status:', err);
            alert('Failed to update listing stage');
        }
    };

    const openSettleModal = (listing) => {
        setActiveListingToSettle(listing);
        setSettleForm({
            soldPrice: listing.asking_price || '',
            commissionRate: listing.commission_rate || '2.50',
            notes: `Consignment closed for ${listing.make} ${listing.model}`
        });
        setSettleModalOpen(true);
    };

    const handleSettleSubmit = async (e) => {
        e.preventDefault();
        if (!activeListingToSettle) return;
        try {
            await api.post(`/consignment/listings/${activeListingToSettle.id}/settle`, {
                soldPrice: parseFloat(settleForm.soldPrice),
                commissionRate: parseFloat(settleForm.commissionRate || 2.50),
                notes: settleForm.notes
            });
            setSettleModalOpen(false);
            setActiveListingToSettle(null);
            fetchData();
        } catch (err) {
            console.error('Failed to settle listing deal:', err);
            alert(err.response?.data?.error || 'Failed to settle deal');
        }
    };

    const handleCreateListingSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/consignment/listings', {
                vehicleId: parseInt(createForm.vehicleId, 10),
                clientId: parseInt(createForm.clientId, 10),
                askingPrice: parseFloat(createForm.askingPrice),
                commissionType: createForm.commissionType,
                commissionRate: parseFloat(createForm.commissionRate || 2.50),
                fbMarketplaceUrl: createForm.fbMarketplaceUrl,
                notes: createForm.notes,
                requestId: createForm.requestId
            });
            setCreateModalOpen(false);
            setCreateForm({
                vehicleId: '',
                clientId: '',
                askingPrice: '',
                commissionType: 'Percentage',
                commissionRate: '2.50',
                fbMarketplaceUrl: '',
                notes: '',
                requestId: null
            });
            fetchData();
        } catch (err) {
            console.error('Failed to create listing:', err);
            alert(err.response?.data?.error || 'Failed to create listing');
        }
    };

    const handleConvertInboundLead = (lead) => {
        setCreateForm({
            vehicleId: lead.vehicle_id,
            clientId: lead.client_id,
            askingPrice: lead.asking_price || '',
            commissionType: 'Percentage',
            commissionRate: '2.50',
            fbMarketplaceUrl: '',
            notes: `Converted from VIP Portal lead: ${lead.notes || ''}`,
            requestId: lead.id
        });
        setCreateModalOpen(true);
    };

    // Filter listings
    const filteredListings = listings.filter(item => {
        const matchesStatus = selectedStatus === 'all' || item.listing_status === selectedStatus;
        const matchesSearch = !searchTerm ||
            `${item.make} ${item.model} ${item.license_plate} ${item.client_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (activeTab === 'settled') {
            return item.listing_status === 'Sold' && matchesSearch;
        }
        if (activeTab === 'pipeline') {
            return item.listing_status !== 'Sold' && matchesStatus && matchesSearch;
        }
        return matchesSearch;
    });

    const token = localStorage.getItem('token') || '';

    return (
        <div className="space-y-8 animate-fade-in pb-16">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles size={12} />
                            Revenue Stream • Used Car Consignment
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        Used Car Consignment & Marketplace Hub
                        <span className="text-xs font-normal text-gray-500 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            وساطة سيارات العملاء
                        </span>
                    </h1>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">
                        Screening, photography, verified Service Passport pedigree, and Facebook Marketplace distribution with 2.5% success fee.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setCreateForm({
                                vehicleId: '',
                                clientId: '',
                                askingPrice: '',
                                commissionType: 'Percentage',
                                commissionRate: '2.50',
                                fbMarketplaceUrl: '',
                                notes: '',
                                requestId: null
                            });
                            setCreateModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} />
                        New Consignment Listing
                    </button>
                </div>
            </div>

            {/* Pipeline KPI Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>Active Pipeline Value</span>
                        <Car size={16} className="text-blue-400" />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white font-mono">
                        {(pipelineStats?.totalActiveValue || 0).toLocaleString()} <span className="text-xs text-gray-400">EGP</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Active inventory under marketing</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>Realized Commissions</span>
                        <DollarSign size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
                        {(pipelineStats?.totalEarnedCommission || 0).toLocaleString()} <span className="text-xs text-gray-400">EGP</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Success cuts collected to date</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>Active Listings</span>
                        <Tag size={16} className="text-amber-400" />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-amber-400 font-mono">
                        {(pipelineStats?.listed || 0) + (pipelineStats?.staged || 0) + (pipelineStats?.buyerViewing || 0)}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Staged & published for buyers</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <span>Closed Deals</span>
                        <CheckCircle size={16} className="text-cyan-400" />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-cyan-400 font-mono">
                        {pipelineStats?.sold || 0}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Cars sold & verified</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('pipeline')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            activeTab === 'pipeline'
                                ? 'bg-white/15 text-white border border-white/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Active Consignment Pipeline ({listings.filter(l => l.listing_status !== 'Sold').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('inbound')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === 'inbound'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Inbound Portal Leads
                        {inboundRequests.filter(r => r.status === 'New').length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                                {inboundRequests.filter(r => r.status === 'New').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('settled')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            activeTab === 'settled'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Closed & Settled Deals ({listings.filter(l => l.listing_status === 'Sold').length})
                    </button>
                </div>

                {/* Filters */}
                {activeTab !== 'inbound' && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search make, model, client..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                            />
                        </div>
                        {activeTab === 'pipeline' && (
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                            >
                                <option value="all">All Stages</option>
                                <option value="Intake">Intake</option>
                                <option value="Staged">Staged</option>
                                <option value="Listed">Active Listed</option>
                                <option value="Buyer Viewing">Buyer Viewing</option>
                                <option value="Withdrawn">Withdrawn</option>
                            </select>
                        )}
                    </div>
                )}
            </div>

            {/* TAB CONTENT: Inbound Leads */}
            {activeTab === 'inbound' && (
                <div className="space-y-4">
                    {inboundRequests.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-500 text-sm">
                            No inbound sell requests found from the VIP Customer Portal.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inboundRequests.map((lead) => (
                                <div key={lead.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                {lead.status}
                                            </span>
                                            <span className="text-[11px] text-gray-500 font-mono">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                                            <Car size={16} className="text-amber-400" />
                                            {lead.year} {lead.make} {lead.model}
                                        </h4>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{lead.license_plate}</div>

                                        <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-xs">
                                            <div className="flex justify-between text-gray-400">
                                                <span>Client:</span>
                                                <span className="text-white font-medium">{lead.client_name}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-400">
                                                <span>Phone:</span>
                                                <a href={`tel:${lead.client_phone}`} className="text-amber-400 hover:underline">{lead.client_phone}</a>
                                            </div>
                                            <div className="flex justify-between text-gray-400">
                                                <span>Asking Price:</span>
                                                <span className="text-emerald-400 font-bold font-mono">
                                                    {lead.asking_price ? `${Number(lead.asking_price).toLocaleString()} EGP` : 'Negotiable'}
                                                </span>
                                            </div>
                                            {lead.current_mileage && (
                                                <div className="flex justify-between text-gray-400">
                                                    <span>Mileage:</span>
                                                    <span className="text-gray-300 font-mono">{Number(lead.current_mileage).toLocaleString()} KM</span>
                                                </div>
                                            )}
                                            {lead.notes && (
                                                <p className="text-[11px] text-gray-400 italic bg-black/30 p-2 rounded-lg mt-2">
                                                    "{lead.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-2">
                                        <button
                                            onClick={() => handleConvertInboundLead(lead)}
                                            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Sparkles size={14} />
                                            Convert to Listing
                                        </button>
                                        <a
                                            href={`${API_BASE}/vehicles/${lead.vehicle_id}/service-passport/pdf?token=${token}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-amber-400 transition-all"
                                            title="View Certified Service Passport"
                                        >
                                            <FileText size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: Pipeline Listings / Settled Deals */}
            {(activeTab === 'pipeline' || activeTab === 'settled') && (
                <div className="space-y-4">
                    {filteredListings.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-500 text-sm">
                            No consignment listings match current filters.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredListings.map((item) => {
                                const stage = STAGE_CONFIG[item.listing_status] || STAGE_CONFIG['Intake'];
                                const asking = Number(item.asking_price || 0);
                                const projectedCut = item.commission_type === 'Percentage'
                                    ? Math.round((asking * (item.commission_rate || 2.5)) / 100)
                                    : Number(item.commission_amount || 0);

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:border-white/20 transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Top Row: Vehicle title & Status dropdown */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                                <div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${stage.color} mb-1.5 inline-block`}>
                                                        {stage.label}
                                                    </span>
                                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                                        <Car size={18} className="text-amber-400" />
                                                        {item.year} {item.make} {item.model}
                                                    </h3>
                                                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                                                        Plate: <span className="text-gray-200">{item.license_plate}</span> • VIN: <span className="text-gray-300">{item.vin || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Stage Selector */}
                                                {item.listing_status !== 'Sold' && (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={item.listing_status}
                                                            onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                                            className="px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                                                        >
                                                            <option value="Intake">Intake</option>
                                                            <option value="Staged">Staged (Photos)</option>
                                                            <option value="Listed">Active Listed</option>
                                                            <option value="Buyer Viewing">Buyer Viewing</option>
                                                            <option value="Withdrawn">Withdrawn</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Financial Metrics Grid */}
                                            <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 rounded-xl border border-white/5 mb-4">
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                                        {item.listing_status === 'Sold' ? 'Final Sold Price' : 'Asking Price'}
                                                    </div>
                                                    <div className="text-base font-black text-white font-mono mt-0.5">
                                                        {(item.listing_status === 'Sold' ? item.sold_price : item.asking_price)?.toLocaleString()} EGP
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                                        {item.listing_status === 'Sold' ? 'Commission Earned' : 'Projected GoCar Cut (2.5%)'}
                                                    </div>
                                                    <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                                                        {(item.listing_status === 'Sold' ? item.commission_amount : projectedCut)?.toLocaleString()} EGP
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Client and Service Pedigree info */}
                                            <div className="space-y-1.5 text-xs text-gray-400">
                                                <div className="flex justify-between">
                                                    <span>VIP Owner:</span>
                                                    <span className="text-gray-200 font-medium">{item.client_name} ({item.client_phone})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>GoCar Service Pedigree:</span>
                                                    <span className="text-amber-400 font-medium">
                                                        {item.service_count || 0} Visits • {(item.total_service_spent || 0).toLocaleString()} EGP on Record
                                                    </span>
                                                </div>
                                                {item.fb_marketplace_url && (
                                                    <div className="flex items-center justify-between pt-1">
                                                        <span>Facebook Listing:</span>
                                                        <a
                                                            href={item.fb_marketplace_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
                                                        >
                                                            View Live Ad <ExternalLink size={12} />
                                                        </a>
                                                    </div>
                                                )}
                                                {item.notes && (
                                                    <p className="text-[11px] text-gray-400 italic bg-white/5 p-2 rounded-lg mt-2">
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                                            {/* Passport Link */}
                                            <a
                                                href={`${API_BASE}/vehicles/${item.vehicle_id}/service-passport/pdf?token=${token}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all"
                                                title="Generate buyer-ready certified service passport"
                                            >
                                                <FileText size={14} />
                                                Certified Passport PDF
                                            </a>

                                            {/* Settle / Mark Sold Button */}
                                            {item.listing_status !== 'Sold' ? (
                                                <button
                                                    onClick={() => openSettleModal(item)}
                                                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                                                >
                                                    <CheckCircle size={14} />
                                                    Settle Deal & Collect Cut
                                                </button>
                                            ) : (
                                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center gap-1">
                                                    <CheckCircle size={14} /> Closed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Settle Sale Modal */}
            <AnimatePresence>
                {settleModalOpen && activeListingToSettle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0e121b] border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSettleModalOpen(false)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                <DollarSign size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Settle Consignment Deal</span>
                            </div>
                            <h3 className="text-xl font-black text-white">
                                {activeListingToSettle.year} {activeListingToSettle.make} {activeListingToSettle.model}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 mb-6">
                                Record final sale closing price and finalize GoCar's success commission cut.
                            </p>

                            <form onSubmit={handleSettleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Final Closing Sold Price (EGP)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={settleForm.soldPrice}
                                        onChange={(e) => setSettleForm({ ...settleForm, soldPrice: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                                        placeholder="e.g. 1500000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Commission Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={settleForm.commissionRate}
                                        onChange={(e) => setSettleForm({ ...settleForm, commissionRate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-400"
                                    />
                                </div>

                                {/* Live Cut Calculation */}
                                {settleForm.soldPrice && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Calculated GoCar Net Commission</div>
                                        <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                                            {Math.round((parseFloat(settleForm.soldPrice) * parseFloat(settleForm.commissionRate || 2.5)) / 100).toLocaleString()} EGP
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Closing Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={settleForm.notes}
                                        onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                                        placeholder="Buyer details, payment notes..."
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setSettleModalOpen(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                                    >
                                        Confirm Sale & Collect Cut
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create New Consignment Listing Modal */}
            <AnimatePresence>
                {createModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0e121b] border border-amber-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-2 mb-2 text-amber-400">
                                <Plus size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">New Consignment Listing</span>
                            </div>
                            <h3 className="text-xl font-black text-white">Stage Vehicle for Sale</h3>
                            <p className="text-xs text-gray-400 mt-1 mb-6">
                                Select a customer vehicle from the fleet to create an active consignment listing.
                            </p>

                            <form onSubmit={handleCreateListingSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Select Vehicle
                                    </label>
                                    <select
                                        required
                                        value={createForm.vehicleId}
                                        onChange={(e) => {
                                            const vId = e.target.value;
                                            const selectedVeh = vehiclesList.find(v => String(v.id) === String(vId));
                                            setCreateForm({
                                                ...createForm,
                                                vehicleId: vId,
                                                clientId: selectedVeh ? selectedVeh.client_id : createForm.clientId
                                            });
                                        }}
                                        className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                                    >
                                        <option value="">-- Choose Vehicle from Fleet --</option>
                                        {vehiclesList.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.year} {v.make} {v.model} ({v.license_plate}) - Owner: {v.client_name || `Client #${v.client_id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                            Asking Price (EGP)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={createForm.askingPrice}
                                            onChange={(e) => setCreateForm({ ...createForm, askingPrice: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                                            placeholder="e.g. 850000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                            Commission Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={createForm.commissionRate}
                                            onChange={(e) => setCreateForm({ ...createForm, commissionRate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Facebook Marketplace Listing URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={createForm.fbMarketplaceUrl}
                                        onChange={(e) => setCreateForm({ ...createForm, fbMarketplaceUrl: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                                        placeholder="https://facebook.com/marketplace/item/..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                        Staff Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={createForm.notes}
                                        onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                                        placeholder="Inspection remarks, buyer leads..."
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                                    >
                                        Create Listing
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConsignmentHub;
