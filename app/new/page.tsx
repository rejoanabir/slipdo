'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { Business, Customer, Receipt, ReceiptItem, TemplateId, PaymentMethod } from '../../lib/types';
import { formatCurrency, calcTotals } from '../../lib/format';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { ShareModal } from '../../components/ShareModal';
import { XIcon } from '../../components/Icons';

export default function ReceiptCreatorPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);

  // Creator Tab on Mobile: 'edit' or 'preview'
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>('58mm');

  // Receipt Draft State (Clean slate for real merchants)
  const [receiptNo, setReceiptNo] = useState(`SD-${new Date().getFullYear()}-${Math.floor(1001 + (StorageService.getReceipts().length))}`);
  const [template, setTemplate] = useState<TemplateId>('modern-emerald');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [status, setStatus] = useState<'Paid' | 'Due'>('Paid');
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState(5);
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('Thank you for shopping with us! Warranty valid with this verified receipt.');

  const [items, setItems] = useState<ReceiptItem[]>([
    { id: 1, desc: '', qty: 1, price: 0 },
  ]);

  useEffect(() => {
    setMounted(true);
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
    setCustomers(StorageService.getCustomers());
  }, []);

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

  const totals = calcTotals(items, taxRate, enableTax, discount, enableDiscount);

  const handleItemChange = (idx: number, field: 'desc' | 'qty' | 'price', val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        desc: '',
        descBn: '',
        qty: 1,
        price: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleCustomerSelect = (custId: string) => {
    const c = customers.find((cust) => cust.id === custId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
    }
  };

  const handleSave = () => {
    const newReceipt: Receipt = {
      id: receiptNo,
      receiptNo,
      token: 'sd_' + Math.random().toString(36).substring(2, 10),
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '+880 1711-000000',
      paymentMethod,
      status,
      template,
      taxRate: enableTax ? taxRate : 0,
      enableTax,
      discount: enableDiscount ? discount : 0,
      enableDiscount,
      items,
      total: totals.total,
      notes,
    };

    StorageService.saveReceipt(newReceipt);
    setSavedReceipt(newReceipt);
  };

  const currentDraftReceipt: Receipt = {
    id: receiptNo,
    receiptNo,
    token: 'sd_9f8a2c4e',
    date: '27 Nov 2026',
    customerName,
    customerPhone,
    paymentMethod,
    status,
    template,
    taxRate,
    enableTax,
    discount,
    enableDiscount,
    items,
    total: totals.total,
    notes,
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F1F5F9]"></div>;
  }

  // Edit Panel
  const editPanel = (
    <div className="space-y-4">
      {/* Template Selector Cards */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Select Template
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            5 Styled Vouchers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'modern-emerald', label: 'Modern Emerald', desc: 'Gradient #059669' },
            { id: 'bangla-memo', label: 'বাংলা মেমো', desc: 'Traditional BD' },
            { id: 'classic-formal', label: 'Classic Formal', desc: 'Double Border' },
            { id: 'clean-minimalist', label: 'Clean Minimal', desc: 'Swiss Layout' },
            { id: 'thermal-pos', label: '58mm POS', desc: 'Roll Print' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id as TemplateId)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                template === t.id
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <span className={`block text-xs font-bold ${template === t.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                {t.label}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Customer Information
          </span>
          <select
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
          >
            <option value="">+ Pick Existing Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={customerName}
            suppressHydrationWarning
            placeholder="Customer Name"
            onChange={(e) => setCustomerName(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={customerPhone}
            suppressHydrationWarning
            placeholder="+880 1XXX-XXXXXX"
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Line Items List */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Line Items ({items.length})
          </span>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>+ Add Item</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.desc}
                  suppressHydrationWarning
                  placeholder="Item description..."
                  onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500">Qty</span>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    suppressHydrationWarning
                    onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value) || 1)}
                    className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    suppressHydrationWarning
                    onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax & Discount Toggles */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enableTax}
              onChange={(e) => setEnableTax(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Enable VAT / Tax (%)</span>
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={taxRate}
            disabled={!enableTax}
            suppressHydrationWarning
            onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
            className="w-20 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-right font-mono disabled:opacity-40"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enableDiscount}
              onChange={(e) => setEnableDiscount(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Enable Discount (৳)</span>
          </label>
          <input
            type="number"
            min="0"
            value={discount}
            disabled={!enableDiscount}
            suppressHydrationWarning
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            className="w-24 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-right font-mono disabled:opacity-40"
          />
        </div>
      </div>

      {/* Payment Method Chips */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft space-y-2.5">
        <span className="block text-xs font-bold text-slate-700">Payment Method</span>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'bKash', activeCls: 'border-[#E2136E] bg-[#E2136E] text-white' },
            { name: 'Nagad', activeCls: 'border-[#F7941D] bg-[#F7941D] text-white' },
            { name: 'Rocket', activeCls: 'border-[#8C3494] bg-[#8C3494] text-white' },
            { name: 'Cash', activeCls: 'border-emerald-600 bg-emerald-600 text-white' },
            { name: 'Bank', activeCls: 'border-slate-800 bg-slate-800 text-white' },
          ].map((pm) => {
            const isSel = paymentMethod === pm.name;
            return (
              <button
                key={pm.name}
                type="button"
                onClick={() => setPaymentMethod(pm.name as PaymentMethod)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                  isSel ? pm.activeCls : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pm.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issue Receipt CTA Button */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm shadow-elevated flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
      >
        <span>Issue Receipt · {formatCurrency(totals.total, false)}</span>
      </button>
    </div>
  );

  // Live Preview Panel
  const previewPanel = (
    <div className="space-y-3">
      {template === 'thermal-pos' && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setThermalWidth('58mm')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              thermalWidth === '58mm' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            58mm Roll
          </button>
          <button
            onClick={() => setThermalWidth('80mm')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              thermalWidth === '80mm' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            80mm Roll
          </button>
        </div>
      )}

      <div id="printable-receipt-area">
        <ReceiptPreview
          receipt={currentDraftReceipt}
          business={currentBiz}
          templateId={template}
          thermalWidth={thermalWidth}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-[1440px] mx-auto p-4 sm:p-6 space-y-4">
        {/* Mobile Segmented Control: [Edit Details] vs [Live Preview] */}
        <div className="lg:hidden bg-slate-200/80 p-1 rounded-xl grid grid-cols-2 gap-1">
          <button
            onClick={() => setMobileTab('edit')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Edit Details
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Live Preview
          </button>
        </div>

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`lg:col-span-6 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            {editPanel}
          </div>
          <div className={`lg:col-span-6 lg:sticky lg:top-20 ${mobileTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
            {previewPanel}
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

      {savedReceipt && (
        <ShareModal
          receipt={savedReceipt}
          business={currentBiz}
          isOpen={true}
          onClose={() => {
            setSavedReceipt(null);
            router.push('/');
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
