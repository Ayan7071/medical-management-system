
import React, { useState, useMemo } from 'react';
import { Patient, Medicine, Transaction } from '../types';
import { Search, ShoppingCart, Trash2, Users, IndianRupee, Minus, Plus } from 'lucide-react';

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

  const filteredMedicines = useMemo(() => 
    medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()))
  , [medicines, medSearch]);

  const cartTotal = useMemo(() => 
    cart.reduce((acc, item) => {
      const med = medicines.find(m => m.id === item.medicineId);
      return acc + (med ? med.mrp * item.quantity : 0);
    }, 0)
  , [cart, medicines]);

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

    onAddTransaction({
      id: Math.random().toString(36).substr(2, 9),
      patientId: selectedPatientId,
      medicines: saleMeds,
      totalAmount,
      paidAmount: totalAmount,
      creditAmount: 0,
      totalCost,
      profit: totalAmount - totalCost,
      date: new Date().toISOString()
    });
    setCart([]);
    setSelectedPatientId('');
    setActiveView('list');
    alert('Sale completed!');
  };

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
              {patients.filter(p => p.name.toLowerCase().includes(searchPatient.toLowerCase())).map(p => (
                <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Users size={24} /></div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{p.name}</p>
                      <p className="text-sm text-slate-500">{p.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPatientId(p.id); setActiveView('new-sale'); }} className="text-blue-600 font-bold px-6 py-2 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all">Select</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border shadow-sm h-fit">
            <h3 className="text-xl font-bold mb-6">Quick Register</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAddPatient({ id: Math.random().toString(36).substr(2, 9), ...newPatientData, createdAt: new Date().toISOString() }); setNewPatientData({name: '', phone: ''}); }} className="space-y-4">
              <input required placeholder="Patient Name" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" />
              <input required placeholder="Phone Number" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl" />
              <button type="submit" className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-xl">Add Patient</button>
            </form>
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
              <div className="flex items-center justify-between text-2xl font-black text-slate-800 px-2">
                <span>Payable:</span>
                <span className="text-emerald-600">₹{cartTotal.toLocaleString()}</span>
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
