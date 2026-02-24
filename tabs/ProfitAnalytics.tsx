
import React, { useState, useMemo } from 'react';
import { Transaction, ProfitFilter } from '../types';
import { TrendingUp, Calculator, Landmark, ArrowUpRight, Calendar, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  transactions: Transaction[];
}

const ProfitAnalytics: React.FC<Props> = ({ transactions }) => {
  const [filter, setFilter] = useState<ProfitFilter>('today');
  const [customDate, setCustomDate] = useState({ start: '', end: '' });

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (filter === 'custom' && customDate.start) {
      const start = new Date(customDate.start);
      const end = customDate.end ? new Date(customDate.end) : new Date();
      end.setHours(23, 59, 59);
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }

    switch(filter) {
      case 'today': return transactions.filter(t => t.date.startsWith(todayStr));
      case 'yesterday': return transactions.filter(t => t.date.startsWith(yesterdayStr));
      case 'month': return transactions.filter(t => new Date(t.date) >= monthStart);
      default: return transactions;
    }
  }, [transactions, filter, customDate]);

  const totals = useMemo(() => {
    const revenue = filteredData.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const cost = filteredData.reduce((acc, curr) => acc + curr.totalCost, 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, cost, profit, margin };
  }, [filteredData]);

  const chartData = useMemo(() => {
    return filteredData.slice().reverse().map(t => ({
      name: new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      profit: t.profit,
      revenue: t.totalAmount
    }));
  }, [filteredData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financial Insights</h2>
          <p className="text-slate-500">Analyze performance across time periods</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {filter === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-blue-200 animate-in fade-in zoom-in-95">
              <input type="date" value={customDate.start} onChange={e => setCustomDate({...customDate, start: e.target.value})} className="text-xs font-bold p-1 bg-transparent border-none focus:ring-0" />
              <span className="text-slate-300 text-xs">to</span>
              <input type="date" value={customDate.end} onChange={e => setCustomDate({...customDate, end: e.target.value})} className="text-xs font-bold p-1 bg-transparent border-none focus:ring-0" />
            </div>
          )}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['today', 'yesterday', 'month', 'custom'] as ProfitFilter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Revenue', value: totals.revenue, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calculator },
          { label: 'Total Cost', value: totals.cost, color: 'text-slate-600', bg: 'bg-slate-50', icon: Landmark },
          { label: 'Net Profit', value: totals.profit, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp },
          { label: 'Margin', value: `${totals.margin.toFixed(1)}%`, color: 'text-amber-600', bg: 'bg-amber-50', icon: ArrowUpRight },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon size={20} /></div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{typeof stat.value === 'number' ? `₹${stat.value.toLocaleString()}` : stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2"><TrendingUp size={20} className="text-blue-600" /> Revenue vs Profit Trend</h3>
        <div className="h-96">
         <ResponsiveContainer width="99%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProfitAnalytics;
