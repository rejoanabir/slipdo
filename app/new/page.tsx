'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { Business, Customer, Receipt } from '../../lib/types';
import { translations, Language } from '../../lib/i18n';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { ReceiptForm } from '../../components/ReceiptForm';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { ShareModal } from '../../components/ShareModal';
import { BusinessModal } from '../../components/BusinessModal';
import { EyeIcon, PrinterIcon } from '../../components/Icons';

export default function NewReceiptPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [business, setBusiness] = useState<Business>(StorageService.getBusiness());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [liveReceipt, setLiveReceipt] = useState<Receipt | null>(null);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  useEffect(() => {
    const b = StorageService.getBusiness();
    const c = StorageService.getCustomers();
    setBusiness(b);
    setCustomers(c);

    // Seed default initial live receipt
    const year = new Date().getFullYear();
    const initial: Receipt = {
      id: 'rcp-' + Date.now(),
      businessId: b.id,
      customerName: 'Tanvir Hossain',
      customerPhone: '+880 1819-234567',
      customerEmail: 'tanvir@example.com',
      customerAddress: 'Dhaka, Bangladesh',
      number: `${b.receiptPrefix || 'RCP'}-${year}-${String(b.nextNumber || 1).padStart(4, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      currency: b.currency || 'BDT',
      currencySymbol: b.currencySymbol || '৳',
      items: [
        {
          id: 'item-1',
          description: 'Web Application Consulting & Development',
          quantity: 1,
          unitPrice: 25000,
          taxRate: b.defaultTaxRate || 0,
          lineTotal: 25000,
        },
      ],
      subtotal: 25000,
      discountType: 'flat',
      discountValue: 0,
      discountAmount: 0,
      shippingFee: 0,
      taxTotal: (25000 * (b.defaultTaxRate || 0)) / 100,
      total: 25000 + (25000 * (b.defaultTaxRate || 0)) / 100,
      paymentMethod: 'bKash',
      paymentStatus: 'Paid',
      amountPaid: 25000 + (25000 * (b.defaultTaxRate || 0)) / 100,
      amountDue: 0,
      transactionId: 'BK-TRX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      templateId: 'modern-emerald',
      notes: b.defaultNotes || '',
      publicToken: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLiveReceipt(initial);
  }, []);

  const handleSave = (receipt: Receipt) => {
    const saved = StorageService.saveReceipt(receipt);
    setSavedReceipt(saved);
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
        {/* Mobile View Toggle (Edit Form vs Live Preview) */}
        <div className="flex lg:hidden bg-neutral-200/80 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'form' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
            }`}
          >
            1. Edit Details
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-600'
            }`}
          >
            <EyeIcon size={14} />
            <span>2. Live Preview</span>
          </button>
        </div>

        {/* 2-Column Responsive Layout: Form on Left, Live Preview Sticky on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form */}
          <div className={`lg:col-span-7 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            {liveReceipt && (
              <ReceiptForm
                business={business}
                customers={customers}
                initialReceipt={liveReceipt}
                onReceiptChange={(updated) => setLiveReceipt(updated)}
                onSave={handleSave}
                lang={lang}
              />
            )}
          </div>

          {/* Right Column: Live Preview */}
          <div
            className={`lg:col-span-5 lg:sticky lg:top-24 space-y-3 ${
              activeTab === 'form' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {lang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Receipt Preview'}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Updates in Real-Time
              </span>
            </div>

            {liveReceipt && (
              <div className="border border-neutral-200 rounded-3xl p-3 bg-neutral-100 shadow-inner">
                <ReceiptPreview receipt={liveReceipt} business={business} />
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav lang={lang} />

      {/* Share Modal Triggered on Save */}
      {savedReceipt && (
        <ShareModal
          receipt={savedReceipt}
          business={business}
          isOpen={true}
          onClose={() => {
            setSavedReceipt(null);
            router.push('/');
          }}
          lang={lang}
        />
      )}

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
    </div>
  );
}
