import { Business, Customer, Receipt, LogoLockup, FigmaChecklistItem } from './types';
import { INITIAL_BUSINESSES, FIGMA_CHECKLIST_ITEMS } from './mockData';

export class StorageService {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // Current User ID resolver (guarantees zero cross-account contamination)
  static getCurrentUserId(): string {
    if (!this.isClient()) return 'guest';
    try {
      const sessionStr = localStorage.getItem('slipdo_supabase_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed?.user?.id) return parsed.user.id;
      }
      const authUser = localStorage.getItem('slipdo_auth_user_v3');
      if (authUser) {
        const parsed = JSON.parse(authUser);
        if (parsed?.id) return parsed.id;
      }
    } catch {}
    return 'guest';
  }

  // Generates user-scoped storage key
  private static getUserKey(baseKey: string): string {
    const uid = this.getCurrentUserId();
    return `slipdo_${uid}_${baseKey}`;
  }

  // --- Businesses ---
  static getBusinesses(): Business[] {
    if (!this.isClient()) return INITIAL_BUSINESSES;
    const uid = this.getCurrentUserId();
    try {
      const data = localStorage.getItem(this.getUserKey('businesses'));
      if (!data) {
        if (uid === 'guest') {
          return INITIAL_BUSINESSES;
        }
        return [];
      }
      return JSON.parse(data);
    } catch {
      return uid === 'guest' ? INITIAL_BUSINESSES : [];
    }
  }

  static getActiveBusiness(): Business {
    const list = this.getBusinesses();
    if (!this.isClient()) return list[0] || INITIAL_BUSINESSES[0];
    try {
      const activeId = localStorage.getItem(this.getUserKey('active_biz'));
      const found = list.find((b) => b.id === activeId);
      return found || list[0] || {
        id: 'biz_' + this.getCurrentUserId().slice(0, 8),
        name: 'My Store',
        category: 'General Retail & Services',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1700-000000',
        bin: '000000000-0101',
        currency: 'BDT',
        currencySymbol: '৳',
      };
    } catch {
      return list[0] || INITIAL_BUSINESSES[0];
    }
  }

  static setActiveBusiness(bizId: string): void {
    if (!this.isClient()) return;
    localStorage.setItem(this.getUserKey('active_biz'), bizId);
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
      localStorage.setItem(this.getUserKey('businesses'), JSON.stringify(list));
      localStorage.setItem(this.getUserKey('active_biz'), business.id);
    }
  }

  static setCloudBusinesses(userId: string, businesses: Business[]): void {
    if (!this.isClient() || !userId) return;
    const key = `slipdo_${userId}_businesses`;
    localStorage.setItem(key, JSON.stringify(businesses));
    if (businesses.length > 0) {
      const activeKey = `slipdo_${userId}_active_biz`;
      localStorage.setItem(activeKey, businesses[0].id);
    }
  }

  // --- Customers ---
  static getCustomers(): Customer[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(this.getUserKey('customers'));
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
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
      localStorage.setItem(this.getUserKey('customers'), JSON.stringify(list));
    }
    return list;
  }

  static setCloudCustomers(userId: string, customers: Customer[]): void {
    if (!this.isClient() || !userId) return;
    const key = `slipdo_${userId}_customers`;
    localStorage.setItem(key, JSON.stringify(customers));
  }

  // --- Receipts ---
  static getReceipts(): Receipt[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(this.getUserKey('receipts'));
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
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
      localStorage.setItem(this.getUserKey('receipts'), JSON.stringify(list));
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
      localStorage.setItem(this.getUserKey('receipts'), JSON.stringify(list));
    }
    return list;
  }

  static updateReceiptStatus(id: string, status: 'Paid' | 'Due' | 'Void'): Receipt | null {
    const list = this.getReceipts();
    const target = list.find((r) => r.id === id || r.receiptNo === id);
    if (target) {
      target.status = status;
      if (this.isClient()) {
        localStorage.setItem(this.getUserKey('receipts'), JSON.stringify(list));
      }
      return target;
    }
    return null;
  }

  // Cloud Sync Handler (Never leaks across user accounts)
  static setCloudReceipts(userId: string, receipts: Receipt[]): void {
    if (!this.isClient() || !userId) return;
    const key = `slipdo_${userId}_receipts`;
    localStorage.setItem(key, JSON.stringify(receipts));
  }

  // --- Store Setup Completion Flag ---
  static isStoreSetupCompleted(userId: string): boolean {
    if (!this.isClient() || !userId) return false;
    return localStorage.getItem(`slipdo_${userId}_setup_completed`) === 'true';
  }

  static markStoreSetupCompleted(userId: string): void {
    if (!this.isClient() || !userId) return;
    localStorage.setItem(`slipdo_${userId}_setup_completed`, 'true');
  }

  // --- Brand Preferences ---
  static getLogoLockup(): LogoLockup {
    if (!this.isClient()) return 'voucher-check';
    try {
      return (localStorage.getItem(this.getUserKey('logo_lockup')) as LogoLockup) || 'voucher-check';
    } catch {
      return 'voucher-check';
    }
  }

  static setLogoLockup(lockup: LogoLockup): void {
    if (!this.isClient()) return;
    localStorage.setItem(this.getUserKey('logo_lockup'), lockup);
  }

  static getChecklist(): FigmaChecklistItem[] {
    if (!this.isClient()) return FIGMA_CHECKLIST_ITEMS;
    try {
      const data = localStorage.getItem('slipdo_checklist_v3');
      if (!data) {
        localStorage.setItem('slipdo_checklist_v3', JSON.stringify(FIGMA_CHECKLIST_ITEMS));
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
        localStorage.setItem('slipdo_checklist_v3', JSON.stringify(list));
      }
    }
    return list;
  }

  // --- Auth & Session State ---
  static getAuthUser(): { id: string; email: string; name: string; phone?: string; role: string } | null {
    if (!this.isClient()) return null;
    try {
      const data = localStorage.getItem('slipdo_auth_user_v3');
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setAuthUser(user: { id: string; email: string; name: string; phone?: string; role: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem('slipdo_auth_user_v3', JSON.stringify(user));
  }

  static clearAuthSession(): void {
    if (!this.isClient()) return;
    const uid = this.getCurrentUserId();
    // Clean all user-scoped caches for this user
    localStorage.removeItem(`slipdo_${uid}_receipts`);
    localStorage.removeItem(`slipdo_${uid}_businesses`);
    localStorage.removeItem(`slipdo_${uid}_customers`);
    localStorage.removeItem(`slipdo_${uid}_active_biz`);
    localStorage.removeItem(`slipdo_${uid}_setup_completed`);
    localStorage.removeItem(`slipdo_${uid}_logo_lockup`);

    // Clean legacy global keys
    localStorage.removeItem('slipdo_receipts_v3');
    localStorage.removeItem('slipdo_businesses_v3');
    localStorage.removeItem('slipdo_customers_v3');
    localStorage.removeItem('slipdo_active_biz_v3');
    localStorage.removeItem('slipdo_auth_user_v3');
    localStorage.removeItem('slipdo_auth_token_v3');
    localStorage.removeItem('slipdo_auth_session');
    localStorage.removeItem('slipdo_supabase_session');
  }

  static wipeAllUserData(): void {
    if (!this.isClient()) return;
    this.clearAuthSession();
    try {
      // Clear every slipdo-related key in storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('slipdo_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}
