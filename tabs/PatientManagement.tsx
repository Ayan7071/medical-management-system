
import React, { useState, useMemo } from 'react';
import { Patient, Medicine, Transaction } from '../types';
import { Search, UserPlus, ShoppingCart, Trash2, PlusCircle, CheckCircle, Users, WalletCards, IndianRupee } from 'lucide-react';

interface Props {
  patients: Patient[];
  medicines: Medicine[];
  onAddPatient: (p: Patient) => void;
  onAddTransaction: (t: Transaction) => void;
}

const PatientManagement: React.FC<Props> = ({ patients, medicines, onAddPatient, onAddTransaction }) => {
  const [activeView, setActiveView] = useState<'list' | 'new-sale'>('list');
  const [searchPatient, setSearchPatient] = useState('');
  const [medSearch, setMedSearch] = useState('');
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cart, setCart] = useState<{medicineId: string, quantity: number}[]>([]);
  const [newPatientData, setNewPatientData] = useState({ name: '', phone: '' });
  const [isCredit, setIsCredit] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.phone.includes(searchPatient)
  );

  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => 
      m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(medSearch.toLowerCase())
    );
  }, [medicines, medSearch]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, i) => acc + (medicines.find(m => m.id === i.medicineId)?.mrp || 0) * i.quantity, 0);
  }, [cart, medicines]);

  const creditBalance = useMemo(() => {
    if (!isCredit) return 0;
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, cartTotal - paid);
  }, [isCredit, cartTotal, amountPaid]);

  const addToCart = (medId: string) => {
    const medicine = medicines.find(m => m.id === medId);
    if (!medicine || medicine.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === medId);
      if (existing) {
        if (existing.quantity >= medicine.stock) return prev;
        return prev.map(item => item.medicineId === medId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { medicineId: medId, quantity: 1 }];
    });
  };

  const handleCheckout = () => {
    if (!selectedPatientId || cart.length === 0) return;

    let totalAmount = cartTotal;
    let totalCost = 0;
    const saleMedicines = cart.map(item => {
      const med = medicines.find(m => m.id === item.medicineId)!;
      totalCost += med.costPrice * item.quantity;
      return { medicineId: item.medicineId, quantity: item.quantity, price: med.mrp };
    });

    const paid = isCredit ? (parseFloat(amountPaid) || 0) : totalAmount;
    const credit = isCredit ? (totalAmount - paid) : 0;

    const txn: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: selectedPatientId,
      medicines: saleMedicines,
      totalAmount,
      paidAmount: paid,
      creditAmount: credit,
      totalCost,
      profit: totalAmount - totalCost,
      date: new Date().toISOString(),
      isCredit
    };

    onAddTransaction(txn);
    setCart([]);
    setSelectedPatientId('');
    setIsCredit(false);
    setAmountPaid('');
    setActiveView('list');
    alert('Sale completed successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patients & Sales</h2>
          <p className="text-slate-500">Fast lookup and secure transactions</p>
        </div>
        <button 
          onClick={() => setActiveView(activeView === 'list' ? 'new-sale' : 'list')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
            activeView === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {activeView === 'list' ? 'New Sale' : 'Back to Patients'}
        </button>
      </div>

      {activeView === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Search patient by name or phone..."
                value={searchPatient}
                onChange={e => setSearchPatient(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-white rounded-2xl border divide-y overflow-hidden shadow-sm">
              {filteredPatients.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><Users size={20} /></div>
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-sm text-slate-500">{p.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPatientId(p.id); setActiveView('new-sale'); }} className="text-blue-600 font-bold text-sm px-4 py-2 hover:bg-blue-50 rounded-lg">Select</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border h-fit shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><UserPlus size={20} /> Register Patient</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAddPatient({ id: Math.random().toString(36).substr(2, 9), ...newPatientData, createdAt: new Date().toISOString() }); setNewPatientData({name: '', phone: ''}); }} className="space-y-4">
              <input required placeholder="Full Name" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
              <input required placeholder="Phone Number" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
              <button type="submit" className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900">Add Patient</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Search medicines..."
                value={medSearch}
                onChange={e => setMedSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMedicines.map(med => (
                <button
                  key={med.id}
                  disabled={med.stock <= 0}
                  onClick={() => addToCart(med.id)}
                  className={`p-4 border rounded-2xl text-left transition-all ${
                    med.stock <= 0 ? 'bg-slate-50 opacity-60' : 'bg-white hover:border-blue-500 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{med.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">₹{med.mrp}</p>
                      <p className={`text-[10px] font-bold ${med.stock < 10 ? 'text-rose-500' : 'text-slate-400'}`}>Stock: {med.stock}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-6 space-y-6 shadow-xl sticky top-24 h-fit">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingCart size={20} className="text-blue-600" /> Cart</h3>
              <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-bold text-sm">
                <option value="">-- Choose Patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
              </select>
              <div className="divide-y max-h-60 overflow-y-auto">
                {cart.map(item => {
                  const med = medicines.find(m => m.id === item.medicineId)!;
                  return (
                    <div key={item.medicineId} className="py-3 flex justify-between group">
                      <div><p className="text-sm font-bold text-slate-800">{med.name}</p><p className="text-xs text-slate-500">{item.quantity} x ₹{med.mrp}</p></div>
                      <div className="flex items-center gap-3"><p className="font-bold text-slate-800">₹{med.mrp * item.quantity}</p><button onClick={() => setCart(c => c.filter(i => i.medicineId !== med.id))} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCredit(!isCredit)}>
                  <div className="flex items-center gap-2">
                    <WalletCards size={18} className={isCredit ? 'text-amber-600' : 'text-slate-400'} />
                    <span className="text-sm font-bold text-slate-700">Add to Credit (Udhari)</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${isCredit ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isCredit ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
                
                {isCredit && (
                  <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Amount Paid Now (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="number"
                        placeholder="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-500">Remaining to Credit:</span>
                      <span className="text-amber-600">₹{creditBalance.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                  <span>Grand Total</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold px-2 text-slate-800">
                  <span>Payable</span>
                  <span>₹{isCredit ? (parseFloat(amountPaid) || 0).toLocaleString() : cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <button 
                disabled={!selectedPatientId || cart.length === 0} 
                onClick={handleCheckout} 
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                {isCredit ? 'Complete Credit Sale' : 'Complete Full Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
