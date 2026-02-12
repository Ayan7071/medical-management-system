
import React, { useState } from 'react';
import { Medicine } from '../types';
// Fixed: Added Plus to the import list
import { Search, Filter, ArrowUpRight, ArrowDownRight, Printer, Share2, Plus } from 'lucide-react';

interface Props {
  medicines: Medicine[];
  onUpdate: (id: string, updates: Partial<Medicine>) => void;
}

const StockView: React.FC<Props> = ({ medicines, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Status</h2>
          <p className="text-slate-500">Detailed overview of your current stock and sales</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <Printer size={20} />
            Print Report
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter stock..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">In Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Sold</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Available</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Availability Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map(med => {
                const isOutOfStock = med.stock <= 0;
                return (
                  <tr key={med.id} className={`${isOutOfStock ? 'bg-red-50' : 'hover:bg-slate-50/50'} transition-colors`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{med.name}</p>
                      <p className="text-xs text-slate-500">MRP: ₹{med.mrp}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-700">{med.stock + med.sold}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-blue-600">{med.sold}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${isOutOfStock ? 'text-red-600' : 'text-emerald-600'}`}>{med.stock}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Out of Stock</span>
                      ) : med.stock < 10 ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Low Stock</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onUpdate(med.id, { stock: med.stock + 1 })}
                          className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={() => med.stock > 0 && onUpdate(med.id, { stock: med.stock - 1 })}
                          className="p-1.5 text-slate-400 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Filter size={16} className="rotate-180" />
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
    </div>
  );
};

export default StockView;
