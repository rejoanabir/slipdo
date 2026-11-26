'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StorageService } from '../../lib/storage';
import { Business, Receipt } from '../../lib/types';
import { formatCurrency } from '../../lib/format';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { ShareModal } from '../../components/ShareModal';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { EyeIcon, ExternalLinkIcon, XIcon } from '../../components/Icons';

export default function ReceiptsArchivePage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Due' | 'Void'>('All');
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [shareReceipt, setShareReceipt] = useState<Receipt | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    setMounted(true);
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
    setReceipts(StorageService.getReceipts());
  }, []);

  const currentBiz = activeBiz || (businesses[0] ?? {
    id: 'biz_1',
    name: 'Bengal Gadget Studio',
    category: 'Electronics & Smart Tech',
    address: 'House #42, Road #11, Banani, Dhaka-1213',
    phone: '+880 1711-000000',
    bin: '002345891-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  });

  const filtered = receipts.filter((r) => {
    const matchesSearch =
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.customerPhone.includes(search);
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-xl text-slate-900">All Vouchers & Invoices</h1>
            <p className="text-xs text-slate-500">Search, duplicate, share, or print any issued voucher</p>
          </div>

          <Link
            href="/new"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shadow-sm self-start sm:self-auto"
          >
            + New Receipt
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col sm:flex-row gap-3 items-center justify-between">
          <input
            type="text"
            value={search}
            suppressHydrationWarning
            placeholder="Search by ID, customer name or phone..."
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs w-full sm:w-72 focus:outline-none focus:border-emerald-500"
          />

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            {(['All', 'Paid', 'Due', 'Void'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
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
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{r.customerName}</span>
                      <span className="text-[11px] text-slate-500">{r.customerPhone}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{r.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{r.paymentMethod}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
        lang={lang}
      />

      {shareReceipt && (
        <ShareModal
          receipt={shareReceipt}
          business={currentBiz}
          isOpen={true}
          onClose={() => setShareReceipt(null)}
          lang={lang}
        />
      )}

      {previewReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-transparent my-8 space-y-3">
            <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow-sm">
              <span className="font-display font-bold text-sm text-slate-900">
                Voucher #{previewReceipt.id}
              </span>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <ReceiptPreview receipt={previewReceipt} business={currentBiz} />
          </div>
        </div>
      )}
    </div>
  );
}
