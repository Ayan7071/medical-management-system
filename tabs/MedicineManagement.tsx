
import React, { useState, useMemo } from 'react';
import { Medicine, Agency } from '../types';
import { Plus, Trash2, Edit2, AlertTriangle, Clock, Calculator, Percent } from 'lucide-react';

interface Props {
  medicines: Medicine[];
  agencies: Agency[];
  onAdd: (med: Medicine) => void;
  onUpdate: (id: string, updates: Partial<Medicine>) => void;
  onDelete: (id: string) => void;
}

const MedicineManagement: React.FC<Props> = ({ medicines, agencies, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | 'soon'>('all');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const [formData, setFormData] = useState({
    name: '',
    category: 'Tablet',
    basePrice: '',
    gstRate: '12',
    costPrice: '',
    mrp: '',
    totalStock: '',
    unitsPerPackage: '10',
    expMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    expYear: (new Date().getFullYear() + 2).toString(),
    agencyId: ''
  });

  // Auto-calculate Cost Price Per Unit
  React.useEffect(() => {
    const base = parseFloat(formData.basePrice) || 0;
    const gst = parseFloat(formData.gstRate) || 0;
    const calculated = base + (base * gst / 100);
    setFormData(prev => ({ ...prev, costPrice: calculated.toFixed(2) }));
  }, [formData.basePrice, formData.gstRate]);

  const getExpiryStatus = (expiryStr: string) => {
    if (!expiryStr.includes('/')) return { label: 'Unknown', color: 'bg-slate-100' };
    const [m, y] = expiryStr.split('/').map(Number);
    const today = new Date();
    const expiry = new Date(y, m - 1, 1);
    if (expiry < today) return { label: 'Expired', color: 'bg-rose-100 text-rose-700' };
    const threeMonthsAway = new Date();
    threeMonthsAway.setMonth(threeMonthsAway.getMonth() + 3);
    if (expiry <= threeMonthsAway) return { label: 'Soon', color: 'bg-amber-100 text-amber-700' };
    return { label: 'OK', color: 'bg-emerald-100 text-emerald-700' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Medicine = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice),
      mrp: parseFloat(formData.mrp),
      stock: parseInt(formData.totalStock) || 0,
      sold: 0,
      expiryDate: `${formData.expMonth}/${formData.expYear}`,
      agencyId: formData.agencyId || undefined,
      unitsPerPackage: parseInt(formData.unitsPerPackage) || 1
    };
    onAdd(newMed);
    setIsAdding(false);
    setFormData(prev => ({ ...prev, name: '', basePrice: '', mrp: '', totalStock: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medicine Master</h2>
          <p className="text-slate-500">Add products with accurate tax & unit pricing</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
          <Plus size={20} /> Add New
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] border border-blue-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Medicine Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Enter Full Medicine Name" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold">
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Drops">Drops</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Meds (Qty)</label>
              <input type="number" required value={formData.totalStock} onChange={e => setFormData({...formData, totalStock: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="0" />
            </div>

            <div className="bg-blue-50/50 p-6 rounded-3xl md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6 border border-blue-100/50">
              <div className="space-y-1">
                <label className="text-xs font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1"><Calculator size={12} /> Unit Base Price</label>
                <input type="number" step="0.01" required value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1"><Percent size={12} /> GST %</label>
                <select value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: e.target.value})} className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600">
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unit Cost (Accurate)</label>
                <div className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-black text-slate-500 flex items-center justify-between">
                  <span>₹</span>
                  <span>{formData.costPrice}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-emerald-600 uppercase tracking-widest ml-1">Unit MRP</label>
                <input type="number" step="0.01" required value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="w-full px-5 py-4 bg-white border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-600" placeholder="0.00" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expiry (MM/YYYY)</label>
              <div className="flex gap-2">
                <select value={formData.expMonth} onChange={e => setFormData({...formData, expMonth: e.target.value})} className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                  {months.map((m, i) => <option key={m} value={(i+1).toString().padStart(2, '0')}>{m}</option>)}
                </select>
                <input type="number" value={formData.expYear} onChange={e => setFormData({...formData, expYear: e.target.value})} className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" placeholder="2026" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Agency</label>
              <select value={formData.agencyId} onChange={e => setFormData({...formData, agencyId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                <option value="">Direct / None</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3 text-slate-400 font-bold">Cancel</button>
              <button type="submit" className="px-12 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all">Save Medicine</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Name</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">In Stock</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit MRP</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.map(med => (
              <tr key={med.id} className="hover:bg-slate-50/50 group transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{med.name}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-sm font-black ${med.stock < 10 ? 'text-rose-600' : 'text-slate-700'}`}>{med.stock} Meds</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border ${getExpiryStatus(med.expiryDate).color}`}>
                    {med.expiryDate}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-black text-emerald-600">₹{med.mrp.toFixed(2)}</td>
                <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onDelete(med.id)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicineManagement;
