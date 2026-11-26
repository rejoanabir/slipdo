export type Currency = 'BDT' | 'USD' | 'EUR' | 'INR';

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Cash' | 'Bank' | 'Bank Card';

export type PaymentStatus = 'Paid' | 'Due' | 'Void';

export type TemplateId =
  | 'modern-emerald'
  | 'bangla-memo'
  | 'classic-formal'
  | 'clean-minimalist'
  | 'thermal-pos';

export type LogoLockup = 'voucher-check' | 'monogram-s';

export interface Business {
  id: string;
  name: string;
  nameBn?: string;
  category: string;
  categoryBn?: string;
  address: string;
  phone: string;
  bin: string;
  logoUrl?: string;
  currency: Currency;
  currencySymbol: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  receipts: number;
  lastVisit: string;
}

export interface ReceiptItem {
  id?: number | string;
  desc: string;
  descBn?: string;
  qty: number;
  price: number;
}

export interface ReceiptTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface Receipt {
  id: string;
  receiptNo?: string;
  token: string;
  date: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  template: TemplateId;
  taxRate: number;
  enableTax?: boolean;
  discount: number;
  enableDiscount?: boolean;
  items: ReceiptItem[];
  total: number;
  totals?: ReceiptTotals;
  notes?: string;
  notesBn?: string;
}

export interface FigmaChecklistItem {
  id: string;
  group: string;
  tag: string;
  label: string;
  done: boolean;
}
