
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
  Database
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

  const addMedicine = (med: Medicine) => setMedicines(prev => [...prev, med]);
  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };
  const deleteMedicine = (id: string) => setMedicines(prev => prev.filter(m => m.id !== id));

  const addPatient = (pat: Patient) => setPatients(prev => [...prev, pat]);
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

  const addAgency = (agn: Agency) => setAgencies(prev => [...prev, agn]);
  const deleteAgency = (id: string) => {
    setAgencies(prev => prev.filter(a => a.id !== id));
    setAgencyBills(prev => prev.filter(b => b.agencyId !== id));
  };

  const updateCredit = (id: string, updates: Partial<Credit>) => {
    setCredits(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addAgencyBill = (bill: AgencyBill) => setAgencyBills(prev => [bill, ...prev]);
  const updateAgencyBill = (id: string, updates: Partial<AgencyBill>) => {
    setAgencyBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard medicines={medicines} transactions={transactions} patients={patients} />;
      case 'medicine': return <MedicineManagement medicines={medicines} agencies={agencies} onAdd={addMedicine} onUpdate={updateMedicine} onDelete={deleteMedicine} />;
      case 'stock': return <StockView medicines={medicines} patients={patients} onUpdate={updateMedicine} onAddTransaction={addTransaction} />;
      case 'patient': return <PatientManagement patients={patients} medicines={medicines} onAddPatient={addPatient} onAddTransaction={addTransaction} />;
      case 'transaction': return <Transactions transactions={transactions} patients={patients} medicines={medicines} />;
      case 'profit': return <ProfitAnalytics transactions={transactions} />;
      case 'agency': return <AgencyManagement agencies={agencies} medicines={medicines} agencyBills={agencyBills} onAddAgency={addAgency} onDeleteAgency={deleteAgency} onBatchAddMedicines={(meds) => setMedicines(prev => [...prev, ...meds])} onAddAgencyBill={addAgencyBill} onUpdateAgencyBill={updateAgencyBill} />;
      case 'credit': return <CreditManagement credits={credits} patients={patients} onUpdateCredit={updateCredit} />;
      default: return <Dashboard medicines={medicines} transactions={transactions} patients={patients} />;
    }
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
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen no-print">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Pill size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">Kranti Medical</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 px-8 flex items-center justify-between no-print sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h1>
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
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
