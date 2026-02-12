
import React, { useState, useMemo } from 'react';
import { Credit, Patient } from '../types';
import { Search, WalletCards, MessageCircle, CheckCircle2, Phone, Calendar, IndianRupee } from 'lucide-react';

interface Props {
  credits: Credit[];
  patients: Patient[];
  onUpdateCredit: (id: string, updates: Partial<Credit>) => void;
}

const CreditManagement: React.FC<Props> = ({ credits, patients, onUpdateCredit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('pending');

  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      const patient = patients.find(p => p.id === c.patientId);
      const matchesSearch = patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           patient?.phone.includes(searchTerm);
      const matchesStatus = filter === 'all' || c.status === filter;
      return matchesSearch && matchesStatus;
    });
  }, [credits, patients, searchTerm, filter]);

  const sendReminder = (credit: Credit) => {
    const patient = patients.find(p => p.id === credit.patientId);
    if (!patient) return;
    
    const message = `Hello ${patient.name}, this is a reminder from MedAI Pharmacy regarding a pending payment of ₹${credit.amount} from your visit on ${new Date(credit.date).toLocaleDateString()}. Please settle this at your earliest convenience. Thank you!`;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${encodedMsg}`, '_blank');
  };

  const totals = useMemo(() => {
    return credits.reduce((acc, curr) => {
      if (curr.status === 'pending') acc.pending += curr.amount;
      else acc.collected += curr.amount;
      return acc;
    }, { pending: 0, collected: 0 });
  }, [credits]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Credit (Udhari) Ledger</h2>
          <p className="text-slate-500">Track pending payments and send reminders</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${filter === 'all' ? 'bg-slate-600 text-white' : 'text-slate-500'}`}>All</button>
            <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Pending</button>
            <button onClick={() => setFilter('paid')} className={`px-4 py-1.5 text-xs font-bold rounded-lg ${filter === 'paid' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Paid</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              placeholder="Search by name/phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Total Outstanding</p>
            <h3 className="text-3xl font-black text-amber-800 flex items-center gap-1"><IndianRupee size={24} /> {totals.pending.toLocaleString()}</h3>
          </div>
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600"><WalletCards size={32} /></div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Total Collected</p>
            <h3 className="text-3xl font-black text-emerald-800 flex items-center gap-1"><IndianRupee size={24} /> {totals.collected.toLocaleString()}</h3>
          </div>
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600"><CheckCircle2 size={32} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCredits.map(c => {
                const patient = patients.find(p => p.id === c.patientId);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{patient?.name || 'Unknown Patient'}</p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Phone size={10} /> {patient?.phone}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">₹{c.amount}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar size={12} /> {new Date(c.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${c.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => sendReminder(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100">
                              <MessageCircle size={14} /> WhatsApp
                            </button>
                            <button onClick={() => onUpdateCredit(c.id, { status: 'paid' })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                              Mark Paid
                            </button>
                          </>
                        )}
                        {c.status === 'paid' && <span className="text-emerald-500 font-bold text-xs flex items-center gap-1"><CheckCircle2 size={14} /> Settlement Complete</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCredits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No records found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditManagement;
