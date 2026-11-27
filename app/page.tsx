'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StorageService } from '../lib/storage';
import { supabase, supabaseDb } from '../lib/supabase';
import { Business, Receipt, PaymentMethod } from '../lib/types';
import { formatCurrency } from '../lib/format';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';
import { BusinessDrawer } from '../components/BusinessDrawer';
import { ShareModal } from '../components/ShareModal';
import { ReceiptPreview } from '../components/ReceiptPreview';
import { SSLCommerzModal } from '../components/SSLCommerzModal';
import { CheckIcon, ZapIcon, EyeIcon, ExternalLinkIcon, XIcon, ReceiptIcon } from '../components/Icons';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Due' | 'Void'>('All');

  // Modals
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [isSslModalOpen, setIsSslModalOpen] = useState(false);
  const [shareReceipt, setShareReceipt] = useState<Receipt | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const bList = StorageService.getBusinesses();
    const active = StorageService.getActiveBusiness();
    const rList = StorageService.getReceipts();
    setBusinesses(bList);
    setActiveBiz(active);
    setReceipts(rList);

    // Sync with Supabase cloud if merchant session is active
    const session = supabase.getSession();
    if (session?.user?.id) {
      Promise.all([
        supabaseDb.getReceipts(session.user.id),
        supabaseDb.getBusinesses(session.user.id),
      ]).then(([cloudReceipts, cloudBusinesses]) => {
        if (cloudReceipts && cloudReceipts.length > 0) {
          setReceipts(cloudReceipts);
        }
        if (cloudBusinesses && cloudBusinesses.length > 0) {
          setBusinesses(cloudBusinesses);
          setActiveBiz(cloudBusinesses[0]);
        }
      }).catch(console.error);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerPhone.includes(searchQuery);
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Check if voucher was issued today (handles both local "Today, 12:00" and Supabase timestamps)
  const isIssuedToday = (dateStr?: string) => {
    if (!dateStr) return false;
    if (dateStr.toLowerCase().includes('today')) return true;
    const now = new Date();
    const d1 = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const d2 = now.toLocaleDateString('en-GB');
    return dateStr.includes(d1) || dateStr.includes(d2);
  };

  // Dynamic KPI aggregates
  const totalVolume = receipts
    .filter((r) => r.status !== 'Void')
    .reduce((sum, r) => sum + r.total, 0);

  const todaySales = receipts
    .filter((r) => r.status !== 'Void')
    .filter((r) => isIssuedToday(r.date))
    .reduce((sum, r) => sum + r.total, 0);

  const renderPaymentBadge = (method: string) => {
    switch (method) {
      case 'bKash':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2136E]/10 text-[#E2136E] border border-[#E2136E]/20">bKash</span>;
      case 'Nagad':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7941D]/10 text-[#F7941D] border border-[#F7941D]/20">Nagad</span>;
      case 'Rocket':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8C3494]/10 text-[#8C3494] border border-[#8C3494]/20">Rocket</span>;
      case 'Cash':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Cash</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">{method}</span>;
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F1F5F9]"></div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-[1440px] mx-auto p-4 sm:p-6 space-y-5">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg animate-fade-in flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Store Banner Hero */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-5 sm:p-7 text-white shadow-elevated relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-emerald-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{currentBiz.name}</span>
                <span className="text-white/60">· {currentBiz.category}</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
                {lang === 'bn' ? 'স্মার্ট ডিজিটাল ভাউচার ও রসিদ' : 'Fast Branded Receipts & Invoicing'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
                {lang === 'bn'
                  ? 'কয়েক সেকেন্ডে ডিজিটাল ও থার্মাল রশিদ বানান, হোয়াটসঅ্যাপে পাঠান এবং বিক্রির হিসাব রাখুন।'
                  : 'Create branded vouchers in <30s, send 1-click via WhatsApp & SMS, and print 58mm/80mm slips.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/new"
                className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-display font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
              >
                + Create Receipt
              </Link>
              <button
                onClick={() => setIsSslModalOpen(true)}
                className="px-4 py-3 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs border border-emerald-500/50 transition-colors inline-flex items-center gap-1.5"
              >
                <ZapIcon className="w-3.5 h-3.5" />
                <span>Upgrade Pro</span>
              </button>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* 4 Financial KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Sales</p>
            <p className="font-display font-bold text-lg sm:text-2xl text-slate-900 mt-1">
              {formatCurrency(todaySales, lang === 'bn')}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Real-time daily volume</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Volume</p>
            <p className="font-display font-bold text-lg sm:text-2xl text-slate-900 mt-1">
              {formatCurrency(totalVolume, lang === 'bn')}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Lifetime processed</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receipts Issued</p>
            <p className="font-display font-bold text-lg sm:text-2xl text-slate-900 mt-1">
              {receipts.length}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Active vouchers</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Customers</p>
            <p className="font-display font-bold text-lg sm:text-2xl text-slate-900 mt-1">
              {StorageService.getCustomers().length}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">In customer CRM</p>
          </div>
        </div>

        {/* Recent Receipts Archive Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                {lang === 'bn' ? 'সাম্প্রতিক ভাউচার সমূহ' : 'Recent Vouchers'}
              </h2>
              <p className="text-xs text-slate-500">
                Manage, preview, and share receipts with your customers
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                suppressHydrationWarning
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'ভাউচার নং, ক্রেতার নাম...' : 'Search receipt ID, customer, phone...'}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs w-full sm:w-60 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                {(['All', 'Paid', 'Due', 'Void'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      filterStatus === st
                        ? 'bg-white font-bold text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <ReceiptIcon className="w-6 h-6" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-800">
                          {lang === 'bn' ? 'কোন রশিদ পাওয়া যায়নি' : 'No receipts created yet'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {lang === 'bn'
                            ? 'কয়েক সেকেন্ডে ডিজিটাল ও থার্মাল ভাউচার তৈরি করতে নতুন রশিদ তৈরি করুন।'
                            : 'Start issuing branded digital receipts for your customers in <30 seconds.'}
                        </p>
                        <Link
                          href="/new"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          + Create First Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">#{r.id}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{r.template.replace('-', ' ')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{r.customerName}</span>
                        <span className="text-[11px] text-slate-500">{r.customerPhone}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{r.date}</td>
                      <td className="py-3 px-4">{renderPaymentBadge(r.paymentMethod)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(r.total, lang === 'bn')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'Due'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600 line-through'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewReceipt(r)}
                            className="px-2 py-1 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => setShareReceipt(r)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <span>Share</span>
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <BottomNav lang={lang} />

      {/* Business Switcher Drawer */}
      <BusinessDrawer
        isOpen={isStoreDrawerOpen}
        onClose={() => setIsStoreDrawerOpen(false)}
        businesses={businesses}
        activeBusiness={currentBiz}
        onSelectBusiness={(biz) => {
          setActiveBiz(biz);
          StorageService.setActiveBusiness(biz.id);
          showToast(`Switched storefront to ${biz.name}`);
        }}
        onAddBusiness={(newBiz) => {
          const updated = [...businesses, newBiz];
          setBusinesses(updated);
          setActiveBiz(newBiz);
          StorageService.saveBusiness(newBiz);
          StorageService.setActiveBusiness(newBiz.id);
          showToast(`New branch "${newBiz.name}" created!`);
        }}
        lang={lang}
      />

      {/* Share Modal */}
      {shareReceipt && (
        <ShareModal
          receipt={shareReceipt}
          business={currentBiz}
          isOpen={true}
          onClose={() => setShareReceipt(null)}
          lang={lang}
        />
      )}

      {/* Preview Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-transparent my-8 space-y-3">
            <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow-sm">
              <span className="font-display font-bold text-sm text-slate-900">
                Voucher #{previewReceipt.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const r = previewReceipt;
                    setPreviewReceipt(null);
                    setShareReceipt(r);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Share / Print
                </button>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <ReceiptPreview receipt={previewReceipt} business={currentBiz} />
          </div>
        </div>
      )}

      {/* SSLCommerz Modal */}
      <SSLCommerzModal
        isOpen={isSslModalOpen}
        onClose={() => setIsSslModalOpen(false)}
        onSuccess={(gw) => {
          showToast(`Upgraded to SlipDo Pro via ${gw} sandbox!`);
        }}
      />
    </div>
  );
}
