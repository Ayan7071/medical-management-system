
import React, { useState, useMemo } from 'react';
import { Medicine, Transaction, Patient } from '../types';
import { Search, Printer, Plus, Minus, ArrowRight, CheckCircle2, AlertCircle, ShoppingBag, X as LucideX, TrendingUp, Trash2 } from 'lucide-react';

interface Props {
  medicines: Medicine[];
  patients: Patient[];
  onUpdate: (id: string, updates: Partial<Medicine>) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (t: Transaction) => void;
}

const StockView: React.FC<Props> = ({ medicines, patients, onUpdate, onDelete, onAddTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [unitsToDeduct, setUnitsToDeduct] = useState<string>('1');

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMed = useMemo(() => 
    medicines.find(m => m.id === selectedMedId), 
    [medicines, selectedMedId]
  );

  const profitPerMed = useMemo(() => {
    if (!selectedMed) return 0;
    return selectedMed.mrp - selectedMed.costPrice;
  }, [selectedMed]);

  const totalProfit = useMemo(() => {
    return (parseInt(unitsToDeduct) || 0) * profitPerMed;
  }, [unitsToDeduct, profitPerMed]);

  const handleQuickDeduct = () => {
    if (!selectedMed || !unitsToDeduct) return;
    const qty = parseInt(unitsToDeduct);
    if (isNaN(qty) || qty <= 0) return;
    
    if (qty > selectedMed.stock) {
      alert("Insufficient stock!");
      return;
    }

    // Record this as a "Walk-in" transaction to capture profit
    const totalAmount = qty * selectedMed.mrp;
    const totalCost = qty * selectedMed.costPrice;
    
    // Create or find a "Quick Sale" dummy patient if needed, 
    // but here we'll just try to use the first patient or a dummy ID.
    const walkInPatientId = patients[0]?.id || "walk-in-direct";

    onAddTransaction({
      id: Math.random().toString(36).substr(2, 9),
      patientId: walkInPatientId,
      medicines: [{ medicineId: selectedMed.id, quantity: qty, price: totalAmount }],
      totalAmount,
      paidAmount: totalAmount,
      creditAmount: 0,
      totalCost,
      profit: totalAmount - totalCost,
      date: new Date().toISOString()
    });

    setUnitsToDeduct('1');
    setSelectedMedId(null);
    setQuickSearch('');
    alert(`Success! Profit of ₹${(totalAmount - totalCost).toFixed(2)} recorded.`);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none"><ShoppingBag size={250} /></div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-500 rounded-3xl shadow-xl shadow-blue-500/20"><Minus size={32} className="text-white" /></div>
              <div>
                  <h3 className="text-3xl font-black tracking-tighter">Direct Med Sale</h3>
                  <p className="text-slate-400 text-lg font-medium">Cut medicines & record profit instantly</p>
              </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                <input 
                  type="text"
                  placeholder="Type Medicine Name..."
                  value={quickSearch}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    const found = medicines.find(m => m.name.toLowerCase() === e.target.value.toLowerCase());
                    if (found) setSelectedMedId(found.id);
                  }}
                  className="w-full pl-16 pr-6 py-6 bg-slate-800/80 border-2 border-slate-700 rounded-[2rem] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-2xl font-bold"
                />
                
                {quickSearch && !selectedMedId && (
                  <div className="absolute z-20 w-full mt-3 bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl max-h-64 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {medicines
                      .filter(m => m.name.toLowerCase().includes(quickSearch.toLowerCase()))
                      .map(m => (
                        <div key={m.id} className="w-full flex items-center hover:bg-slate-700 border-b border-slate-700 last:border-0">
                          <button onClick={() => { setSelectedMedId(m.id); setQuickSearch(m.name); }} className="flex-1 text-left px-8 py-5 flex justify-between items-center group">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.batchNumber || 'No Batch'}</span>
                              <span className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">{m.name}</span>
                            </div>
                            <span className="text-sm font-black text-slate-400">{m.stock} Meds Left</span>
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              console.log("Trash button clicked for med (search):", m.id);
                              e.stopPropagation();
                              onDelete(m.id);
                            }}
                            className="p-5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer relative z-10"
                            title="Delete Medicine"
                          >
                            <Trash2 size={20} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              console.log("Minus button clicked for med (search):", m.id);
                              e.stopPropagation();
                              onDelete(m.id);
                            }}
                            className="p-5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all active:scale-90 cursor-pointer relative z-10 border-l border-slate-700"
                            title="Quick Remove"
                          >
                            <Minus size={20} />
                          </button>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              {selectedMed ? (
                <div className="bg-slate-800/60 border-2 border-blue-500/30 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-10 animate-in zoom-in-95 duration-300">
                  <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h4 className="text-3xl font-black tracking-tight">{selectedMed.name}</h4>
                        <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                          <TrendingUp size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">₹{profitPerMed.toFixed(2)} Profit/Med</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-2">
                          <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-700 flex-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Cost / MRP</p>
                              <p className="text-lg font-black text-slate-300">₹{selectedMed.costPrice} / <span className="text-white">₹{selectedMed.mrp}</span></p>
                          </div>
                          <div className="bg-emerald-900/40 p-4 rounded-3xl border border-emerald-500/20 flex-1">
                              <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Mera Profit</p>
                              <p className="text-2xl font-black text-emerald-400">₹{totalProfit.toFixed(2)}</p>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="relative group">
                        <input 
                            type="number"
                            value={unitsToDeduct}
                            onChange={(e) => setUnitsToDeduct(e.target.value)}
                            className="w-24 py-6 bg-slate-900 border-2 border-slate-600 rounded-3xl focus:border-emerald-500 outline-none text-3xl font-black text-center"
                        />
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 px-2 rounded-lg text-[10px] font-black text-slate-500 uppercase border border-slate-700">Qty</span>
                      </div>
                      <button onClick={handleQuickDeduct} className="p-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.75rem] shadow-2xl transition-all active:scale-95 group/btn">
                          <CheckCircle2 size={40} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button onClick={() => { setSelectedMedId(null); setQuickSearch(''); setUnitsToDeduct('1'); }} className="p-6 bg-slate-700 hover:bg-rose-500 text-white rounded-[1.75rem] transition-all">
                          <LucideX size={40} />
                      </button>
                  </div>
                </div>
              ) : (
                <div className="h-44 border-4 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-600 font-bold italic gap-2 transition-colors hover:border-slate-700">
                  <AlertCircle size={40} />
                  <p className="text-xl">Search Medicine Name to start counting profit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Total Medicines Inventory</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-bold hover:bg-slate-50 transition-all">
            <Printer size={20} /> Print List
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search stock..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold w-80 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-left">
          <thead>
            <tr className="table-head">
              <th className="table-th">Batch</th>
              <th className="table-th">Medicine Name</th>
              <th className="table-th text-center">Quantity (Strips)</th>
              <th className="table-th text-center">Units (Total)</th>
              <th className="table-th text-center">Profit / Unit</th>
              <th className="table-th text-center">Profit / Strip</th>
              <th className="table-th text-center">Total Sold</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMedicines.map(med => (
              <tr key={med.id} className="table-row">
                <td className="table-td font-mono text-xs text-slate-500">{med.batchNumber || '-'}</td>
                <td className="table-td"><p className="text-lg font-bold text-slate-800">{med.name}</p></td>
                <td className="table-td text-center">
                  <p className="text-xl font-black text-slate-800">
                    {Math.floor(med.stock / (med.unitsPerPackage || 10))}
                  </p>
                </td>
                <td className="table-td text-center">
                  <p className={`text-xl font-black ${med.stock < 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {med.stock}
                  </p>
                </td>
                <td className="table-td text-center">
                  <span className="badge badge-success border border-emerald-100">
                    ₹{(med.mrp - med.costPrice).toFixed(2)}
                  </span>
                </td>
                <td className="table-td text-center">
                  <span className="badge badge-info border border-blue-100 bg-blue-50 text-blue-600">
                    ₹{((med.mrp - med.costPrice) * (med.unitsPerPackage || 10)).toFixed(2)}
                  </span>
                </td>
                <td className="table-td text-center">
                  <span className="text-lg font-bold text-blue-600">{med.sold} Sold</span>
                </td>
                <td className="table-td text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        console.log("Trash button clicked for med (table):", med.id);
                        e.stopPropagation();
                        onDelete(med.id);
                      }} 
                      className="p-3 text-rose-600 bg-rose-50 rounded-2xl hover:bg-rose-600 hover:text-white transition-all group active:scale-90 cursor-pointer relative z-10"
                      title="Delete Medicine"
                    >
                      <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        console.log("Minus button clicked for med (table):", med.id);
                        e.stopPropagation();
                        onDelete(med.id);
                      }} 
                      className="p-3 text-amber-600 bg-amber-50 rounded-2xl hover:bg-amber-600 hover:text-white transition-all group active:scale-90 cursor-pointer relative z-10"
                      title="Quick Remove"
                    >
                      <Minus size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockView;
