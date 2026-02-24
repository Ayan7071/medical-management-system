
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

    return { totalSales, totalProfit, lowStock, outOfStock };
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Profit', value: `₹${stats.totalProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Patients', value: patients.length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Sales Trend</h3>
          <div className="w-full h-[320px] min-h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={salesData}>
      <CartesianGrid 
        strokeDasharray="3 3" 
        vertical={false} 
        stroke="#f1f5f9" 
      />
      
      <XAxis 
        dataKey="name" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 12, fill: '#94a3b8' }} 
        dy={10} 
      />
      
      <YAxis 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 12, fill: '#94a3b8' }} 
      />
      
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#fff', 
          borderRadius: '12px', 
          border: 'none', 
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
        }}
        itemStyle={{ 
          color: '#3b82f6', 
          fontWeight: 600 
        }}
      />
      
      <Line 
        type="monotone" 
        dataKey="amount" 
        stroke="#3b82f6" 
        strokeWidth={3} 
        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
        activeDot={{ r: 6 }} 
      />
    </LineChart>
  </ResponsiveContainer>
</div>
        </div>

        {/* Quick Inventory Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Stock Status</h3>
          <div className="space-y-4">
            {medicines.slice(0, 5).map(med => (
              <div key={med.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.category}</p>
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
