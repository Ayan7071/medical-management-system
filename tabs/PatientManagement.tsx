
import React, { useState, useMemo } from 'react';
import { Patient, Medicine, Transaction, Credit } from '../types';
import { Search, ShoppingCart, Trash2, Users, IndianRupee, Minus, Plus } from 'lucide-react';

interface Props {
  isActive?: boolean;
  patients: Patient[];
  medicines: Medicine[];
  credits: Credit[];
  transactions: Transaction[];
  onAddPatient: (p: Patient) => void;
  onDeletePatient: (id: string) => void;
  onAddTransaction: (t: Transaction) => void;
}

const PatientManagement: React.FC<Props> = ({ isActive, patients, medicines, credits, transactions, onAddPatient, onDeletePatient, onAddTransaction }) => {
  const [activeView, setActiveView] = useState<'list' | 'new-sale' | 'details'>('list');
  const [searchPatient, setSearchPatient] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cart, setCart] = useState<{medicineId: string, quantity: number}[]>([]);
  const [newPatientData, setNewPatientData] = useState({ name: '', phone: '' });
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isCreditSale, setIsCreditSale] = useState(false);
  const [customPayable, setCustomPayable] = useState<string>('');

  const patientNameRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isActive && activeView === 'list' && patientNameRef.current) {
      patientNameRef.current.focus();
    }
  }, [isActive, activeView]);

  const filteredMedicines = useMemo(() => 
    medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()))
  , [medicines, medSearch]);

  const cartTotal = useMemo(() => 
    cart.reduce((acc, item) => {
      const med = medicines.find(m => m.id === item.medicineId);
      return acc + (med ? med.mrp * item.quantity : 0);
    }, 0)
  , [cart, medicines]);

  React.useEffect(() => {
    setCustomPayable(cartTotal.toString());
  }, [cartTotal]);

  const addToCart = (medId: string) => {
    const med = medicines.find(m => m.id === medId);
    if (!med || med.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.medicineId === medId);
      if (existing) {
        if (existing.quantity >= med.stock) {
          alert("Insufficient stock!");
          return prev;
        }
        return prev.map(i => i.medicineId === medId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { medicineId: medId, quantity: 1 }];
    });
  };

  const updateCartQty = (medId: string, delta: number) => {
    const med = medicines.find(m => m.id === medId);
    setCart(prev => prev.map(i => {
      if (i.medicineId === medId) {
        const newQty = Math.max(1, i.quantity + delta);
        if (med && newQty > med.stock) return i;
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const handleCheckout = () => {
    if (!selectedPatientId || cart.length === 0) return;
    let totalAmount = 0;
    let totalCost = 0;
    const saleMeds = cart.map(item => {
      const med = medicines.find(m => m.id === item.medicineId)!;
      const linePrice = item.quantity * med.mrp;
      totalAmount += linePrice;
      totalCost += item.quantity * med.costPrice;
      return { medicineId: item.medicineId, quantity: item.quantity, price: linePrice };
    });

    const finalTotal = parseFloat(customPayable) || totalAmount;
    const paid = parseFloat(paidAmount) || 0;
    const credit = isCreditSale ? Math.max(0, finalTotal - paid) : 0;

    onAddTransaction({
      id: Math.random().toString(36).substr(2, 9),
      patientId: selectedPatientId,
      medicines: saleMeds,
      totalAmount: finalTotal,
      paidAmount: isCreditSale ? paid : finalTotal,
      creditAmount: credit,
      totalCost,
      profit: finalTotal - totalCost,
      date: new Date().toISOString(),
      isCredit: isCreditSale && credit > 0
    });
    setCart([]);
    setSelectedPatientId('');
    setPaidAmount('');
    setIsCreditSale(false);
    setActiveView('list');
    alert(isCreditSale ? `Sale completed with ₹${credit} credit!` : 'Sale completed!');
  };

  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPatientId)
  , [patients, selectedPatientId]);

  const patientCredits = useMemo(() => 
    credits.filter(c => c.patientId === selectedPatientId)
  , [credits, selectedPatientId]);

  const patientTransactions = useMemo(() => 
    transactions.filter(t => t.patientId === selectedPatientId)
  , [transactions, selectedPatientId]);

  const totalPendingCredit = useMemo(() => 
    patientCredits.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.amount, 0)
  , [patientCredits]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Direct Sales Counter</h2>
        <button onClick={() => setActiveView(activeView === 'list' ? 'new-sale' : 'list')} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">
          {activeView === 'list' ? 'New Sale' : 'Back to Patients'}
        </button>
      </div>

      {activeView === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search patient..." value={searchPatient} onChange={e => setSearchPatient(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm" />
            </div>
            <div className="bg-white rounded-2xl border divide-y overflow-hidden shadow-sm">
              {patients.filter(p => p.name.toLowerCase().includes(searchPatient.toLowerCase())).map(p => {
                const pending = credits.filter(c => c.patientId === p.id && c.status === 'pending').reduce((acc, c) => acc + c.amount, 0);
                return (
                  <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Users size={24} /></div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{p.name}</p>
                        <p className="text-sm text-slate-500">{p.phone}</p>
                        {pending > 0 && (
                          <p className="text-xs font-black text-rose-600 uppercase mt-1">Udhari: ₹{pending}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedPatientId(p.id); setActiveView('details'); }} className="text-slate-600 font-bold px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all">History</button>
                      <button onClick={() => { setSelectedPatientId(p.id); setActiveView('new-sale'); }} className="text-blue-600 font-bold px-6 py-2 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all">New Sale</button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          console.log("Trash button clicked for patient:", p.id);
                          e.stopPropagation();
                          onDeletePatient(p.id);
                        }} 
                        className="p-2 text-rose-400 hover:text-rose-600 transition-all active:scale-90 cursor-pointer relative z-10"
                        title="Delete Patient"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          console.log("Minus button clicked for patient:", p.id);
                          e.stopPropagation();
                          onDeletePatient(p.id);
                        }} 
                        className="p-2 text-amber-400 hover:text-amber-600 transition-all active:scale-90 cursor-pointer relative z-10"
                        title="Quick Remove"
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border shadow-sm h-fit">
            <h3 className="text-xl font-bold mb-6">Quick Register</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAddPatient({ id: Math.random().toString(36).substr(2, 9), ...newPatientData, createdAt: new Date().toISOString() }); setNewPatientData({name: '', phone: ''}); }} className="space-y-4">
              <input 
                ref={patientNameRef}
                required 
                placeholder="Patient Name" 
                value={newPatientData.name} 
                onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" 
              />
              <input required placeholder="Phone Number" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" />
              <button type="submit" className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-xl">Add Patient</button>
            </form>
          </div>
        </div>
      ) : activeView === 'details' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <Users size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800">{selectedPatient?.name}</h3>
                <p className="text-slate-500 font-bold text-lg">{selectedPatient?.phone}</p>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center min-w-[200px]">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Pending Udhari</p>
              <p className="text-3xl font-black text-rose-600">₹{totalPendingCredit.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50">
              <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs">Purchase History (Medicines Sold)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Date</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Medicines</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patientTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-600">
                        {new Date(tx.date).toLocaleDateString()}
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(tx.date).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          {tx.medicines.map((m, idx) => {
                            const med = medicines.find(item => item.id === m.medicineId);
                            return (
                              <p key={idx} className="text-sm font-bold text-slate-800">
                                {med?.name || 'Unknown'} <span className="text-slate-400 font-medium">x {m.quantity}</span>
                              </p>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-emerald-600 text-lg">₹{tx.totalAmount}</td>
                    </tr>
                  ))}
                  {patientTransactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-16 text-center text-slate-400 font-bold italic">No purchase history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50">
              <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs">Udhari (Credit) History</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Date</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Amount</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patientCredits.map(credit => (
                    <tr key={credit.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-600">
                        {new Date(credit.date).toLocaleDateString()}
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(credit.date).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-8 py-5 font-black text-slate-800 text-lg">₹{credit.amount}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${credit.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {credit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {patientCredits.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-16 text-center text-slate-400 font-bold italic">No credit history found for this patient.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search medicine name..." value={medSearch} onChange={e => setMedSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border rounded-2xl shadow-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMedicines.map(med => (
                <div key={med.id} className="p-6 border rounded-[2rem] bg-white hover:border-blue-500 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xl font-black text-slate-800 mb-1">{med.name}</h4>
                      <p className="text-sm font-bold text-blue-500">Stock: {med.stock} Units</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">₹{med.mrp}</p>
                  </div>
                  <button disabled={med.stock <= 0} onClick={() => addToCart(med.id)} className="w-full py-4 bg-blue-50 text-blue-600 font-black rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all disabled:opacity-40">
                    Add To Cart
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border p-8 space-y-8 shadow-2xl sticky top-24 h-fit">
            <div className="space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2 text-slate-800"><ShoppingCart size={24} className="text-blue-600" /> Sale Basket</h3>
              <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold">
                <option value="">Choose Patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="divide-y max-h-80 overflow-y-auto">
                {cart.map((item, idx) => {
                  const med = medicines.find(m => m.id === item.medicineId)!;
                  return (
                    <div key={item.medicineId} className="py-4 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-black text-slate-800">{med.name}</p>
                        <p className="text-xs font-bold text-slate-400">₹{med.mrp} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-100 rounded-xl px-2">
                           <button onClick={() => updateCartQty(item.medicineId, -1)} className="p-1 hover:text-rose-500"><Minus size={16} /></button>
                           <span className="w-8 text-center font-black">{item.quantity}</span>
                           <button onClick={() => updateCartQty(item.medicineId, 1)} className="p-1 hover:text-emerald-500"><Plus size={16} /></button>
                        </div>
                        <button onClick={() => setCart(c => c.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600"><Trash2 size={20} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-6 border-t space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-600">Payment Mode</label>
                  <button 
                    onClick={() => setIsCreditSale(!isCreditSale)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${isCreditSale ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}
                  >
                    {isCreditSale ? 'Credit (Udhari)' : 'Full Paid'}
                  </button>
                </div>
                
                {isCreditSale && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount Paid Now (₹)</label>
                    <input 
                      type="number" 
                      value={paidAmount} 
                      onChange={e => setPaidAmount(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold"
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-rose-500 font-bold mt-1">Remaining ₹{Math.max(0, cartTotal - (parseFloat(paidAmount) || 0))} will be added to Udhari.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-2xl font-black text-slate-800 px-2">
                <span>Payable:</span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <span>₹</span>
                  <input 
                    type="number" 
                    value={customPayable} 
                    onChange={e => setCustomPayable(e.target.value)}
                    className="w-32 bg-emerald-50 border-none text-right focus:ring-0 rounded-lg p-1"
                  />
                </div>
              </div>
              <button disabled={!selectedPatientId || cart.length === 0} onClick={handleCheckout} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all">
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
