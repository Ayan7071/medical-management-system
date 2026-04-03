
import React, { useMemo } from 'react';
import { Medicine, Transaction, Patient } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, Package, Users, DollarSign, AlertCircle } from 'lucide-react';

interface Props {
  medicines: Medicine[];
  transactions: Transaction[];
  patients: Patient[];
}

const Dashboard: React.FC<Props> = ({ medicines, transactions, patients }) => {
  const stats = useMemo(() => {
    const totalSales = transactions.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalProfit = transactions.reduce((acc, curr) => acc + curr.profit, 0);
    const lowStock = medicines.filter(m => m.stock < 10).length;
    const outOfStock = medicines.filter(m => m.stock === 0).length;
    const potentialProfit = medicines.reduce((acc, curr) => acc + (curr.stock * (curr.mrp - curr.costPrice)), 0);

    return { totalSales, totalProfit, lowStock, outOfStock, potentialProfit };
  }, [medicines, transactions]);

  const salesData = useMemo(() => {
    // Group transactions by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      name: date,
      amount: transactions.filter(t => t.date.startsWith(date)).reduce((acc, curr) => acc + curr.totalAmount, 0)
    }));
  }, [transactions]);

  const expiryAlerts = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    return medicines.filter(med => {
      if (!med.expiryDate.includes('/')) return false;
      const [m, y] = med.expiryDate.split('/').map(Number);
      
      // Already expired
      if (y < currentYear || (y === currentYear && m < currentMonth)) return true;
      
      // Expiring this month or next month (Alert)
      if (y === currentYear && (m === currentMonth || m === currentMonth + 1)) return true;
      if (y === currentYear + 1 && currentMonth === 12 && m === 1) return true;

      return false;
    }).map(med => {
      const [m, y] = med.expiryDate.split('/').map(Number);
      const isExpired = y < currentYear || (y === currentYear && m < currentMonth);
      const isThisMonth = y === currentYear && m === currentMonth;
      return { ...med, isExpired, isThisMonth };
    }).sort((a, b) => (a.isExpired === b.isExpired ? 0 : a.isExpired ? -1 : 1));
  }, [medicines]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Profit Earned', value: `₹${stats.totalProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Stock Profit Value', value: `₹${stats.potentialProfit.toLocaleString()}`, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((item, i) => (
          <div key={i} className="stat-card">
            <div>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{item.value}</h3>
            </div>
            <div className={`${item.bg} ${item.color} p-3 rounded-xl`}>
              <item.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Expiry Alerts Section */}
      {expiryAlerts.length > 0 && (
        <div className="card border-rose-100 bg-rose-50/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-600" size={24} />
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Expiry Alerts (Expired & Soon)</h3>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider">
              {expiryAlerts.length} Alerts
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiryAlerts.slice(0, 6).map(med => (
              <div key={med.id} className={`p-4 rounded-2xl border ${med.isExpired ? 'bg-white border-rose-200' : 'bg-white border-amber-200'} shadow-sm`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{med.name}</h4>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${med.isExpired ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    {med.isExpired ? 'Expired' : 'Soon'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expiry Date</p>
                    <p className={`text-sm font-black ${med.isExpired ? 'text-rose-600' : 'text-amber-600'}`}>{med.expiryDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Stock</p>
                    <p className="text-sm font-black text-slate-800">{med.stock} Units</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {expiryAlerts.length > 6 && (
            <p className="mt-4 text-center text-xs text-slate-500 font-medium italic">And {expiryAlerts.length - 6} more medicines expiring...</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Sales Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Inventory Summary */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Stock Status</h3>
          <div className="space-y-4">
            {medicines.slice(0, 5).map(med => (
              <div key={med.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.category} • {med.batchNumber || 'No Batch'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${med.stock < 10 ? 'text-rose-500' : 'text-slate-800'}`}>{med.stock}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Qty</p>
                </div>
              </div>
            ))}
            {medicines.length === 0 && <p className="text-center text-slate-400 py-10">No medicines added yet</p>}
            {medicines.length > 5 && <button className="w-full text-center text-sm text-blue-600 font-medium py-2">View All Inventory</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
