
import React, { useState } from 'react';
import { Transaction, Patient, Medicine } from '../types';
import { Printer, Download, Search, ChevronRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  patients: Patient[];
  medicines: Medicine[];
}

const Transactions: React.FC<Props> = ({ transactions, patients, medicines }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTxns = transactions.filter(t => {
    const patient = patients.find(p => p.id === t.patientId);
    return patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           patient?.phone.includes(searchTerm) ||
           t.id.includes(searchTerm);
  });

  const exportCSV = () => {
    const headers = ['TXN ID', 'Patient', 'Date', 'Amount', 'Profit'];
    const rows = filteredTxns.map(t => {
      const p = patients.find(pat => pat.id === t.patientId);
      return [t.id, p?.name || 'N/A', new Date(t.date).toLocaleDateString(), t.totalAmount, t.profit];
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales Transactions</h2>
          <p className="text-slate-500">Track and review every medicine sale</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
          >
            <Download size={20} />
            Export CSV
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter transactions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Net Profit</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.map(t => {
                const p = patients.find(pat => pat.id === t.patientId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{t.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{p?.name || 'Deleted Patient'}</p>
                      <p className="text-xs text-slate-500">{p?.phone || 'No contact'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{new Date(t.date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-800">₹{t.totalAmount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">₹{t.profit.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
