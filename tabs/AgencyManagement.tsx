
import React, { useState, useRef, useMemo } from 'react';
import { Agency, Medicine, BillItem, AgencyBill } from '../types';
import { 
  Plus, Trash2, Phone, MapPin, Building2, Upload, Sparkles, Loader2, CheckCircle2, X, 
  Receipt, Wallet, History, AlertCircle, IndianRupee, Save, ChevronLeft, Calendar,
  ArrowRight, Search, ListFilter, Check, CreditCard
} from 'lucide-react';
import { extractBillData } from '../services/geminiService';

interface Props {
  agencies: Agency[];
  medicines: Medicine[];
  agencyBills: AgencyBill[];
  onAddAgency: (a: Agency) => void;
  onDeleteAgency: (id: string) => void;
  onBatchAddMedicines: (meds: Medicine[]) => void;
  onAddAgencyBill: (b: AgencyBill) => void;
  onUpdateAgencyBill: (id: string, updates: Partial<AgencyBill>) => void;
}

const AgencyManagement: React.FC<Props> = ({ 
  agencies, medicines, agencyBills, onAddAgency, onDeleteAgency, onBatchAddMedicines, onAddAgencyBill, onUpdateAgencyBill 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'suppliers' | 'ledger'>('suppliers');
  const [isAddingAgency, setIsAddingAgency] = useState(false);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [newAgency, setNewAgency] = useState({ name: '', contact: '', address: '' });
  const [scannedItems, setScannedItems] = useState<BillItem[]>([]);
  const [selectedAgencyIdForScan, setSelectedAgencyIdForScan] = useState<string>('');
  
  // Payment states
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Ledger/Bill Form state
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [billForm, setBillForm] = useState({
    agencyId: '',
    billNumber: '',
    totalAmount: '',
    paidAmount: '',
    notes: ''
  });

  const billInputRef = useRef<HTMLInputElement>(null);

  const totalOutstanding = useMemo(() => 
    agencyBills.reduce((acc, curr) => acc + curr.pendingAmount, 0), 
    [agencyBills]
  );

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
      agencyId: selectedAgencyIdForScan || undefined
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
    setIsAddingAgency(false);
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.agencyId) {
      alert("Please select an agency first!");
      return;
    }

    const total = parseFloat(billForm.totalAmount) || 0;
    const paid = parseFloat(billForm.paidAmount) || 0;
    
    const newBill: AgencyBill = {
      id: Math.random().toString(36).substr(2, 9),
      agencyId: billForm.agencyId,
      billNumber: billForm.billNumber || `BILL-${Date.now()}`,
      date: new Date().toISOString(),
      totalAmount: total,
      paidAmount: paid,
      pendingAmount: total - paid,
      notes: billForm.notes
    };

    onAddAgencyBill(newBill);
    setIsAddingBill(false);
    setBillForm({ agencyId: '', billNumber: '', totalAmount: '', paidAmount: '', notes: '' });
    alert("Bill recorded successfully!");
  };

  const submitPayment = (bill: AgencyBill) => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid payment amount.");
        return;
    }

    if (amount > bill.pendingAmount) {
        if (!window.confirm("Payment amount is more than pending amount. Do you want to proceed?")) return;
    }

    const newPaidAmount = bill.paidAmount + amount;
    onUpdateAgencyBill(bill.id, {
      paidAmount: newPaidAmount,
      pendingAmount: Math.max(0, bill.totalAmount - newPaidAmount)
    });
    
    setPayingBillId(null);
    setPaymentAmount('');
    alert("Payment recorded successfully!");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Agency & Supplier Ledger</h2>
          <p className="text-slate-500">Track bills, payments, and supplier credits</p>
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
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all disabled:opacity-50"
          >
            {isUploadingBill ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Scan Bill
          </button>
          <button 
            onClick={() => setIsAddingBill(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-md"
          >
            <Plus size={18} /> New Bill Entry
          </button>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pending Dues (Owed to Suppliers)</p>
            <h3 className="text-3xl font-black text-rose-600">₹{totalOutstanding.toLocaleString()}</h3>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Registered Agencies</p>
                <p className="text-xl font-black text-slate-800">{agencies.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Bills</p>
                <p className="text-xl font-black text-slate-800">{agencyBills.length}</p>
            </div>
        </div>
      </div>

      {/* Form Overlay for New Bill */}
      {isAddingBill && (
        <div className="bg-white p-8 rounded-3xl border-2 border-blue-100 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Receipt size={20} className="text-blue-600" /> Record Supplier Bill</h3>
            <button onClick={() => setIsAddingBill(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
          </div>
          <form onSubmit={handleAddBill} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Supplier Agency</label>
              <select 
                required
                value={billForm.agencyId}
                onChange={e => setBillForm({...billForm, agencyId: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Agency --</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Number</label>
              <input required value={billForm.billNumber} onChange={e => setBillForm({...billForm, billNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. AG-5021" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bill Amount (₹)</label>
              <input type="number" step="0.01" required value={billForm.totalAmount} onChange={e => setBillForm({...billForm, totalAmount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="5000" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid Now (₹)</label>
              <input type="number" step="0.01" required value={billForm.paidAmount} onChange={e => setBillForm({...billForm, paidAmount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-blue-500" placeholder="2000" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes / Remarks</label>
              <input value={billForm.notes} onChange={e => setBillForm({...billForm, notes: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add any details about the payment or items..." />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsAddingBill(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">Cancel</button>
              <button type="submit" className="px-10 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">Save Bill Record</button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'suppliers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <Building2 size={16} /> Suppliers
        </button>
        <button 
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'ledger' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <History size={16} /> Full Bills Ledger
        </button>
      </div>

      {activeSubTab === 'suppliers' ? (
        <div className="space-y-6">
           {/* Add Agency Form Toggle */}
           <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Your Supplier Network</h3>
                <button onClick={() => setIsAddingAgency(!isAddingAgency)} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add New Supplier
                </button>
           </div>

           {isAddingAgency && (
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
                    <form onSubmit={handleAddAgency} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Agency Name</label>
                            <input required value={newAgency.name} onChange={e => setNewAgency({...newAgency, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Contact</label>
                            <input required value={newAgency.contact} onChange={e => setNewAgency({...newAgency, contact: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                            <input required value={newAgency.address} onChange={e => setNewAgency({...newAgency, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddingAgency(false)} className="text-slate-400 font-bold px-4">Cancel</button>
                            <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl">Save Agency</button>
                        </div>
                    </form>
                </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map(agn => {
              const pending = agencyBills
                .filter(b => b.agencyId === agn.id)
                .reduce((acc, curr) => acc + curr.pendingAmount, 0);

              return (
                <div key={agn.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Building2 size={24} />
                    </div>
                    <button onClick={() => onDeleteAgency(agn.id)} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">{agn.name}</h4>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-slate-500 flex items-center gap-2"><Phone size={14} /> {agn.contact}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-2"><MapPin size={14} /> {agn.address}</p>
                  </div>
                  
                  <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between ${pending > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Due</span>
                    <span className={`font-black ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{pending.toLocaleString()}</span>
                  </div>

                  <button 
                    onClick={() => { setActiveSubTab('ledger'); }}
                    className="mt-6 w-full py-2.5 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    View History <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
            {agencies.length === 0 && (
                <div className="md:col-span-3 py-20 text-center text-slate-400 font-medium">No agencies found. Add your first supplier to start tracking bills.</div>
            )}
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Supplier Ledger (All Bills)</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Agency Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Bill Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Total Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Paid</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Pending</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {agencyBills.map(bill => {
                            const agency = agencies.find(a => a.id === bill.agencyId);
                            const isPaying = payingBillId === bill.id;
                            return (
                                <tr key={bill.id} className={`transition-colors ${isPaying ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'}`}>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{agency?.name || 'Unknown'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{agency?.contact}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-600 text-sm">#{bill.billNumber}</p>
                                        <p className="text-xs text-slate-400">{new Date(bill.date).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-800">₹{bill.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 font-black text-emerald-600">₹{bill.paidAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${bill.pendingAmount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {bill.pendingAmount > 0 ? `₹${bill.pendingAmount.toLocaleString()} Pending` : 'Cleared'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {bill.pendingAmount > 0 ? (
                                            isPaying ? (
                                                <div className="flex items-center justify-end gap-2 animate-in slide-in-from-right-2">
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                                        <input 
                                                            autoFocus
                                                            type="number"
                                                            value={paymentAmount}
                                                            onChange={e => setPaymentAmount(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && submitPayment(bill)}
                                                            placeholder={bill.pendingAmount.toString()}
                                                            className="w-24 pl-6 pr-2 py-1.5 bg-white border border-blue-400 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <button onClick={() => submitPayment(bill)} className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-all">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => setPayingBillId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        setPayingBillId(bill.id);
                                                        setPaymentAmount(bill.pendingAmount.toString());
                                                    }}
                                                    className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                                                >
                                                    <CreditCard size={14} /> Pay Now
                                                </button>
                                            )
                                        ) : (
                                            <span className="text-emerald-500 font-bold text-xs flex items-center justify-end gap-1"><CheckCircle2 size={14} /> Settled</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {agencyBills.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium italic">No bill records found in the ledger.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* AI Scanning Logic maintained */}
      {scannedItems.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-blue-500 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="bg-blue-600 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="animate-pulse" size={24} />
              <div>
                <h3 className="font-bold text-lg">AI Bill Scanned</h3>
                <p className="text-xs text-blue-100">Review and verify items before saving</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedAgencyIdForScan} 
                onChange={(e) => setSelectedAgencyIdForScan(e.target.value)}
                className="bg-blue-500 border border-blue-400 text-white text-sm rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="">Assign to Agency</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={confirmBillEntry} className="px-6 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-bold shadow-md hover:bg-blue-50 transition-all">
                Add to Stock
              </button>
              <button onClick={() => setScannedItems([])} className="p-1.5 bg-blue-500 hover:bg-rose-500 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left">
              <thead className="bg-blue-50 border-b border-blue-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest text-right">Cost (₹)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest text-right">MRP (₹)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-blue-800 uppercase tracking-widest text-center">Expiry</th>
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
                        className="w-full bg-transparent font-bold text-slate-800 focus:ring-1 focus:ring-blue-300 rounded px-1 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateScannedItem(i, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-16 mx-auto text-center bg-transparent text-slate-600 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input 
                        type="number" 
                        value={item.costPrice} 
                        onChange={(e) => updateScannedItem(i, 'costPrice', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-transparent text-right text-slate-600 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input 
                        type="number" 
                        value={item.mrp} 
                        onChange={(e) => updateScannedItem(i, 'mrp', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-transparent text-right font-bold text-slate-800 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
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
    </div>
  );
};

export default AgencyManagement;
