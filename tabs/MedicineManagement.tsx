
import React, { useState, useRef, useMemo } from 'react';
import { Medicine, Agency } from '../types';
import { Plus, Camera, Loader2, Save, Trash2, Edit2, Sparkles, AlertTriangle, Clock, Search, Filter, Truck, LayoutGrid } from 'lucide-react';
import { extractMedicineData } from '../services/geminiService';

interface Props {
  medicines: Medicine[];
  agencies: Agency[];
  onAdd: (med: Medicine) => void;
  onUpdate: (id: string, updates: Partial<Medicine>) => void;
  onDelete: (id: string) => void;
}

const MedicineManagement: React.FC<Props> = ({ medicines, agencies, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | 'soon'>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Tablet', 'Capsule', 'Syrup', 'Inhaler', 'Injection', 'Cream', 'Drops'];

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: '',
    mrp: '',
    stock: '',
    expiryDate: '',
    agencyId: ''
  });

  const getExpiryStatus = (date: string) => {
    const today = new Date();
    const expiry = new Date(date);
    const diff = expiry.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { label: 'Expired', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle };
    if (days <= 90) return { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
    return { label: 'Healthy', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: null };
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const status = getExpiryStatus(med.expiryDate);
      const matchesExpiry = expiryFilter === 'expired' ? status.label === 'Expired' :
                          expiryFilter === 'soon' ? status.label === 'Expiring Soon' : true;
      const matchesAgency = agencyFilter === 'all' || med.agencyId === agencyFilter;
      return matchesExpiry && matchesAgency;
    });
  }, [medicines, expiryFilter, agencyFilter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await extractMedicineData(base64);
        setFormData(prev => ({
          ...prev,
          name: extracted.name || '',
          category: extracted.category || '',
          costPrice: extracted.costPrice?.toString() || '',
          mrp: extracted.mrp?.toString() || '',
          expiryDate: extracted.expiryDate || '',
        }));
        setIsScanning(false);
        setIsAdding(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Medicine = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice),
      mrp: parseFloat(formData.mrp),
      stock: parseInt(formData.stock),
      sold: 0,
      expiryDate: formData.expiryDate,
      agencyId: formData.agencyId || undefined
    };
    onAdd(newMed);
    setFormData({ name: '', category: '', costPrice: '', mrp: '', stock: '', expiryDate: '', agencyId: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Medicines</h2>
            <p className="text-slate-500">Track expiry and manage inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors">
              {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} AI Scan
            </button>
            <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all">
              <Plus size={18} /> Add New
            </button>
          </div>
        </div>

        {/* Agency Tab Switcher */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex min-w-max">
            <button 
              onClick={() => setAgencyFilter('all')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                agencyFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={16} /> All Agencies
            </button>
            {agencies.map(a => (
              <button 
                key={a.id}
                onClick={() => setAgencyFilter(a.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  agencyFilter === a.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Truck size={16} /> {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">Medicine Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="space-y-2 relative">
              <label className="text-sm font-bold text-slate-600 uppercase">Search Category</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  placeholder="Type to search..."
                  value={categorySearch || formData.category}
                  onChange={e => {
                    setCategorySearch(e.target.value);
                    setFormData({...formData, category: e.target.value});
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {categorySearch && categories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {categories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
                    <button key={c} type="button" onClick={() => { setFormData({...formData, category: c}); setCategorySearch(''); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm">{c}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">Supplier Agency</label>
              <select 
                value={formData.agencyId}
                onChange={e => setFormData({...formData, agencyId: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">None / Unknown</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">Cost Price</label>
              <input type="number" step="0.01" required value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">MRP</label>
              <input type="number" step="0.01" required value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">Initial Stock</label>
              <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase">Expiry Date</label>
              <input type="date" required value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">Cancel</button>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Save Medicine</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
           <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setExpiryFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${expiryFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>All</button>
            <button onClick={() => setExpiryFilter('expired')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${expiryFilter === 'expired' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}>Expired</button>
            <button onClick={() => setExpiryFilter('soon')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${expiryFilter === 'soon' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}>Expiring Soon</button>
          </div>
          <p className="text-xs font-bold text-slate-400">Total Items: {filteredMedicines.length}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Medicine Info</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">In Stock</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status & Expiry</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Pricing</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map(med => {
                const status = getExpiryStatus(med.expiryDate);
                const agency = agencies.find(a => a.id === med.agencyId);
                return (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{med.category}</p>
                        {agency && (
                          <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                            {agency.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-xl text-sm font-black ${med.stock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                        {med.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border w-fit ${status.color}`}>
                          {status.icon && <status.icon size={12} />}
                          {status.label}
                        </span>
                        <p className="text-xs text-slate-500 font-bold ml-1">Exp: {new Date(med.expiryDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-slate-800">₹{med.mrp}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Cost: ₹{med.costPrice}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(med.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    No medicines match the selected agency or expiry filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedicineManagement;
