
export interface Medicine {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  mrp: number;
  stock: number;
  sold: number;
  expiryDate: string;
  agencyId?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  patientId: string;
  medicines: {
    medicineId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  creditAmount: number;
  totalCost: number;
  profit: number;
  date: string;
  isCredit?: boolean;
}

export interface Credit {
  id: string;
  patientId: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
  notes?: string;
}

export interface Agency {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface BillItem {
  name: string;
  quantity: number;
  costPrice: number;
  mrp: number;
  category: string;
  expiryDate: string;
}

export type ProfitFilter = 'today' | 'yesterday' | 'month' | 'custom';
export type ActiveTab = 'dashboard' | 'medicine' | 'stock' | 'patient' | 'transaction' | 'profit' | 'agency' | 'credit';
