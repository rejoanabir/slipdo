'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business, Customer, Receipt } from '../../lib/types';
import { formatCurrency } from '../../lib/format';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { CountryCodeSelect } from '../../components/CountryCodeSelect';
import { UsersIcon, XIcon, ReceiptIcon, EyeIcon, PrinterIcon, PlusIcon, CheckIcon } from '../../components/Icons';

export default function CustomersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCountryCode, setNewCustCountryCode] = useState('BD');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const prefixMap: Record<string, string> = {
      BD: '+880',
      US: '+1',
      GB: '+44',
      IN: '+91',
      AE: '+971',
      SA: '+966',
      SG: '+65',
      MY: '+60',
      PK: '+92',
      CA: '+1',
      AU: '+61',
    };
    const codePrefix = prefixMap[newCustCountryCode] || '+880';
    const cleanNum = newCustPhone.replace(/^[+\d\s-]+/, (m) => (m.startsWith('+') ? '' : m)).trim();
    const formattedPhone = cleanNum ? `${codePrefix} ${cleanNum}` : '+880 1700-000000';

    const newCustomer: Customer = {
      id: 'cust_' + Date.now(),
      name: newCustName.trim(),
      phone: formattedPhone,
      email: newCustEmail.trim() || `${newCustName.trim().toLowerCase().replace(/\s+/g, '.')}@client.bd`,
      totalSpent: 0,
      receipts: 0,
      lastVisit: 'Just created',
    };

    StorageService.saveCustomer(newCustomer);
    setCustomers((prev) => [newCustomer, ...prev]);

    const session = supabase.getSession();
    if (session?.user?.id) {
      await supabaseDb.saveCustomer(newCustomer, session.user.id).catch(console.error);
    }

    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setIsAddCustomerOpen(false);
    showToast(`Customer "${newCustomer.name}" added successfully!`);
  };

  useEffect(() => {
    setMounted(true);
    const session = supabase.getSession();
    const authUser = StorageService.getAuthUser();
    if (!session && !authUser) {
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
    setCustomers(StorageService.getCustomers());
    setReceipts(StorageService.getReceipts());

    // Sync with Supabase cloud
    if (session?.user?.id) {
      const uid = session.user.id;
      Promise.all([
        supabaseDb.getCustomers(uid),
        supabaseDb.getReceipts(uid),
      ]).then(([cloudCustomers, cloudReceipts]) => {
        StorageService.setCloudCustomers(uid, cloudCustomers || []);
        StorageService.setCloudReceipts(uid, cloudReceipts || []);
        setCustomers(cloudCustomers || []);
        setReceipts(cloudReceipts || []);
      }).catch(console.error);
    }
  }, [router]);

  const currentBiz = activeBiz || (businesses[0] ?? {
    id: 'biz_default',
    name: 'My Digital Store',
    category: 'Retail & Commerce',
    address: 'Dhaka, Bangladesh',
    phone: '+880 1700-000000',
    bin: '000000000-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const customerReceipts = selectedCustomer
    ? receipts.filter(
        (r) =>
          r.customerPhone === selectedCustomer.phone ||
          r.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-[1440px] mx-auto p-4 sm:p-6 space-y-6">
        {toastMessage && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xl animate-fade-in flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Customer Directory & CRM
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Track purchase histories, phone contacts, and lifetime value across outlets
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.99]"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-soft flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
          <span className="text-xs font-bold text-slate-400 shrink-0">
            {filtered.length} client{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Customers Grid */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UsersIcon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-800">No Customers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a new client record or issue your first receipt to automatically track regular customers.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              + Create First Voucher
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft flex items-center justify-between gap-3 hover:border-blue-500/50 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 font-display font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CU'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">{c.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {c.receipts} vouchers · {c.lastVisit}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-sm text-blue-700 font-mono">
                    {formatCurrency(c.totalSpent, lang === 'bn')}
                  </p>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block mt-1">
                    History →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Customer Activity History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                  {selectedCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone} {selectedCustomer.email && `· ${selectedCustomer.email}`}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 p-4 bg-blue-50/50 border-b border-blue-100 text-center">
              <div className="border-r border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Total Spent</span>
                <p className="font-display font-bold text-base text-blue-950 font-mono">{formatCurrency(selectedCustomer.totalSpent, false)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Vouchers Issued</span>
                <p className="font-display font-bold text-base text-blue-950 font-mono">{selectedCustomer.receipts}</p>
              </div>
            </div>

            {/* Receipts List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 thin-scroll">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Issued Invoices & Memos</h4>
              {customerReceipts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No vouchers recorded for this customer in local cache.
                </div>
              ) : (
                customerReceipts.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">#{r.receiptNo || r.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          r.status === 'Paid' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.date} · {r.paymentMethod}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{formatCurrency(r.total, false)}</span>
                      <button
                        onClick={() => setPreviewReceipt(r)}
                        className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="View Receipt"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Customer Receipt */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-display font-bold text-sm text-slate-900">Digital Receipt Preview</span>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div id="printable-receipt-area">
              <ReceiptPreview receipt={previewReceipt} business={currentBiz} templateId={previewReceipt.template} />
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal with Country Code */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UsersIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">Add New Customer</h3>
                  <p className="text-[11px] text-slate-400">Record client profile in CRM directory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (WhatsApp/SMS)</label>
                <div className="flex items-center gap-2">
                  <CountryCodeSelect
                    value={newCustCountryCode}
                    onChange={setNewCustCountryCode}
                    className="w-32 shrink-0"
                  />
                  <input
                    type="tel"
                    placeholder="1711-223344"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. tanvir@client.bd"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.99]"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav lang={lang} />

      <BusinessDrawer
        isOpen={isStoreDrawerOpen}
        onClose={() => setIsStoreDrawerOpen(false)}
        businesses={businesses}
        activeBusiness={currentBiz}
        onSelectBusiness={(b) => {
          setActiveBiz(b);
          StorageService.setActiveBusiness(b.id);
        }}
        onAddBusiness={(newBiz) => {
          const updated = [...businesses, newBiz];
          setBusinesses(updated);
          setActiveBiz(newBiz);
          StorageService.saveBusiness(newBiz);
          StorageService.setActiveBusiness(newBiz.id);
          showToast(`Storefront "${newBiz.name}" added!`);
        }}
        lang={lang}
      />
    </div>
  );
}
