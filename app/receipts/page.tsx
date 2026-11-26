'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StorageService } from '../../lib/storage';
import { Business, Receipt } from '../../lib/types';
import { formatMoney, formatDate } from '../../lib/format';
import { translations, Language } from '../../lib/i18n';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { ShareModal } from '../../components/ShareModal';
import { BusinessModal } from '../../components/BusinessModal';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { PlusIcon, EyeIcon, Share2Icon, ReceiptIcon } from '../../components/Icons';

export default function ReceiptsListPage() {
  const [lang, setLang] = useState<Language>('en');
  const [business, setBusiness] = useState<Business>(StorageService.getBusiness());
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Void'>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');

  const [activeShareReceipt, setActiveShareReceipt] = useState<Receipt | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);

  useEffect(() => {
    setBusiness(StorageService.getBusiness());
    setReceipts(StorageService.getReceipts());
  }, []);

  const filtered = receipts.filter((r) => {
    const matchesSearch =
      r.number.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerPhone && r.customerPhone.includes(search));
    const matchesStatus = statusFilter === 'All' || r.paymentStatus === statusFilter;
    const matchesMethod = methodFilter === 'All' || r.paymentMethod === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar
        business={business}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenBusinessSettings={() => setIsBusinessModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900">
              {lang === 'bn' ? 'সকল রশিদ ও ভাউচার' : 'All Payment Receipts'}
            </h1>
            <p className="text-xs text-neutral-500">
              Browse, search, duplicate or print any issued receipt
            </p>
          </div>

          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
          >
            <PlusIcon size={16} />
            <span>Create New Receipt</span>
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="Search by receipt #, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 w-full md:w-80 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Status Tabs */}
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
              {(['All', 'Paid', 'Unpaid', 'Void'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg transition ${
                    statusFilter === s
                      ? 'bg-white font-bold text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Method Dropdown */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs bg-neutral-100 border border-neutral-200 rounded-xl px-2.5 py-1.5 font-medium outline-none"
            >
              <option value="All">All Methods</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
              <option value="Cash">Cash</option>
              <option value="Bank Card">Bank Card</option>
            </select>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ReceiptIcon size={36} className="mx-auto text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-600">No receipts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-6">Receipt #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-neutral-50/60 transition">
                      <td className="py-3.5 px-6 font-mono font-bold text-neutral-900">
                        {receipt.number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">{receipt.customerName}</div>
                        {receipt.customerPhone && (
                          <div className="text-[11px] text-neutral-500">{receipt.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">{formatDate(receipt.issueDate)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800">
                          {receipt.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-neutral-900">
                        {formatMoney(receipt.total, receipt.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            receipt.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : receipt.paymentStatus === 'Void'
                              ? 'bg-neutral-200 text-neutral-600 line-through'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {receipt.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewReceipt(receipt)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Preview"
                          >
                            <EyeIcon size={16} />
                          </button>
                          <button
                            onClick={() => setActiveShareReceipt(receipt)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Share"
                          >
                            <Share2Icon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <BottomNav lang={lang} />

      {activeShareReceipt && (
        <ShareModal
          receipt={activeShareReceipt}
          business={business}
          isOpen={true}
          onClose={() => setActiveShareReceipt(null)}
          lang={lang}
        />
      )}

      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full bg-transparent my-8 space-y-4">
            <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow">
              <span className="font-bold text-sm text-neutral-800">
                Receipt: {previewReceipt.number}
              </span>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <ReceiptPreview receipt={previewReceipt} business={business} />
          </div>
        </div>
      )}

      <BusinessModal
        business={business}
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        onSave={(updated) => {
          setBusiness(updated);
          StorageService.saveBusiness(updated);
        }}
        lang={lang}
      />
    </div>
  );
}
