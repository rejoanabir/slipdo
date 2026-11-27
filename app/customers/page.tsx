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

    const newCustomer: Customer = {
      id: 'cust_' + Date.now(),
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '+880 1700-000000',
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
      Promise.all([
        supabaseDb.getCustomers(session.user.id),
        supabaseDb.getReceipts(session.user.id),
      ]).then(([cloudCustomers, cloudReceipts]) => {
        if (cloudCustomers && cloudCustomers.length > 0) {
          setCustomers(cloudCustomers);
        }
        if (cloudReceipts && cloudReceipts.length > 0) {
          setReceipts(cloudReceipts);
        }
      }).catch(console.error);
    }
  }, []);

  const currentBiz = activeBiz || (businesses[0] ?? {
    id: 'biz_default',
    name: 'My Store',
    category: 'General Retail & Services',
    address: 'Dhaka, Bangladesh',
    phone: '+880 1700-000000',
    bin: '000000000-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  });

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const customerReceipts = selectedCustomer
    ? receipts.filter(
        (r) =>
          (selectedCustomer.phone && r.customerPhone === selectedCustomer.phone) ||
          r.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              {lang === 'bn' ? 'গ্রাহক ডিরেক্টরি' : 'Customer Directory'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'আজীবন লেনদেন ও ভাউচার হিস্ট্রি সহ সিআরএম প্রোফাইল'
                : 'CRM profiles with lifetime spend & transaction histories'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="sm:w-64">
              <input
                type="text"
                value={search}
                suppressHydrationWarning
                placeholder="Search customer by name or phone..."
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500 shadow-2xs"
              />
            </div>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft transition-all shrink-0"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Customer</span>
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Customer Cards Grid or Empty State */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-soft max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UsersIcon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-800">
              {lang === 'bn' ? 'কোন গ্রাহকের রেকর্ড নেই' : 'No customers recorded yet'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'রশিদ তৈরি করার সময় গ্রাহকের নাম ও ফোন নম্বর লিখলে স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।'
                : 'Customer profiles and lifetime spending are automatically organized here when you issue receipts.'}
            </p>
            <Link
              href="/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
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
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft flex items-center justify-between gap-3 hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-display font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CU'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">{c.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {c.receipts} vouchers · {c.lastVisit}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-sm text-emerald-700 font-mono">
                    {formatCurrency(c.totalSpent, lang === 'bn')}
                  </p>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
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
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                  {selectedCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone} {selectedCustomer.email && `· ${selectedCustomer.email}`}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 p-4 bg-emerald-50/50 border-b border-emerald-100 text-center">
              <div className="border-r border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Spent</span>
                <p className="font-display font-bold text-base text-emerald-950 font-mono">{formatCurrency(selectedCustomer.totalSpent, false)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Vouchers Issued</span>
                <p className="font-display font-bold text-base text-emerald-950 font-mono">{selectedCustomer.receipts}</p>
              </div>
            </div>

            {/* Receipts List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 thin-scroll">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Issued Invoices & Memos</h4>
              {customerReceipts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No vouchers recorded for this customer in local cache.
                </div>
              ) : (
                customerReceipts.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">#{r.receiptNo || r.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          r.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                        title="View Voucher"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">Customer ID: {selectedCustomer.id}</span>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  router.push('/new');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                + Issue New Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full space-y-3">
            <div className="flex items-center justify-between text-white px-1">
              <span className="font-bold text-sm">Voucher #{previewReceipt.receiptNo || previewReceipt.id}</span>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
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

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-elevated border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UsersIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">Add New Customer</h3>
                  <p className="text-[11px] text-slate-500">Record client profile in CRM directory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (WhatsApp/SMS)</label>
                <input
                  type="text"
                  placeholder="e.g. +880 1711-223344"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. tanvir@client.bd"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft transition-all"
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
        }}
        lang={lang}
      />
    </div>
  );
}
