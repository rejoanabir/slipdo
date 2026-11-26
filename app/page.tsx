'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StorageService } from '../lib/storage';
import { Business, Customer, Receipt } from '../lib/types';
import { formatMoney, formatDate } from '../lib/format';
import { translations, Language } from '../lib/i18n';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';
import { BusinessModal } from '../components/BusinessModal';
import { ShareModal } from '../components/ShareModal';
import { ReceiptPreview } from '../components/ReceiptPreview';
import {
  PlusIcon,
  ReceiptIcon,
  UsersIcon,
  Share2Icon,
  EyeIcon,
  WhatsAppIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '../components/Icons';

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>('en');
  const [business, setBusiness] = useState<Business>(StorageService.getBusiness());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid' | 'Void'>('All');

  // Modals state
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [activeShareReceipt, setActiveShareReceipt] = useState<Receipt | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    setBusiness(StorageService.getBusiness());
    setCustomers(StorageService.getCustomers());
    setReceipts(StorageService.getReceipts());
  }, []);

  const t = translations[lang];

  // Financial KPI calculations
  const totalVolume = receipts
    .filter((r) => r.paymentStatus !== 'Void')
    .reduce((sum, r) => sum + r.total, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = receipts
    .filter((r) => r.issueDate === todayStr && r.paymentStatus !== 'Void')
    .reduce((sum, r) => sum + r.total, 0);

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customerPhone && r.customerPhone.includes(searchQuery));
    const matchesFilter = filterStatus === 'All' || r.paymentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleVoid = (receiptId: string) => {
    if (confirm('Are you sure you want to void this receipt? / আপনি কি এই রশিদটি বাতিল করতে চান?')) {
      const updated = StorageService.voidReceipt(receiptId);
      setReceipts([...updated]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar
        business={business}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenBusinessSettings={() => setIsBusinessModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Welcome & Quick Action Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10">
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200">
                <SparklesIcon size={14} />
                <span>{business.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {lang === 'bn' ? 'স্বাগতম, আপনার রশিদের হিসেব' : 'Fast Branded Receipts & Invoicing'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
                {lang === 'bn'
                  ? 'কয়েক সেকেন্ডে ডিজিটাল রশিদ বানান, হোয়াটসঅ্যাপ বা ইমেইলে পাঠান এবং বিক্রির হিসাব রাখুন।'
                  : 'Generate professional digital and POS receipts, send in 1-click via WhatsApp, and manage sales.'}
              </p>
            </div>

            <Link
              href="/new"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-sm rounded-2xl shadow-lg transition active:scale-95 flex-shrink-0"
            >
              <PlusIcon size={18} />
              <span>{t.newReceipt}</span>
            </Link>
          </div>

          {/* Decorative Background Blob */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* 4 Financial KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              {t.todaySales}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              {formatMoney(todaySales, business.currency)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Real-time daily volume</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              {t.totalRevenue}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              {formatMoney(totalVolume, business.currency)}
            </div>
            <span className="text-[11px] text-neutral-500 font-medium">Lifetime processed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              {t.receiptCount}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              {receipts.length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Active vouchers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              {t.activeCustomers}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              {customers.length}
            </div>
            <span className="text-[11px] text-neutral-500 font-medium">In customer directory</span>
          </div>
        </div>

        {/* Recent Receipts Section */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden">
          {/* Header & Controls */}
          <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{t.recentReceipts}</h2>
              <p className="text-xs text-neutral-500">
                Manage, preview, and share receipts with your customers
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search by #, customer or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 w-full sm:w-56 outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Status Tabs */}
              <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
                {(['All', 'Paid', 'Unpaid', 'Void'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      filterStatus === st
                        ? 'bg-white font-bold text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table of Receipts */}
          {filteredReceipts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ReceiptIcon size={40} className="mx-auto text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-600">No receipts found</p>
              <Link
                href="/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                <PlusIcon size={16} />
                <span>Create your first receipt</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Receipt #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-neutral-50/60 transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="font-mono font-bold text-neutral-900 block">
                          {receipt.number}
                        </span>
                        <span className="text-[10px] text-neutral-400 capitalize">
                          {receipt.templateId.replace('-', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-neutral-900 block truncate max-w-[160px]">
                          {receipt.customerName}
                        </span>
                        {receipt.customerPhone && (
                          <span className="text-[11px] text-neutral-500">{receipt.customerPhone}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-600 whitespace-nowrap">
                        {formatDate(receipt.issueDate)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            receipt.paymentMethod === 'bKash'
                              ? 'bg-pink-100 text-pink-700'
                              : receipt.paymentMethod === 'Nagad'
                              ? 'bg-amber-100 text-amber-700'
                              : receipt.paymentMethod === 'Rocket'
                              ? 'bg-purple-100 text-purple-700'
                              : receipt.paymentMethod === 'Cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {receipt.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-neutral-900 whitespace-nowrap">
                        {formatMoney(receipt.total, receipt.currency)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            receipt.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : receipt.paymentStatus === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : receipt.paymentStatus === 'Void'
                              ? 'bg-neutral-200 text-neutral-600 line-through'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {receipt.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Button */}
                          <button
                            onClick={() => setPreviewReceipt(receipt)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Preview Receipt"
                          >
                            <EyeIcon size={16} />
                          </button>

                          {/* Share Modal Button */}
                          <button
                            onClick={() => setActiveShareReceipt(receipt)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Share on WhatsApp/Email"
                          >
                            <Share2Icon size={16} />
                          </button>

                          {/* Void Action */}
                          {receipt.paymentStatus !== 'Void' && (
                            <button
                              onClick={() => handleVoid(receipt.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-neutral-400 hover:text-red-600 transition"
                              title="Void Receipt"
                            >
                              Void
                            </button>
                          )}
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

      {/* Mobile Bottom Navigation */}
      <BottomNav lang={lang} />

      {/* Business Profile Modal */}
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

      {/* Share Modal */}
      {activeShareReceipt && (
        <ShareModal
          receipt={activeShareReceipt}
          business={business}
          isOpen={true}
          onClose={() => setActiveShareReceipt(null)}
          lang={lang}
        />
      )}

      {/* Full Preview Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full bg-transparent my-8 space-y-4">
            <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl shadow">
              <span className="font-bold text-sm text-neutral-800">
                Preview: {previewReceipt.number}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const r = previewReceipt;
                    setPreviewReceipt(null);
                    setActiveShareReceipt(r);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Share / Print
                </button>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            <ReceiptPreview receipt={previewReceipt} business={business} />
          </div>
        </div>
      )}
    </div>
  );
}
