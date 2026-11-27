import { Business, Customer, Receipt, LogoLockup, FigmaChecklistItem, ReceiptTotals } from './types';
import { INITIAL_BUSINESSES, INITIAL_CUSTOMERS, INITIAL_RECEIPTS, FIGMA_CHECKLIST_ITEMS } from './mockData';

const KEYS = {
  ACTIVE_BIZ: 'slipdo_active_biz_v3',
  BUSINESSES: 'slipdo_businesses_v3',
  CUSTOMERS: 'slipdo_customers_v3',
  RECEIPTS: 'slipdo_receipts_v3',
  CHECKLIST: 'slipdo_checklist_v3',
  LOGO_LOCKUP: 'slipdo_logo_lockup_v3',
  LANG: 'slipdo_language',
  AUTH_USER: 'slipdo_auth_user_v3',
  AUTH_TOKEN: 'slipdo_auth_token_v3',
};

export class StorageService {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  static getBusinesses(): Business[] {
    if (!this.isClient()) return INITIAL_BUSINESSES;
    try {
      const data = localStorage.getItem(KEYS.BUSINESSES);
      if (!data) {
        localStorage.setItem(KEYS.BUSINESSES, JSON.stringify(INITIAL_BUSINESSES));
        return INITIAL_BUSINESSES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BUSINESSES;
    }
  }

  static getActiveBusiness(): Business {
    const list = this.getBusinesses();
    if (!this.isClient()) return list[0];
    try {
      const activeId = localStorage.getItem(KEYS.ACTIVE_BIZ);
      const found = list.find((b) => b.id === activeId);
      return found || list[0];
    } catch {
      return list[0];
    }
  }

  static setActiveBusiness(bizId: string): void {
    if (!this.isClient()) return;
    localStorage.setItem(KEYS.ACTIVE_BIZ, bizId);
  }

  static saveBusiness(business: Business): void {
    const list = this.getBusinesses();
    const idx = list.findIndex((b) => b.id === business.id);
    if (idx >= 0) {
      list[idx] = business;
    } else {
      list.push(business);
    }
    if (this.isClient()) {
      localStorage.setItem(KEYS.BUSINESSES, JSON.stringify(list));
    }
  }

  static getCustomers(): Customer[] {
    if (!this.isClient()) return INITIAL_CUSTOMERS;
    try {
      const data = localStorage.getItem(KEYS.CUSTOMERS);
      if (!data) {
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
        return INITIAL_CUSTOMERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  static saveCustomer(cust: Customer): Customer[] {
    const list = this.getCustomers();
    const idx = list.findIndex((c) => c.id === cust.id);
    if (idx >= 0) {
      list[idx] = cust;
    } else {
      list.unshift(cust);
    }
    if (this.isClient()) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(list));
    }
    return list;
  }

  static getReceipts(): Receipt[] {
    if (!this.isClient()) return INITIAL_RECEIPTS;
    try {
      const data = localStorage.getItem(KEYS.RECEIPTS);
      if (!data) {
        localStorage.setItem(KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
        return INITIAL_RECEIPTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_RECEIPTS;
    }
  }

  static getReceiptByToken(token: string): Receipt | undefined {
    const list = this.getReceipts();
    return list.find((r) => r.token === token);
  }

  static saveReceipt(receipt: Receipt): Receipt {
    const list = this.getReceipts();
    const idx = list.findIndex((r) => r.id === receipt.id);
    if (idx >= 0) {
      list[idx] = receipt;
    } else {
      list.unshift(receipt);
    }

    if (this.isClient()) {
      localStorage.setItem(KEYS.RECEIPTS, JSON.stringify(list));
    }

    // Link customer stats
    if (receipt.customerName) {
      const customers = this.getCustomers();
      const existing = customers.find(
        (c) =>
          (receipt.customerPhone && c.phone === receipt.customerPhone) ||
          c.name.toLowerCase() === receipt.customerName.toLowerCase()
      );
      if (existing) {
        existing.totalSpent += receipt.total;
        existing.receipts += 1;
        existing.lastVisit = 'Just now';
        this.saveCustomer(existing);
      } else {
        this.saveCustomer({
          id: 'cust_' + Date.now(),
          name: receipt.customerName,
          phone: receipt.customerPhone,
          email: `${receipt.customerName.toLowerCase().replace(/\s+/g, '.')}@client.bd`,
          totalSpent: receipt.total,
          receipts: 1,
          lastVisit: 'Just now',
        });
      }
    }

    return receipt;
  }

  static deleteReceipt(id: string): Receipt[] {
    const list = this.getReceipts().filter((r) => r.id !== id && r.receiptNo !== id);
    if (this.isClient()) {
      localStorage.setItem(KEYS.RECEIPTS, JSON.stringify(list));
    }
    return list;
  }

  static updateReceiptStatus(id: string, status: 'Paid' | 'Due' | 'Void'): Receipt | null {
    const list = this.getReceipts();
    const target = list.find((r) => r.id === id || r.receiptNo === id);
    if (target) {
      target.status = status;
      if (this.isClient()) {
        localStorage.setItem(KEYS.RECEIPTS, JSON.stringify(list));
      }
      return target;
    }
    return null;
  }

  static getLogoLockup(): LogoLockup {
    if (!this.isClient()) return 'voucher-check';
    try {
      return (localStorage.getItem(KEYS.LOGO_LOCKUP) as LogoLockup) || 'voucher-check';
    } catch {
      return 'voucher-check';
    }
  }

  static setLogoLockup(lockup: LogoLockup): void {
    if (!this.isClient()) return;
    localStorage.setItem(KEYS.LOGO_LOCKUP, lockup);
  }

  static getChecklist(): FigmaChecklistItem[] {
    if (!this.isClient()) return FIGMA_CHECKLIST_ITEMS;
    try {
      const data = localStorage.getItem(KEYS.CHECKLIST);
      if (!data) {
        localStorage.setItem(KEYS.CHECKLIST, JSON.stringify(FIGMA_CHECKLIST_ITEMS));
        return FIGMA_CHECKLIST_ITEMS;
      }
      return JSON.parse(data);
    } catch {
      return FIGMA_CHECKLIST_ITEMS;
    }
  }

  static toggleChecklistItem(id: string): FigmaChecklistItem[] {
    const list = this.getChecklist();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.done = !item.done;
      if (this.isClient()) {
        localStorage.setItem(KEYS.CHECKLIST, JSON.stringify(list));
      }
    }
    return list;
  }

  // --- Auth & Session State ---
  static getAuthUser(): { id: string; email: string; name: string; phone?: string; role: string } | null {
    if (!this.isClient()) return null;
    try {
      const data = localStorage.getItem(KEYS.AUTH_USER);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setAuthUser(user: { id: string; email: string; name: string; phone?: string; role: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
  }

  static clearAuthSession(): void {
    if (!this.isClient()) return;
    localStorage.removeItem(KEYS.AUTH_USER);
    localStorage.removeItem(KEYS.AUTH_TOKEN);
    localStorage.removeItem('slipdo_supabase_session');
  }

  static mergeCloudData(cloudReceipts: Receipt[] = [], cloudBusinesses: Business[] = []): { receipts: Receipt[]; businesses: Business[] } {
    if (!this.isClient()) return { receipts: [], businesses: [] };
    
    let finalBusinesses = this.getBusinesses();
    if (cloudBusinesses && cloudBusinesses.length > 0) {
      const map = new Map<string, Business>();
      finalBusinesses.forEach((b) => map.set(b.id, b));
      cloudBusinesses.forEach((b) => map.set(b.id, b));
      finalBusinesses = Array.from(map.values());
      localStorage.setItem(KEYS.BUSINESSES, JSON.stringify(finalBusinesses));
      const currentActive = localStorage.getItem(KEYS.ACTIVE_BIZ);
      if (!currentActive || !finalBusinesses.find((b) => b.id === currentActive)) {
        localStorage.setItem(KEYS.ACTIVE_BIZ, finalBusinesses[0].id);
      }
    }

    let finalReceipts = this.getReceipts();
    if (cloudReceipts && cloudReceipts.length > 0) {
      const map = new Map<string, Receipt>();
      finalReceipts.forEach((r) => map.set(r.token || r.id, r));
      cloudReceipts.forEach((r) => map.set(r.token || r.id, r));
      finalReceipts = Array.from(map.values());
      localStorage.setItem(KEYS.RECEIPTS, JSON.stringify(finalReceipts));
    }

    return { receipts: finalReceipts, businesses: finalBusinesses };
  }
}
