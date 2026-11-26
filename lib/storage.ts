import { Business, Customer, Receipt } from './types';
import { DEFAULT_BUSINESS, INITIAL_CUSTOMERS, INITIAL_RECEIPTS } from './mockData';

const STORAGE_KEYS = {
  BUSINESS: 'pr_business_profile',
  CUSTOMERS: 'pr_customers_list',
  RECEIPTS: 'pr_receipts_list',
  LANG: 'pr_selected_language',
};

export class StorageService {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  static getBusiness(): Business {
    if (!this.isClient()) return DEFAULT_BUSINESS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUSINESS);
      return data ? JSON.parse(data) : DEFAULT_BUSINESS;
    } catch {
      return DEFAULT_BUSINESS;
    }
  }

  static saveBusiness(business: Business): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(business));
  }

  static getCustomers(): Customer[] {
    if (!this.isClient()) return INITIAL_CUSTOMERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
        return INITIAL_CUSTOMERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  static saveCustomer(customer: Customer): Customer[] {
    const list = this.getCustomers();
    const existingIndex = list.findIndex((c) => c.id === customer.id);
    if (existingIndex >= 0) {
      list[existingIndex] = customer;
    } else {
      list.unshift(customer);
    }
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
    }
    return list;
  }

  static getReceipts(): Receipt[] {
    if (!this.isClient()) return INITIAL_RECEIPTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
        return INITIAL_RECEIPTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_RECEIPTS;
    }
  }

  static getReceiptByToken(token: string): Receipt | undefined {
    const receipts = this.getReceipts();
    return receipts.find((r) => r.publicToken === token);
  }

  static getReceiptById(id: string): Receipt | undefined {
    const receipts = this.getReceipts();
    return receipts.find((r) => r.id === id);
  }

  static saveReceipt(receipt: Receipt): Receipt {
    const receipts = this.getReceipts();
    const index = receipts.findIndex((r) => r.id === receipt.id);
    
    if (index >= 0) {
      receipts[index] = { ...receipt, updatedAt: new Date().toISOString() };
    } else {
      receipts.unshift({
        ...receipt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Increment business next number
      const biz = this.getBusiness();
      this.saveBusiness({
        ...biz,
        nextNumber: (biz.nextNumber || 1) + 1,
      });

      // Update or link customer stats
      if (receipt.customerName) {
        const customers = this.getCustomers();
        const existingCust = customers.find(
          (c) =>
            (receipt.customerPhone && c.phone === receipt.customerPhone) ||
            c.name.toLowerCase() === receipt.customerName.toLowerCase()
        );

        if (existingCust) {
          existingCust.totalSpent += receipt.total;
          existingCust.receiptCount += 1;
          this.saveCustomer(existingCust);
        } else {
          this.saveCustomer({
            id: 'cust-' + Date.now(),
            businessId: biz.id,
            name: receipt.customerName,
            phone: receipt.customerPhone || '',
            email: receipt.customerEmail || '',
            address: receipt.customerAddress || '',
            totalSpent: receipt.total,
            receiptCount: 1,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    }
    return receipt;
  }

  static voidReceipt(receiptId: string): Receipt[] {
    const receipts = this.getReceipts();
    const target = receipts.find((r) => r.id === receiptId);
    if (target) {
      target.paymentStatus = 'Void';
      target.updatedAt = new Date().toISOString();
      if (this.isClient()) {
        localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
      }
    }
    return receipts;
  }

  static deleteReceipt(receiptId: string): Receipt[] {
    const receipts = this.getReceipts().filter((r) => r.id !== receiptId);
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    }
    return receipts;
  }
}
