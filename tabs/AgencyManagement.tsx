
import React, { useState, useRef } from 'react';
import { Agency, Medicine, BillItem } from '../types';
import { Plus, Trash2, Phone, MapPin, Building2, Upload, Sparkles, Loader2, CheckCircle2, X } from 'lucide-react';
import { extractBillData } from '../services/geminiService';

interface Props {
  agencies: Agency[];
  medicines: Medicine[];
  onAddAgency: (a: Agency) => void;
  onDeleteAgency: (id: string) => void;
  onBatchAddMedicines: (meds: Medicine[]) => void;
}

const AgencyManagement: React.FC<Props> = ({ agencies, medicines, onAddAgency, onDeleteAgency, onBatchAddMedicines }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [newAgency, setNewAgency] = useState({ name: '', contact: '', address: '' });
  const [scannedItems, setScannedItems] = useState<BillItem[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const billInputRef = useRef<HTMLInputElement>(null);

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBill(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const items = await extractBillData(base64);
        setScannedItems(items);
        setIsUploadingBill(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingBill(false);
    }
  };

  const updateScannedItem = (index: number, field: keyof BillItem, value: string | number) => {
    const updated = [...scannedItems];
    updated[index] = { ...updated[index], [field]: value };
    setScannedItems(updated);
  };

  const removeScannedItem = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const addNewItemRow = () => {
    setScannedItems([...scannedItems, { name: '', quantity: 1, costPrice: 0, mrp: 0, category: 'Tablet', expiryDate: new Date().toISOString().split('T')[0] }]);
  };

  const confirmBillEntry = () => {
    if (scannedItems.length === 0) return;
    
    const newMeds: Medicine[] = scannedItems.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      category: item.category || 'Medicine',
      costPrice: Number(item.costPrice),
      mrp: Number(item.mrp),
      stock: Number(item.quantity),
      sold: 0,
      expiryDate: item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      agencyId: selectedAgencyId || undefined
    }));

    onBatchAddMedicines(newMeds);
    setScannedItems([]);
    alert(`Successfully added ${newMeds.length} items to inventory!`);
  };

  const handleAddAgency = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAgency({
      id: Math.random().toString(36).substr(2, 9),
      ...newAgency
    });
    setNewAgency({ name: '', contact: '', address: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Agency Partners</h2>
          <p className="text-slate-500">Manage suppliers and automate stock entry via bills</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={billInputRef} 
            onChange={handleBillUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => billInputRef.current?.click()}
            disabled={isUploadingBill}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isUploadingBill ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Scan Agency Bill
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            Add New Agency
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAddAgency} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Agency Name</label>
              <input required value={newAgency.name} onChange={e => setNewAgency({...newAgency, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Contact Number</label>
              <input required value={newAgency.contact} onChange={e => setNewAgency({...newAgency, contact: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
              <input required value={newAgency.address} onChange={e => setNewAgency({...newAgency, address: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-slate-500 font-bold">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700">Save Agency</button>
            </div>
          </form>
        </div>
      )}

      {scannedItems.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-blue-500 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="bg-blue-600 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="animate-pulse" size={24} />
              <div>
                <h3 className="font-bold text-lg">AI Bill Editor</h3>
                <p className="text-xs text-blue-100">Review and edit extracted data below</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedAgencyId} 
                onChange={(e) => setSelectedAgencyId(e.target.value)}
                className="bg-blue-500 border border-blue-400 text-white text-sm rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="">Assign to Agency (Optional)</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={addNewItemRow} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm font-bold flex items-center gap-1">
                <Plus size={16} /> Add Row
              </button>
              <button onClick={confirmBillEntry} className="px-6 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-bold shadow-md hover:bg-blue-50">
                Confirm & Save
              </button>
              <button onClick={() => setScannedItems([])} className="p-1.5 bg-blue-500 hover:bg-rose-500 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-blue-50 border-b border-blue-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest">Medicine Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest">CP (₹)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest">MRP (₹)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest">Expiry Date</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {scannedItems.map((item, i) => (
                  <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => updateScannedItem(i, 'name', e.target.value)}
                        className="w-full bg-transparent font-bold text-slate-800 focus:text-blue-600 outline-none"
                        placeholder="Name"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateScannedItem(i, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-16 mx-auto text-center bg-transparent text-slate-600 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        value={item.costPrice} 
                        onChange={(e) => updateScannedItem(i, 'costPrice', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-transparent text-slate-600 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        value={item.mrp} 
                        onChange={(e) => updateScannedItem(i, 'mrp', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-transparent font-bold text-slate-800 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="date" 
                        value={item.expiryDate} 
                        onChange={(e) => updateScannedItem(i, 'expiryDate', e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => removeScannedItem(i)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agencies.map(agn => (
          <div key={agn.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <button 
                onClick={() => onDeleteAgency(agn.id)}
                className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-4">{agn.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-500">
                <Phone size={16} />
                <span className="text-sm font-medium">{agn.contact}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-500">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm font-medium leading-tight">{agn.address}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Supplier</span>
              </div>
              <p className="text-xs font-bold text-blue-600">
                {medicines.filter(m => m.agencyId === agn.id).length} Products
              </p>
            </div>
          </div>
        ))}
        {agencies.length === 0 && (
          <div className="lg:col-span-3 py-16 text-center text-slate-400">
            No agencies registered. Start by adding your first supplier.
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyManagement;
