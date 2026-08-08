'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    fetchAdminCustomerActivity,
    fetchAdminCustomersOverview,
    updateAdminCustomerStatus,
    type AdminCustomer,
    type AdminCustomerActivity,
    type AdminCustomerOverview,
} from '@/app/lib/apiClient';
import { useSiteSettings } from '@/app/context/SiteSettingsContext';
import CustomerRow from './components/CustomerRow';
import { 
    Search, RefreshCw, Users, Activity, TrendingUp, 
    AlertCircle, X, Clock, ShoppingBag, Heart, DollarSign 
} from 'lucide-react';

type SegmentFilter = 'ALL' | 'VIP' | 'ACTIVE' | 'NEW' | 'DORMANT' | 'BLOCKED';

const formatMoney = (value: number, currency: string) => {
    return `${currency}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatRate = (value: number) => `${Number(value || 0).toFixed(1)}%`;

const statusTone = (status: string) => {
    const normalized = String(status || '').toUpperCase();
    switch (normalized) {
        case 'VIP': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'DORMANT': return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'BLOCKED': return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-blue-50 text-blue-600 border-blue-200';
    }
};

export default function CustomersManagement() {
    const { settings } = useSiteSettings();
    const currency = settings.currencySymbol || '₹';

    const [overview, setOverview] = useState<AdminCustomerOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [segment, setSegment] = useState<SegmentFilter>('ALL');
    const [busyEmail, setBusyEmail] = useState('');

    const [activity, setActivity] = useState<AdminCustomerActivity | null>(null);
    const [activityEmail, setActivityEmail] = useState('');
    const [loadingActivity, setLoadingActivity] = useState(false);

    const loadCustomers = async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await fetchAdminCustomersOverview();
            setOverview(data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load customers.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const customers = useMemo(() => overview?.customers || [], [overview]);

    const filteredCustomers = useMemo(() => {
        const term = query.trim().toLowerCase();
        return customers.filter((customer: AdminCustomer) => {
            const status = String(customer.status || 'NEW').toUpperCase() as SegmentFilter;
            const matchesSegment = segment === 'ALL' || status === segment;
            if (!matchesSegment) return false;
            if (!term) return true;

            return (
                String(customer.name || '').toLowerCase().includes(term) ||
                String(customer.email || '').toLowerCase().includes(term)
            );
        });
    }, [customers, query, segment]);

    const stats = useMemo(() => {
        const base = overview?.stats || {
            totalCustomers: 0,
            activeSessions: 0,
            conversionRate: 0,
            churnRate: 0,
        };

        return [
            { label: 'Total Customers', value: String(base.totalCustomers.toLocaleString()), trend: 'Live', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Sessions', value: String(base.activeSessions.toLocaleString()), trend: 'Live', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Conversion Rate', value: formatRate(base.conversionRate), trend: base.conversionRate >= 3 ? 'Healthy' : 'Low', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Churn Rate', value: formatRate(base.churnRate), trend: base.churnRate <= 5 ? 'Stable' : 'At Risk', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ];
    }, [overview]);

    const toggleCustomerStatus = async (email: string, currentlyBlocked: boolean) => {
        try {
            setBusyEmail(email);
            setError('');
            await updateAdminCustomerStatus(email, !currentlyBlocked, !currentlyBlocked ? 'Blocked by admin' : '');
            await loadCustomers();
            if (activityEmail === email) {
                await openActivity(email);
            }
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : 'Could not update customer status.');
        } finally {
            setBusyEmail('');
        }
    };

    const openActivity = async (email: string) => {
        try {
            setLoadingActivity(true);
            setActivityEmail(email);
            const details = await fetchAdminCustomerActivity(email);
            setActivity(details);
        } catch (activityError) {
            setError(activityError instanceof Error ? activityError.message : 'Could not load customer activity.');
        } finally {
            setLoadingActivity(false);
        }
    };

    const closeActivity = () => {
        setActivity(null);
        setActivityEmail('');
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold tracking-widest text-[#b90c1b] uppercase">User Segments</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white-900 tracking-tight">Customer Analytics</h2>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search name or email..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white text-black border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b90c1b]/20 focus:border-[#b90c1b] transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={loadCustomers} 
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm shrink-0"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-[#b90c1b]' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Error State */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-rose-700">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                    <button onClick={loadCustomers} className="text-sm font-semibold text-rose-700 hover:text-rose-800 underline underline-offset-2">Retry</button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${stat.trend === 'Live' || stat.trend === 'Healthy' || stat.trend === 'Stable' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {(['ALL', 'VIP', 'ACTIVE', 'NEW', 'DORMANT', 'BLOCKED'] as SegmentFilter[]).map((entry) => (
                    <button
                        key={entry}
                        onClick={() => setSegment(entry)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap border ${
                            segment === entry
                                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {entry}
                    </button>
                ))}
            </div>

            {/* Data Table Area */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    {/* Minimum width ensures grid doesn't collapse on phones */}
                    <div className="min-w-[900px]"> 
                        <div className="grid grid-cols-12 gap-6 p-4 md:p-6 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-1 pl-2">Rank</div>
                            <div className="col-span-4">Customer Profile</div>
                            <div className="col-span-2">Orders</div>
                            <div className="col-span-2">Lifetime Value</div>
                            <div className="col-span-1 text-center">Status</div>
                            <div className="col-span-2 text-right pr-2">Action</div>
                        </div>

                        <div className="flex flex-col divide-y divide-slate-100">
                            {isLoading && filteredCustomers.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <RefreshCw className="w-8 h-8 animate-spin text-[#b90c1b]" />
                                    <span className="text-sm font-medium">Loading customer data...</span>
                                </div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
                                    <div className="bg-slate-50 p-4 rounded-full">
                                        <Users className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-700">No customers found</p>
                                        <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                                    </div>
                                </div>
                            ) : (
                                filteredCustomers.map((c, i) => (
                                    <CustomerRow
                                        key={`${c.email}-${i}`}
                                        customer={c}
                                        index={i}
                                        busy={busyEmail === c.email}
                                        lifetimeValue={formatMoney(c.totalSpent, currency)}
                                        statusClass={`border px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusTone(String(c.status || 'NEW'))}`}
                                        onOpenActivity={openActivity}
                                        onToggleStatus={toggleCustomerStatus}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Modal Overlay */}
            {(loadingActivity || activity) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm">
                    <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 bg-white z-10 shrink-0">
                            <div>
                                <p className="text-xs font-bold tracking-widest text-[#b90c1b] uppercase mb-1">Customer Overview</p>
                                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                    {activity?.customer.name || activityEmail}
                                </h3>
                                {activity?.customer.isBlocked && (
                                    <p className="text-sm font-medium text-rose-600 mt-2 flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4" />
                                        Blocked: {activity.customer.blockedReason || 'No reason specified'}
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={closeActivity} 
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors self-start"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            {loadingActivity ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                                    <RefreshCw className="w-8 h-8 animate-spin text-[#b90c1b]" />
                                    <p className="text-sm font-medium">Generating timeline...</p>
                                </div>
                            ) : activity && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    
                                    {/* Sidebar Stats */}
                                    <div className="lg:col-span-4 flex flex-col gap-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-xl shadow-sm"><Activity className="w-5 h-5 text-blue-600" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Sessions</p>
                                                <p className="text-2xl font-bold text-slate-900">{activity.summary.activeSessions}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-xl shadow-sm"><ShoppingBag className="w-5 h-5 text-emerald-600" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
                                                <p className="text-2xl font-bold text-slate-900">{activity.summary.ordersCount}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-xl shadow-sm"><Heart className="w-5 h-5 text-rose-500" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wishlist Items</p>
                                                <p className="text-2xl font-bold text-slate-900">{activity.summary.wishlistCount}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 text-white shadow-lg">
                                            <div className="bg-white/10 p-3 rounded-xl"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifetime Value</p>
                                                <p className="text-2xl font-bold">{formatMoney(activity.summary.totalSpent, currency)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="lg:col-span-8">
                                        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6">
                                            <Clock className="w-5 h-5 text-slate-400" /> 
                                            Activity Timeline
                                        </h4>
                                        <div className="space-y-4 pr-2">
                                            {activity.timeline.length === 0 ? (
                                                <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-500 text-sm">
                                                    No recent timeline events found.
                                                </div>
                                            ) : (
                                                activity.timeline.map((entry, index) => (
                                                    <div key={`${entry.type}-${entry.occurredAt || index}`} className="relative pl-6 border-l-2 border-slate-100 group hover:border-[#b90c1b] transition-colors pb-4 last:pb-0">
                                                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-white border-2 border-slate-200 rounded-full group-hover:border-[#b90c1b] transition-colors" />
                                                        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-4 shadow-sm group-hover:shadow-md transition-all">
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                                <p className="text-sm font-bold text-slate-800">{entry.title}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                                                    {entry.occurredAt ? new Date(entry.occurredAt).toLocaleString() : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <span className="inline-block mt-3 px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                                {entry.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
