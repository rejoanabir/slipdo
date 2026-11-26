export type Currency = 'BDT' | 'USD' | 'EUR' | 'INR' | 'GBP';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank Card' | 'Bank Transfer' | 'Other';

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Void';

export type TemplateId = 'modern-emerald' | 'classic-formal' | 'clean-minimal' | 'thermal-pos' | 'bangla-first';

export interface Business {
  id: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  currency: Currency;
  currencySymbol: string;
  phone: string;
  email: string;
  address: string;
  binTin?: string; // BIN or TIN
  receiptPrefix: string;
  nextNumber: number;
  defaultTaxRate: number;
  defaultNotes: string;
  themeColor: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  receiptCount: number;
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage, e.g. 5 for 5%
  lineTotal: number;
}

export interface Receipt {
  id: string;
  businessId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  number: string; // e.g. RCP-2026-0001
  issueDate: string; // YYYY-MM-DD
  dueDate?: string;
  currency: Currency;
  currencySymbol: string;
  items: ReceiptItem[];
  subtotal: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountAmount: number;
  shippingFee: number;
  taxTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  amountDue: number;
  transactionId?: string;
  templateId: TemplateId;
  notes?: string;
  terms?: string;
  publicToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  receiptsThisMonth: number;
  maxMonthlyReceipts: number;
  smsThisMonth: number;
  maxMonthlySms: number;
  ocrThisMonth: number;
  maxMonthlyOcr: number;
}
