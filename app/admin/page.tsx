'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, Truck, Zap, Activity, Calendar } from 'lucide-react';
import {
   fetchAdminCustomersOverview,
   fetchAdminOrders,
   fetchAdminProductsLite,
   type AdminOrder,
   type AdminProductLite,
} from '@/app/lib/apiClient';
import { useSiteSettings } from '@/app/context/SiteSettingsContext';

type TrendRange = 'weekly' | 'monthly' | 'yearly';
type ChartPoint = { label: string; key: string; value: number; };

// Helper functions (kept from original for logic integrity)
const toStatus = (value: string) => String(value || '').trim().toLowerCase();
const toDate = (value?: string) => { if (!value) return null; const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; };
const formatKeyDay = (date: Date) => date.toISOString().split('T')[0];
const formatKeyMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const normalizeOrderAmount = (order: AdminOrder) => {
   const explicit = Number(order.amount || 0);
   const itemsTotal = (order.items || []).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
   if (explicit > 0) return (explicit > itemsTotal * 5 || (itemsTotal <= 0 && explicit >= 100)) ? explicit / 100 : explicit;
   return itemsTotal;
};

const buildChartPoints = (orders: AdminOrder[], range: TrendRange): ChartPoint[] => {
   const now = new Date();
   const points: ChartPoint[] = [];
   const seed = new Map<string, number>();

   if (range === 'weekly') {
      for (let i = 11; i >= 0; i--) {
         const d = new Date(now); d.setDate(now.getDate() - i);
         const key = formatKeyDay(d);
         const label = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
         points.push({ label, key, value: 0 }); seed.set(key, 0);
      }
   } else if (range === 'monthly') {
      for (let i = 5; i >= 0; i--) {
         const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const key = formatKeyMonth(d);
         const label = d.toLocaleDateString('en-US', { month: 'short' });
         points.push({ label, key, value: 0 }); seed.set(key, 0);
      }
   } else {
      for (let i = 4; i >= 0; i--) {
         const year = String(now.getFullYear() - i);
         points.push({ label: year, key: year, value: 0 }); seed.set(year, 0);
      }
   }

   orders.forEach(order => {
      const date = toDate(order.createdAt);
      if (!date) return;
      const key = range === 'weekly' ? formatKeyDay(date) : range === 'monthly' ? formatKeyMonth(date) : String(date.getFullYear());
      if (seed.has(key)) seed.set(key, (seed.get(key) || 0) + normalizeOrderAmount(order));
   });

   return points.map(p => ({ ...p, value: seed.get(p.key) || 0 }));
};

export default function AdminDashboard() {
   const [orders, setOrders] = useState<AdminOrder[]>([]);
   const [products, setProducts] = useState<AdminProductLite[]>([]);
   const [conversionRate, setConversionRate] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
   const [, setError] = useState('');
   const [range, setRange] = useState<TrendRange>('weekly');
   const { settings } = useSiteSettings();
   const currency = settings.currencySymbol || '₹';

   const loadDashboard = async () => {
      try {
         setIsLoading(true);
         const [orderRows, customerOverview, productRows] = await Promise.all([
            fetchAdminOrders(), fetchAdminCustomersOverview(), fetchAdminProductsLite(),
         ]);
         setOrders(orderRows); setProducts(productRows);
         setConversionRate(Number(customerOverview.stats.conversionRate || 0));
      } catch (err) { setError('Telemetry synchronization failed.'); } 
      finally { setIsLoading(false); }
   };

   useEffect(() => { loadDashboard(); }, []);

   const stats = useMemo(() => {
      const totalRevenue = orders.reduce((sum, o) => sum + normalizeOrderAmount(o), 0);
      const active = orders.filter(o => ['pending', 'processing', 'shipped', 'in transit'].includes(toStatus(o.status))).length;
      const recent = products.filter(p => (toDate(p.createdAt)?.getTime() || 0) >= (Date.now() - 30*24*60*60*1000)).length;

      return [
         { label: 'Gross Revenue', value: `${currency}${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: 'Total Volume', icon: <Zap size={16}/>, color: 'text-[#9a6a2f]' },
         { label: 'Active Pipeline', value: String(active), sub: 'Orders in Flight', icon: <Truck size={16}/>, color: 'text-blue-500' },
         { label: 'Inventory Growth', value: String(recent), sub: 'Last 30 Days', icon: <Package size={16}/>, color: 'text-amber-500' },
         { label: 'Conversion', value: `${conversionRate.toFixed(2)}%`, sub: 'Active Sessions', icon: <Activity size={16}/>, color: 'text-emerald-500' },
      ];
   }, [orders, products, conversionRate, currency]);

   const chartPoints = useMemo(() => buildChartPoints(orders, range), [orders, range]);
   const maxChartValue = Math.max(...chartPoints.map(p => p.value), 1);

   if (isLoading) return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
         <p className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 animate-pulse">Syncing Database...</p>
      </div>
   );

   return (
      <div className="space-y-12">
         <header className="space-y-2">
            <div className="flex items-center gap-2">
               <span className="h-px w-8 bg-[#9a6a2f]" />
               <span className="text-[10px] font-black tracking-[0.4em] text-[#9a6a2f] uppercase">Gram Ansh Overview</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-[#234a22]">Command Center</h2>
         </header>

         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  key={idx} className="relative overflow-hidden rounded-[24px] border border-[#dccaa7] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f1e3_100%)] p-8 shadow-[0_18px_36px_rgba(87,64,26,0.08)] transition-all hover:border-[#b28a49] group"
               >
                  <div className="flex justify-between items-start mb-6">
                     <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{stat.label}</span>
                     <div className={`${stat.color} rounded-xl bg-[#f7eddc] p-2`}>{stat.icon}</div>
                  </div>
                  <div className="relative z-10">
                     <span className="block text-3xl font-black tracking-tight text-[#234a22]">{stat.value}</span>
                     <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mt-1 block">{stat.sub}</span>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[#efe5d2] transition-colors group-hover:text-[#9a6a2f]/10"><TrendingUp size={100}/></div>
               </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-8 rounded-[28px] border border-[#dccaa7] bg-[linear-gradient(180deg,#fffdf8_0%,#f7efdf_100%)] p-8 shadow-[0_18px_36px_rgba(87,64,26,0.08)]">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                  <div>
                     <h3 className="text-xl font-black tracking-tighter uppercase italic text-[#234a22]">Revenue Stream</h3>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Financial Performance Index</p>
                  </div>
                  <div className="flex gap-1 rounded-xl bg-[#f3e8d5] p-1">
                     {(['weekly', 'monthly', 'yearly'] as TrendRange[]).map((opt) => (
                        <button key={opt} onClick={() => setRange(opt)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${range === opt ? 'bg-[#234a22] text-white shadow-lg' : 'text-[#7b684d] hover:text-[#234a22] hover:bg-white/70'}`}>{opt}</button>
                     ))}
                  </div>
               </div>

               <div className="h-64 flex items-end gap-2 px-2 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                     {[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-300 dark:border-slate-700 w-full" />)}
                  </div>
                  
                  {chartPoints.map((p, i) => {
                     const height = Math.max(4, (p.value / maxChartValue) * 100);
                     return (
                        <div key={i} className="flex-1 group relative flex flex-col justify-end h-full">
                           <motion.div 
                              initial={{ height: 0 }} animate={{ height: `${height}%` }}
                              className="relative w-full rounded-t-sm bg-gradient-to-t from-[#234a22] to-[#c79a49] transition-all group-hover:from-[#2c5a27] group-hover:to-[#d3aa62]"
                           >
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                 {currency}{p.value.toFixed(0)}
                              </div>
                           </motion.div>
                           <div className="mt-4 text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center overflow-hidden truncate">{p.label}</div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-4 space-y-8">
               <div className="rounded-[28px] border border-[#dccaa7] bg-[linear-gradient(180deg,#fffdf8_0%,#f7efdf_100%)] p-8 text-slate-900 shadow-[0_18px_36px_rgba(87,64,26,0.08)]">
                  <div className="flex items-center gap-3 mb-8">
                     <Calendar size={18} className="text-[#9a6a2f]" />
                     <h3 className="text-lg font-black tracking-tighter uppercase italic">Real-Time Feed</h3>
                  </div>
                  <div className="space-y-6">
                     {orders.slice(0, 5).map((order, i) => (
                        <div key={i} className="flex gap-4 group">
                           <div className="w-1 h-10 bg-slate-200 dark:bg-white/10 rounded-full group-hover:bg-red-600 transition-colors" />
                           <div>
                              <p className="text-[10px] font-black tracking-wider uppercase text-slate-600">
                                 {order.order_code || `ORD-${order.order_id}`}
                              </p>
                              <p className="mt-0.5 text-[9px] font-bold uppercase text-slate-500">
                                 STATUS: <span className="text-[#234a22]">{order.status || 'PENDING'}</span>
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
