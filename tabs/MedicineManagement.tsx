
import React, { useState, useMemo } from 'react';
import { Medicine, Agency } from '../types';
import { Plus, Trash2, Edit2, AlertTriangle, Clock, Calculator, Percent, Sparkles, Upload, Loader2, Minus } from 'lucide-react';
import { ScannedMedicine, extractMedicineData } from '../services/geminiService';

interface Props {
  medicines: Medicine[];
  agencies: Agency[];
  onAdd: (med: Medicine) => void;
  onUpdate: (id: string, updates: Partial<Medicine>) => void;
  onDelete: (id: string) => void;
}

const MedicineManagement: React.FC<Props> = ({ medicines, agencies, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | 'soon'>('all');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    batchNumber: '',
    category: 'Tablet',
    basePrice: '',
    gstRate: '12',
    costPrice: '',
    mrp: '',
    quantity: '1', // Number of strips/boxes
    unitsPerPackage: '10', // Units per strip/box
    totalStock: '10', // Calculated total units
    expMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    expYear: (new Date().getFullYear() + 2).toString(),
    agencyId: ''
  });

  const { expiredMeds, soonMeds, regularMeds } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const expired: Medicine[] = [];
    const soon: Medicine[] = [];
    const regular: Medicine[] = [];

    medicines.forEach(med => {
      if (!med.expiryDate.includes('/')) {
        regular.push(med);
        return;
      }
      const [m, y] = med.expiryDate.split('/').map(Number);
      const isExpired = y < currentYear || (y === currentYear && m < currentMonth);
      const isSoon = y === currentYear && (m === currentMonth || m === currentMonth + 1);
      const isNextYearSoon = y === currentYear + 1 && currentMonth === 12 && m === 1;

      if (isExpired) expired.push(med);
      else if (isSoon || isNextYearSoon) soon.push(med);
      else regular.push(med);
    });

    return { expiredMeds: expired, soonMeds: soon, regularMeds: regular };
  }, [medicines]);

  const handleEdit = (med: Medicine) => {
    const [m, y] = med.expiryDate.split('/');
    setFormData({
      name: med.name,
      batchNumber: med.batchNumber || '',
      category: med.category,
      basePrice: (med.costPrice / 1.12).toFixed(2), // Rough estimate for base price if editing
      gstRate: '12',
      costPrice: med.costPrice.toString(),
      mrp: med.mrp.toString(),
      quantity: Math.floor(med.stock / (med.unitsPerPackage || 10)).toString(),
      unitsPerPackage: (med.unitsPerPackage || 10).toString(),
      totalStock: med.stock.toString(),
      expMonth: m,
      expYear: y,
      agencyId: med.agencyId || ''
    });
    setEditingId(med.id);
    setIsAdding(true);
  };

  // Auto-calculate Cost Price Per Unit and Total Stock
  const lastBasePrice = React.useRef(formData.basePrice);
  const lastGstRate = React.useRef(formData.gstRate);

  React.useEffect(() => {
    const base = parseFloat(formData.basePrice) || 0;
    const gst = parseFloat(formData.gstRate) || 0;
    
    const qty = parseInt(formData.quantity) || 0;
    const unitsPkg = parseInt(formData.unitsPerPackage) || 0;
    const total = qty * unitsPkg;

    const updates: any = { totalStock: total.toString() };

    // Only update costPrice if basePrice or gstRate actually changed
    if (formData.basePrice !== lastBasePrice.current || formData.gstRate !== lastGstRate.current) {
      const calculatedCost = base + (base * gst / 100);
      updates.costPrice = calculatedCost.toFixed(2);
      
      // Also update MRP if it was empty or matching old cost
      if (formData.mrp === '' || formData.mrp === lastBasePrice.current) {
        updates.mrp = calculatedCost.toFixed(2);
      }
      
      lastBasePrice.current = formData.basePrice;
      lastGstRate.current = formData.gstRate;
    }

    setFormData(prev => ({ ...prev, ...updates }));
  }, [formData.basePrice, formData.gstRate, formData.quantity, formData.unitsPerPackage]);

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
    const medData: Partial<Medicine> = {
      name: formData.name,
      batchNumber: formData.batchNumber,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice),
      mrp: parseFloat(formData.mrp),
      stock: parseInt(formData.totalStock) || 0,
      expiryDate: `${formData.expMonth}/${formData.expYear}`,
      agencyId: formData.agencyId || undefined,
      unitsPerPackage: parseInt(formData.unitsPerPackage) || 1
    };

    if (editingId) {
      onUpdate(editingId, medData);
      setEditingId(null);
    } else {
      const newMed: Medicine = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        batchNumber: formData.batchNumber,
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
    }
    setIsAdding(false);
    setFormData(prev => ({ ...prev, name: '', batchNumber: '', basePrice: '', mrp: '', totalStock: '' }));
  };

  const handleAIScan = (data: any) => {
    const unitsPkg = data.unitsPerPackage || 10;
    setFormData(prev => ({
      ...prev,
      name: data.name || '',
      batchNumber: data.batchNumber || '',
      category: data.category || 'Tablet',
      basePrice: ((data.basePrice || 0) / unitsPkg).toFixed(2),
      gstRate: (data.gstRate || 12).toString(),
      mrp: ((data.mrp || 0) / unitsPkg).toFixed(2),
      unitsPerPackage: unitsPkg.toString(),
      expMonth: data.expiryDate?.split('-')[1] || data.expMonth || (new Date().getMonth() + 1).toString().padStart(2, '0'),
      expYear: data.expiryDate?.split('-')[0] || data.expYear || (new Date().getFullYear() + 2).toString()
    }));
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await extractMedicineData(base64);
        handleAIScan(data);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medicine Master</h2>
          <p className="text-slate-500">Add products with accurate tax & unit pricing</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} className="text-blue-400" />}
            AI Upload
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="btn-primary py-3 px-6 shadow-lg">
            <Plus size={20} /> Add New
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] border border-blue-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="label-caps">Batch Number</label>
              <input value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} className="input-field" placeholder="e.g. B-123" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="label-caps">Medicine Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Enter Full Medicine Name" />
            </div>

            <div className="space-y-1">
              <label className="label-caps">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
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
              <label className="label-caps">Quantity (Strips)</label>
              <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="input-field" placeholder="1" />
            </div>

            <div className="space-y-1">
              <label className="label-caps">Units / Strip</label>
              <input type="number" required value={formData.unitsPerPackage} onChange={e => setFormData({...formData, unitsPerPackage: e.target.value})} className="input-field" placeholder="10" />
            </div>

            <div className="space-y-1">
              <label className="label-caps">Total Units</label>
              <div className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-black text-slate-500 flex items-center justify-between">
                <span>{formData.totalStock}</span>
                <span className="text-[10px] uppercase tracking-widest">Calculated</span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-3xl md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6 border border-blue-100/50">
              <div className="space-y-1">
                <label className="text-xs font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1"><Calculator size={12} /> Unit Base Price</label>
                <input type="number" step="0.01" required value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1"><Percent size={12} /> GST %</label>
                <input 
                  type="number" 
                  value={formData.gstRate} 
                  onChange={e => setFormData({...formData, gstRate: e.target.value})} 
                  className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" 
                  placeholder="12" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unit Cost (Final)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.costPrice} 
                    onChange={e => setFormData({...formData, costPrice: e.target.value})} 
                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-400 outline-none font-black text-slate-700" 
                    placeholder="0.00" 
                  />
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

      {/* Expired Medicines Section */}
      {expiredMeds.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-rose-100 p-2 rounded-xl text-rose-600"><AlertTriangle size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-rose-800 uppercase tracking-tight">Expired Medicines (Action Required)</h3>
              <p className="text-xs text-rose-600 font-bold">These medicines are past their expiry date. Remove them from stock immediately.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {expiredMeds.map(med => (
              <div key={med.id} className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{med.name}</p>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Expired: {med.expiryDate}</p>
                </div>
                <button onClick={() => onDelete(med.id)} className="p-2 text-rose-400 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soon to Expire Section */}
      {soonMeds.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Clock size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-amber-800 uppercase tracking-tight">Expiring Soon (Next 30-60 Days)</h3>
              <p className="text-xs text-amber-600 font-bold">Check these medicines and consider selling them first or returning to agency.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {soonMeds.map(med => (
              <div key={med.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{med.name}</p>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Expiring: {med.expiryDate}</p>
                </div>
                <button onClick={() => handleEdit(med)} className="p-2 text-amber-400 hover:text-amber-600 transition-all"><Edit2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="w-full text-left">
          <thead>
            <tr className="table-head">
              <th className="table-th">Batch</th>
              <th className="table-th">Medicine Name</th>
              <th className="table-th text-center">Qty (Strips)</th>
              <th className="table-th text-center">Units (Total)</th>
              <th className="table-th text-center">Profit / Unit</th>
              <th className="table-th text-center">Profit / Strip</th>
              <th className="table-th">Expiry</th>
              <th className="table-th text-right">Unit MRP</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.map(med => {
              const status = getExpiryStatus(med.expiryDate);
              const isExpired = status.label === 'Expired';
              return (
                <tr key={med.id} className={`table-row group ${isExpired ? 'bg-rose-50/50' : ''}`}>
                  <td className="table-td font-mono text-xs text-slate-500">{med.batchNumber || '-'}</td>
                  <td className="table-td font-bold text-slate-800">{med.name}</td>
                  <td className="table-td text-center">
                    <span className="text-sm font-black text-slate-700">
                      {Math.floor(med.stock / (med.unitsPerPackage || 10))} Strips
                    </span>
                  </td>
                  <td className="table-td text-center">
                    <span className={`text-sm font-black ${med.stock < 10 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {med.stock} Units
                    </span>
                  </td>
                  <td className="table-td text-center">
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                      ₹{(med.mrp - med.costPrice).toFixed(2)}
                    </span>
                  </td>
                  <td className="table-td text-center">
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">
                      ₹{((med.mrp - med.costPrice) * (med.unitsPerPackage || 10)).toFixed(2)}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border ${getExpiryStatus(med.expiryDate).color}`}>
                      {med.expiryDate}
                    </span>
                  </td>
                  <td className="table-td text-right font-black text-emerald-600">₹{med.mrp.toFixed(2)}</td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(med)}
                        className="p-2 text-blue-400 hover:text-blue-600 transition-all active:scale-90"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          console.log("Trash button clicked for med:", med.id);
                          e.stopPropagation();
                          onDelete(med.id);
                        }} 
                        className="p-2 text-rose-400 hover:text-rose-600 transition-all active:scale-90 cursor-pointer relative z-10"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          console.log("Minus button clicked for med:", med.id);
                          e.stopPropagation();
                          onDelete(med.id);
                        }} 
                        className="p-2 text-amber-400 hover:text-amber-600 transition-all active:scale-90 cursor-pointer relative z-10"
                        title="Quick Remove"
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicineManagement;
