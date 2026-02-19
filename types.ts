
export interface Medicine {
  id: string;
  name: string;
  category: string; // Added to fix property missing error in Dashboard.tsx
  costPrice: number; // Cost price per single unit
  mrp: number; // MRP per single unit
  stock: number; // Total individual units (tablets/bottles) available
  sold: number; // Total individual units sold
  expiryDate: string; // MM/YYYY
  agencyId?: string;
  unitsPerPackage?: number; // Added for package tracking consistency
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
    quantity: number; // Number of units
    price: number; // Total price for this line item
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

export interface AgencyBill {
  id: string;
  agencyId: string;
  billNumber: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  notes?: string;
}

export interface BillItem {
  name: string;
  quantity: number; // Number of packages (strips/boxes)
  unitsPerPackage: number; // Added to fix property missing error in AgencyManagement.tsx
  costPrice: number;
  mrp: number;
  category: string; // Added to fix property missing error in AgencyManagement.tsx
  expiryDate: string;
}

export type ProfitFilter = 'today' | 'yesterday' | 'month' | 'custom';
export type ActiveTab = 'dashboard' | 'medicine' | 'stock' | 'patient' | 'transaction' | 'profit' | 'agency' | 'credit';
