'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  DownloadIcon,
} from '../../components/Icons';

export default function ReceiptsArchivePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    const session = supabase.getSession();
    const authUser = StorageService.getAuthUser();
    if (!session && !authUser) {
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
    setReceipts(StorageService.getReceipts());

    // Sync with Supabase cloud
    if (session?.user?.id) {
      const uid = session.user.id;
      supabaseDb
        .getReceipts(uid)
        .then((cloudReceipts) => {
          StorageService.setCloudReceipts(uid, cloudReceipts || []);
          setReceipts(cloudReceipts || []);
        })
        .catch(console.error);
    }
  }, [router]);

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

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      showToast('No vouchers available to export');
      return;
    }
    const headers = ['Receipt No', 'Date', 'Customer Name', 'Customer Phone', 'Payment Method', 'Status', 'Total'];
    const rows = filtered.map((r) => [
      `"${r.receiptNo || r.id}"`,
      `"${r.date}"`,
      `"${(r.customerName || '').replace(/"/g, '""')}"`,
      `"${r.customerPhone || ''}"`,
      `"${r.paymentMethod}"`,
      `"${r.status}"`,
      r.total,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SlipDo_Vouchers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Voucher ledger exported to CSV');
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

      {toast && (
        <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckIcon className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {lang === 'bn' ? 'সকল ভাউচার ও ইনভয়েস' : 'All Vouchers & Invoices'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'bn'
                ? 'ইস্যু করা যেকোনো রশিদের অনুসন্ধান, অবস্থা পরিবর্তন ও প্রিন্ট করুন'
                : 'Search, update payment status, share, or print any issued voucher'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all"
              title="Download CSV report"
            >
              <DownloadIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/new"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.99]"
            >
              <span>+ New Receipt</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
            {(['All', 'Paid', 'Due', 'Void'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
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
              className="text-xs bg-slate-50 border border-slate-200 rounded-full px-4 py-2 w-full focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Receipts Ledger Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <ReceiptIcon className="w-6 h-6" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-800">
                          {lang === 'bn' ? 'কোন ভাউচার পাওয়া যায়নি' : 'No Vouchers Found'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {lang === 'bn'
                            ? 'ফিল্টার পরিবর্তন করে দেখুন বা নতুন রশিদ ইস্যু করুন।'
                            : 'Adjust your search filters or issue a new receipt.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">#{r.receiptNo || r.id}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{r.template.replace('-', ' ')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{r.customerName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{r.customerPhone}</span>
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
                                ? 'bg-blue-100 text-blue-800'
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
                              className="px-2 py-0.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors"
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
                            className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Quick Print Voucher"
                          >
                            <PrinterIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview */}
                          <button
                            onClick={() => setPreviewReceipt(r)}
                            className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Preview Voucher"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Share Modal */}
                          <button
                            onClick={() => setShareReceipt(r)}
                            className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Share via WhatsApp & SMS"
                          >
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Voucher */}
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
          <div className="max-w-lg w-full space-y-3 my-8">
            <div className="flex items-center justify-between text-white px-2">
              <span className="font-bold text-sm">Voucher Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <PrinterIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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
