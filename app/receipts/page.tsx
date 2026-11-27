'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business, Receipt, PaymentStatus } from '../../lib/types';
import { formatCurrency } from '../../lib/format';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { ShareModal } from '../../components/ShareModal';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import {
  EyeIcon,
  ExternalLinkIcon,
  XIcon,
  ReceiptIcon,
  PrinterIcon,
  Trash2Icon,
  CheckIcon,
} from '../../components/Icons';

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
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
    setReceipts(StorageService.getReceipts());

    // Sync with Supabase cloud
    const session = supabase.getSession();
    if (session?.user?.id) {
      supabaseDb
        .getReceipts(session.user.id)
        .then((cloudReceipts) => {
          if (cloudReceipts && cloudReceipts.length > 0) {
            setReceipts(cloudReceipts);
          }
        })
        .catch(console.error);
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleStatusChange = async (receipt: Receipt, newStatus: PaymentStatus) => {
    StorageService.updateReceiptStatus(receipt.id, newStatus);
    setReceipts((prev) =>
      prev.map((r) => (r.id === receipt.id ? { ...r, status: newStatus } : r))
    );
    showToast(`Voucher #${receipt.receiptNo || receipt.id} marked as ${newStatus}`);

    try {
      await supabaseDb.updateReceiptStatus(receipt.id, newStatus);
    } catch (err) {
      console.error('Failed to sync status update to Supabase:', err);
    }
  };

  const handleDelete = async (receipt: Receipt) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete voucher #${receipt.receiptNo || receipt.id}?`)) {
      return;
    }
    const updated = StorageService.deleteReceipt(receipt.id);
    setReceipts(updated);
    showToast(`Voucher #${receipt.receiptNo || receipt.id} removed`);

    try {
      await supabaseDb.deleteReceipt(receipt.id);
    } catch (err) {
      console.error('Failed to delete from Supabase:', err);
    }
  };

  const handleQuickPrint = (receipt: Receipt) => {
    setPreviewReceipt(receipt);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const filtered = receipts.filter((r) => {
    const matchesSearch =
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.receiptNo && r.receiptNo.toLowerCase().includes(search.toLowerCase())) ||
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

      {toast && (
        <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckIcon className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              {lang === 'bn' ? 'সকল ভাউচার ও ইনভয়েস' : 'All Vouchers & Invoices'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'ইস্যু করা যেকোনো রশিদের অনুসন্ধান, অবস্থা পরিবর্তন ও প্রিন্ট করুন'
                : 'Search, update payment status, share, or print any issued voucher'}
            </p>
          </div>

          <Link
            href="/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft transition-all"
          >
            <span>+ New Receipt</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['All', 'Paid', 'Due', 'Void'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search by #, customer or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 w-full focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Receipts Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status & Actions</th>
                  <th className="py-3 px-4 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                          <ReceiptIcon className="w-6 h-6" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-800">
                          {lang === 'bn' ? 'কোন ভাউচার পাওয়া যায়নি' : 'No vouchers found'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {lang === 'bn'
                            ? 'আপনি এখনো কোন রশিদ তৈরি করেননি।'
                            : 'All created payment slips and cash memos will be securely archived here.'}
                        </p>
                        <Link
                          href="/new"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          + Create New Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{r.receiptNo || r.id}
                      </td>
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
                        <div className="inline-flex items-center gap-1.5">
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

                          {/* Quick Status Toggles */}
                          {r.status === 'Due' && (
                            <button
                              onClick={() => handleStatusChange(r, 'Paid')}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                              title="Mark as Paid"
                            >
                              Paid
                            </button>
                          )}
                          {r.status !== 'Void' && (
                            <button
                              onClick={() => handleStatusChange(r, 'Void')}
                              className="px-1.5 py-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-medium transition-colors"
                              title="Mark as Void"
                            >
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Print */}
                          <button
                            onClick={() => handleQuickPrint(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Quick Print Voucher"
                          >
                            <PrinterIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview */}
                          <button
                            onClick={() => setPreviewReceipt(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Preview Voucher"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Share Modal */}
                          <button
                            onClick={() => setShareReceipt(r)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Share via WhatsApp & SMS"
                          >
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Voucher */}
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Voucher"
                          >
                            <Trash2Icon className="w-3.5 h-3.5" />
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
          showToast(`Storefront "${newBiz.name}" created!`);
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
          <div className="max-w-lg w-full space-y-3">
            <div className="flex items-center justify-between text-white px-1">
              <span className="font-bold text-sm">Voucher Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <PrinterIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div id="printable-receipt-area">
              <ReceiptPreview receipt={previewReceipt} business={currentBiz} templateId={previewReceipt.template} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
