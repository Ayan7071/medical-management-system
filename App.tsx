
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Package, 
  Users, 
  ReceiptText, 
  TrendingUp, 
  Truck,
  Plus,
  Search,
  LogOut,
  Bell,
  Settings,
  WalletCards,
  Download,
  Upload,
  Save,
  ShieldCheck,
  Database,
  X as LucideX,
  Trash2
} from 'lucide-react';
import { Medicine, Patient, Transaction, Agency, ActiveTab, Credit, AgencyBill } from './types';
import Dashboard from './tabs/Dashboard';
import MedicineManagement from './tabs/MedicineManagement';
import StockView from './tabs/StockView';
import PatientManagement from './tabs/PatientManagement';
import Transactions from './tabs/Transactions';
import ProfitAnalytics from './tabs/ProfitAnalytics';
import AgencyManagement from './tabs/AgencyManagement';
import CreditManagement from './tabs/CreditManagement';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  const restoreInputRef = useRef<HTMLInputElement>(null);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('kranti_medicines');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('kranti_patients');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('kranti_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [agencies, setAgencies] = useState<Agency[]>(() => {
    const saved = localStorage.getItem('kranti_agencies');
    return saved ? JSON.parse(saved) : [];
  });

  const [credits, setCredits] = useState<Credit[]>(() => {
    const saved = localStorage.getItem('kranti_credits');
    return saved ? JSON.parse(saved) : [];
  });

  const [agencyBills, setAgencyBills] = useState<AgencyBill[]>(() => {
    const saved = localStorage.getItem('kranti_agency_bills');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('kranti_medicines', JSON.stringify(medicines));
    localStorage.setItem('kranti_patients', JSON.stringify(patients));
    localStorage.setItem('kranti_transactions', JSON.stringify(transactions));
    localStorage.setItem('kranti_agencies', JSON.stringify(agencies));
    localStorage.setItem('kranti_credits', JSON.stringify(credits));
    localStorage.setItem('kranti_agency_bills', JSON.stringify(agencyBills));
    setLastSaved(new Date().toLocaleTimeString());
  }, [medicines, patients, transactions, agencies, credits, agencyBills]);

  const handleBackup = () => {
    const data = {
      medicines,
      patients,
      transactions,
      agencies,
      credits,
      agencyBills,
      version: '1.3',
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kranti_medical_vault_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Restore will overwrite ALL current data. Are you sure you want to proceed?")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.medicines) setMedicines(data.medicines);
        if (data.patients) setPatients(data.patients);
        if (data.transactions) setTransactions(data.transactions);
        if (data.agencies) setAgencies(data.agencies);
        if (data.credits) setCredits(data.credits);
        if (data.agencyBills) setAgencyBills(data.agencyBills);
        alert('Vault restored successfully!');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleManualSave = () => {
    localStorage.setItem('kranti_medicines', JSON.stringify(medicines));
    localStorage.setItem('kranti_patients', JSON.stringify(patients));
    localStorage.setItem('kranti_transactions', JSON.stringify(transactions));
    localStorage.setItem('kranti_agencies', JSON.stringify(agencies));
    localStorage.setItem('kranti_credits', JSON.stringify(credits));
    localStorage.setItem('kranti_agency_bills', JSON.stringify(agencyBills));
    setLastSaved(new Date().toLocaleTimeString());
    alert('Database sync complete. Data is secure.');
  };

  const handleResetData = () => {
    if (!window.confirm("WARNING: This will permanently delete ALL data (Medicines, Patients, Sales, Agencies). This action cannot be undone. Are you sure?")) {
      return;
    }
    
    if (!window.confirm("Final check: Are you absolutely sure you want to wipe the database clean?")) {
      return;
    }

    // 1. Clear localStorage synchronously first
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('kranti_')) {
        localStorage.removeItem(key);
      }
    }
    
    // 2. Reload immediately to ensure a clean state
    window.location.reload();
  };

  const addMedicine = (med: Medicine) => setMedicines(prev => [...prev, med]);
  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };
  const deleteMedicine = (id: string) => {
    console.log("Attempting to delete medicine:", id, typeof id);
    setMedicines(prev => {
      const filtered = prev.filter(m => String(m.id) !== String(id));
      console.log(`Medicine Delete: Before=${prev.length}, After=${filtered.length}`);
      return filtered;
    });
  };

  const addPatient = (pat: Patient) => setPatients(prev => [...prev, pat]);
  const deletePatient = (id: string) => {
    console.log("Attempting to delete patient:", id, typeof id);
    setPatients(prev => {
      const filtered = prev.filter(p => String(p.id) !== String(id));
      console.log(`Patient Delete: Before=${prev.length}, After=${filtered.length}`);
      return filtered;
    });
  };

  const addTransaction = (txn: Transaction) => {
    setTransactions(prev => [txn, ...prev]);
    txn.medicines.forEach(item => {
      setMedicines(prev => prev.map(m => {
        if (m.id === item.medicineId) {
          return { ...m, stock: m.stock - item.quantity, sold: m.sold + item.quantity };
        }
        return m;
      }));
    });
    
    if (txn.isCredit && txn.creditAmount > 0) {
      const newCredit: Credit = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: txn.patientId,
        amount: txn.creditAmount,
        date: txn.date,
        status: 'pending'
      };
      setCredits(prev => [newCredit, ...prev]);
    }
  };

  const clearAllCredits = () => {
    console.log("Attempting to clear all credits...");
    if (window.confirm("Are you sure you want to delete ALL credit records (Pending & Paid)? This will completely empty the credit management system.")) {
      setCredits([]);
      console.log("All credits cleared.");
    }
  };

  const deleteTransaction = (id: string) => {
    console.log("Attempting to delete transaction:", id, typeof id);
    setTransactions(prev => {
      const filtered = prev.filter(t => String(t.id) !== String(id));
      console.log(`Transaction Delete: Before=${prev.length}, After=${filtered.length}`);
      return filtered;
    });
  };

  const addAgency = (agn: Agency) => setAgencies(prev => [...prev, agn]);
  const deleteAgency = (id: string) => {
    console.log("Attempting to delete agency:", id, typeof id);
    setAgencies(prev => {
      const filtered = prev.filter(a => String(a.id) !== String(id));
      console.log(`Agency Delete: Before=${prev.length}, After=${filtered.length}`);
      return filtered;
    });
    setAgencyBills(prev => prev.filter(b => String(b.agencyId) !== String(id)));
  };

  const updateCredit = (id: string, updates: Partial<Credit>) => {
    setCredits(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCredit = (id: string) => {
    if (window.confirm("Are you sure you want to delete this credit record?")) {
      setCredits(prev => prev.filter(c => c.id !== id));
    }
  };

  const clearPaidCredits = () => {
    console.log("Attempting to clear paid credits...");
    if (window.confirm("Are you sure you want to clear all paid credit records? This will reset the 'Total Collected' amount to zero.")) {
      setCredits(prev => {
        const filtered = prev.filter(c => c.status === 'pending');
        console.log(`Paid credits cleared. Before=${prev.length}, After=${filtered.length}`);
        return filtered;
      });
    }
  };

  const addAgencyBill = (bill: AgencyBill) => setAgencyBills(prev => [bill, ...prev]);
  const updateAgencyBill = (id: string, updates: Partial<AgencyBill>) => {
    setAgencyBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medicine', label: 'Medicines', icon: Pill },
    { id: 'stock', label: 'Inventory', icon: Package },
    { id: 'patient', label: 'Patients', icon: Users },
    { id: 'transaction', label: 'Sales', icon: ReceiptText },
    { id: 'credit', label: 'Credit (Udhari)', icon: WalletCards },
    { id: 'profit', label: 'Analytics', icon: TrendingUp },
    { id: 'agency', label: 'Agencies', icon: Truck },
  ] as const;

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 
        transition-transform duration-300 ease-in-out no-print flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Pill size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Kranti Medical</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <LucideX size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`sidebar-link ${activeTab === item.id ? 'sidebar-link-active' : ''}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="mx-4 mb-4 p-4 bg-slate-900 rounded-3xl space-y-3 shadow-xl shadow-slate-200">
          <div className="flex items-center gap-2 mb-1 px-1">
            <Database size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Vault</span>
          </div>
          
          <div className="space-y-1">
            <button onClick={handleManualSave} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 rounded-xl transition-colors">
              <Save size={14} className="text-blue-400" /> Secure Sync
            </button>
            <button onClick={handleBackup} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 rounded-xl transition-colors">
              <Download size={14} className="text-emerald-400" /> Backup Vault
            </button>
            <button onClick={() => restoreInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 rounded-xl transition-colors">
              <Upload size={14} className="text-amber-400" /> Restore Vault
            </button>
            <button onClick={handleResetData} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
              <Trash2 size={14} className="text-rose-400" /> Reset All Data
            </button>
          </div>
          
          <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" />
          
          <div className="mt-2 pt-3 border-t border-slate-800 px-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[9px] text-slate-500 font-bold uppercase">Auto-Save On</span>
              </div>
              <span className="text-[9px] text-slate-500 font-bold">{lastSaved}</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="bg-white h-16 border-b border-slate-200 px-4 md:px-8 flex items-center justify-between no-print sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 md:hidden hover:bg-slate-100 rounded-lg"
            >
              <LayoutDashboard size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l pl-6 border-slate-200">
              <button className="text-slate-400 hover:text-slate-600 relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">AD</div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
            <Dashboard medicines={medicines} transactions={transactions} patients={patients} />
          </div>
          <div className={activeTab === 'medicine' ? 'block' : 'hidden'}>
            <MedicineManagement isActive={activeTab === 'medicine'} medicines={medicines} agencies={agencies} onAdd={addMedicine} onUpdate={updateMedicine} onDelete={deleteMedicine} />
          </div>
          <div className={activeTab === 'stock' ? 'block' : 'hidden'}>
            <StockView isActive={activeTab === 'stock'} medicines={medicines} patients={patients} onUpdate={updateMedicine} onDelete={deleteMedicine} onAddTransaction={addTransaction} />
          </div>
          <div className={activeTab === 'patient' ? 'block' : 'hidden'}>
            <PatientManagement isActive={activeTab === 'patient'} patients={patients} medicines={medicines} credits={credits} transactions={transactions} onAddPatient={addPatient} onDeletePatient={deletePatient} onAddTransaction={addTransaction} />
          </div>
          <div className={activeTab === 'transaction' ? 'block' : 'hidden'}>
            <Transactions isActive={activeTab === 'transaction'} transactions={transactions} patients={patients} medicines={medicines} onDeleteTransaction={deleteTransaction} />
          </div>
          <div className={activeTab === 'profit' ? 'block' : 'hidden'}>
            <ProfitAnalytics isActive={activeTab === 'profit'} transactions={transactions} />
          </div>
          <div className={activeTab === 'agency' ? 'block' : 'hidden'}>
            <AgencyManagement isActive={activeTab === 'agency'} agencies={agencies} medicines={medicines} agencyBills={agencyBills} onAddAgency={addAgency} onDeleteAgency={deleteAgency} onBatchAddMedicines={(meds) => setMedicines(prev => [...prev, ...meds])} onAddAgencyBill={addAgencyBill} onUpdateAgencyBill={updateAgencyBill} />
          </div>
          <div className={activeTab === 'credit' ? 'block' : 'hidden'}>
            <CreditManagement isActive={activeTab === 'credit'} credits={credits} patients={patients} onUpdateCredit={updateCredit} onClearPaid={clearPaidCredits} onDeleteCredit={deleteCredit} onClearAll={clearAllCredits} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
