'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business, Customer, Receipt, ReceiptItem, TemplateId, PaymentMethod } from '../../lib/types';
import { formatCurrency, calcTotals, generateSecureToken } from '../../lib/format';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { ShareModal } from '../../components/ShareModal';
import { CountryCodeSelect } from '../../components/CountryCodeSelect';
import { XIcon, SparklesIcon } from '../../components/Icons';

export default function ReceiptCreatorPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Creator Tab on Mobile: 'edit' or 'preview'
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>('58mm');

  // Receipt Draft State
  const [receiptNo, setReceiptNo] = useState(`SD-${new Date().getFullYear()}-${Math.floor(1001 + (StorageService.getReceipts().length))}`);
  const [template, setTemplate] = useState<TemplateId>('modern-emerald');
  const [customerName, setCustomerName] = useState('');
  const [customerCountryCode, setCustomerCountryCode] = useState('BD');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [status, setStatus] = useState<'Paid' | 'Due'>('Paid');
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState(5);
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('Thank you for shopping with us! Warranty valid with this verified receipt.');
  const [trxId, setTrxId] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [items, setItems] = useState<ReceiptItem[]>([
    { id: 1, desc: '', qty: 1, price: 0 },
  ]);

  useEffect(() => {
    setMounted(true);
    const session = supabase.getSession();
    const authUser = StorageService.getAuthUser();
    if (!session && !authUser) {
      router.replace('/login');
      return;
    }
    setIsAuthenticated(true);
    const bList = StorageService.getBusinesses();
    const active = StorageService.getActiveBusiness();
    setBusinesses(bList);
    setActiveBiz(active);
    setCustomers(StorageService.getCustomers());

    // If active business has custom template configured, default to it
    if (active?.customTemplate) {
      setTemplate('custom-template');
    }

    // Sync cloud businesses to ensure uploaded logo and custom templates are fresh
    if (session?.user?.id) {
      const uid = session.user.id;
      supabaseDb.getBusinesses(uid).then((cloudBiz) => {
        if (cloudBiz && cloudBiz.length > 0) {
          StorageService.setCloudBusinesses(uid, cloudBiz);
          setBusinesses(cloudBiz);
          const current = StorageService.getActiveBusiness();
          setActiveBiz(current || cloudBiz[0]);
          if ((current || cloudBiz[0])?.customTemplate) {
            setTemplate('custom-template');
          }
        }
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

  const totals = calcTotals(items, taxRate, enableTax, discount, enableDiscount, deliveryFee);

  const handleItemChange = (idx: number, field: 'desc' | 'qty' | 'price', val: any) => {
    const updated = [...items];
    let sanitizedVal = val;
    if (field === 'price') {
      sanitizedVal = Math.max(0, parseFloat(val) || 0);
    } else if (field === 'qty') {
      sanitizedVal = Math.max(1, Math.min(999999, Math.floor(Number(val)) || 1));
    }
    updated[idx] = { ...updated[idx], [field]: sanitizedVal };
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
      const raw = c.phone || '';
      if (raw.startsWith('+880')) {
        setCustomerCountryCode('BD');
        setCustomerPhone(raw.replace('+880', '').trim());
      } else {
        setCustomerPhone(raw);
      }
    }
  };

  // Build full customer phone
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
  const codePrefix = prefixMap[customerCountryCode] || '+880';
  const cleanNum = customerPhone.replace(/^[+\d\s-]+/, (m) => (m.startsWith('+') ? '' : m)).trim();
  const formattedCustomerPhone = cleanNum ? `${codePrefix} ${cleanNum}` : (customerPhone || '+880 1711-000000');

  const handleSave = () => {
    // Validate line items
    const validItems = items.filter(
      (it) => it.desc.trim() !== '' || (Number(it.price) > 0 && Number(it.qty) > 0)
    );
    if (validItems.length === 0) {
      showToast('Please add at least one line item with a name or price', 'error');
      return;
    }

    if (totals.total <= 0) {
      showToast('Receipt total cannot be 0. Please specify item prices.', 'error');
      return;
    }

    const newReceipt: Receipt = {
      id: receiptNo,
      receiptNo,
      token: generateSecureToken('sd_'),
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: customerName || 'Valued Customer',
      customerPhone: formattedCustomerPhone,
      paymentMethod,
      status,
      template,
      taxRate: enableTax ? taxRate : 0,
      enableTax,
      discount: enableDiscount ? discount : 0,
      enableDiscount,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      trxId: trxId.trim() || undefined,
      items,
      total: totals.total,
      notes,
      logoUrl: currentBiz.logoUrl,
      signatureUrl: currentBiz.signatureUrl,
      customTemplate: currentBiz.customTemplate,
    };

    StorageService.saveReceipt(newReceipt);
    setSavedReceipt(newReceipt);

    // Sync to Supabase cloud if merchant is authenticated
    const session = supabase.getSession();
    if (session?.user?.id) {
      supabaseDb.saveReceipt(newReceipt, session.user.id, currentBiz.id).catch(console.error);
    }
  };

  const currentDraftReceipt: Receipt = {
    id: receiptNo,
    receiptNo,
    token: 'sd_9f8a2c4e',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    customerName: customerName || 'Valued Customer',
    customerPhone: formattedCustomerPhone,
    paymentMethod,
    status,
    template,
    taxRate,
    enableTax,
    discount,
    enableDiscount,
    deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
    trxId: trxId.trim() || undefined,
    items,
    total: totals.total,
    notes,
    logoUrl: currentBiz.logoUrl,
    signatureUrl: currentBiz.signatureUrl,
    customTemplate: currentBiz.customTemplate,
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Edit Panel
  const editPanel = (
    <div className="space-y-4">
      {/* Template Selector Cards */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Select Template
          </span>
          <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
            6 Layout Options
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'custom-template', label: 'Custom Studio', desc: 'Your Brand Theme', isHighlight: true },
            { id: 'modern-emerald', label: 'Modern Emerald', desc: 'Vibrant Gradient' },
            { id: 'bangla-memo', label: 'বাংলা মেমো', desc: 'Traditional BD' },
            { id: 'classic-formal', label: 'Classic Formal', desc: 'Double Border' },
            { id: 'clean-minimalist', label: 'Clean Minimal', desc: 'Swiss Layout' },
            { id: 'thermal-pos', label: '58mm POS', desc: 'Roll Print' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id as TemplateId)}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                template === t.id
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`block text-xs font-bold ${template === t.id ? 'text-blue-900' : 'text-slate-800'}`}>
                  {t.label}
                </span>
                {t.isHighlight && (
                  <SparklesIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
              </div>
              <span className="block text-[10px] text-slate-400 truncate mt-0.5">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Customer Information
          </span>
          <select
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-slate-700 outline-none"
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
            placeholder="Customer Full Name"
            onChange={(e) => setCustomerName(e.target.value)}
            className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
          />

          <div className="flex items-center gap-1.5">
            <CountryCodeSelect
              value={customerCountryCode}
              onChange={setCustomerCountryCode}
              className="w-32 shrink-0"
            />
            <input
              type="tel"
              value={customerPhone}
              suppressHydrationWarning
              placeholder="1711-000000"
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>
      </div>

      {/* Line Items List */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Line Items ({items.length})
          </span>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>+ Add Item</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.desc}
                  suppressHydrationWarning
                  placeholder="Item description / Product name..."
                  onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500">Qty</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={item.qty === 0 ? '' : item.qty}
                    onFocus={(e) => e.target.select()}
                    suppressHydrationWarning
                    onChange={(e) => {
                      const val = e.target.value;
                      handleItemChange(idx, 'qty', val === '' ? 0 : parseInt(val, 10) || 1);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500">{currentBiz.currencySymbol || '৳'}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.price === 0 ? '' : item.price}
                    onFocus={(e) => e.target.select()}
                    suppressHydrationWarning
                    onChange={(e) => {
                      const val = e.target.value;
                      handleItemChange(idx, 'price', val === '' ? 0 : parseFloat(val) || 0);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax & Discount Toggles */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enableTax}
              onChange={(e) => setEnableTax(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
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
            onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="w-20 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-right font-mono disabled:opacity-40"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enableDiscount}
              onChange={(e) => setEnableDiscount(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Enable Discount ({currentBiz.currencySymbol || '৳'})</span>
          </label>
          <input
            type="number"
            min="0"
            value={discount === 0 ? '' : discount}
            placeholder="0"
            disabled={!enableDiscount}
            onFocus={(e) => e.target.select()}
            suppressHydrationWarning
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            className="w-24 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-right font-mono disabled:opacity-40"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700">Delivery Charge ({currentBiz.currencySymbol || '৳'})</span>
          <input
            type="number"
            min="0"
            value={deliveryFee || ''}
            placeholder="0"
            suppressHydrationWarning
            onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
            className="w-24 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-right font-mono"
          />
        </div>
      </div>

      {/* Payment Method Chips */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
        <span className="block text-xs font-bold text-slate-700">Payment Method</span>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'bKash', activeCls: 'border-[#E2136E] bg-[#E2136E] text-white shadow-xs' },
            { name: 'Nagad', activeCls: 'border-[#F7941D] bg-[#F7941D] text-white shadow-xs' },
            { name: 'Rocket', activeCls: 'border-[#8C3494] bg-[#8C3494] text-white shadow-xs' },
            { name: 'Cash', activeCls: 'border-blue-600 bg-blue-600 text-white shadow-xs' },
            { name: 'Bank', activeCls: 'border-slate-800 bg-slate-800 text-white shadow-xs' },
          ].map((pm) => {
            const isSel = paymentMethod === pm.name;
            return (
              <button
                key={pm.name}
                type="button"
                onClick={() => setPaymentMethod(pm.name as PaymentMethod)}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                  isSel ? pm.activeCls : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pm.name}
              </button>
            );
          })}
        </div>

        {/* Transaction ID for digital / mobile wallet payments */}
        {['bKash', 'Nagad', 'Rocket', 'Bank'].includes(paymentMethod) && (
          <div className="pt-1 animate-fade-in">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Transaction ID / TrxID (Optional)
            </label>
            <input
              type="text"
              value={trxId}
              suppressHydrationWarning
              placeholder="e.g. BKS9X84K2M"
              onChange={(e) => setTrxId(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Notes & Warranty Terms */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Remarks & Warranty Terms</span>
          <span className="text-[10px] text-slate-400">Printed on receipt</span>
        </div>
        <textarea
          rows={2}
          value={notes}
          suppressHydrationWarning
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Thank you for your business! Warranty terms..."
          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
        />
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {[
            '7-day replacement warranty.',
            'Official service warranty applies.',
            'Keep verified receipt for claim.',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setNotes(notes ? `${notes} ${preset}` : preset)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-semibold text-slate-600 transition-colors"
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Issue Receipt CTA Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={totals.total <= 0}
        className="w-full py-4 px-5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
      >
        <span>Issue Verified Receipt</span>
        <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-xs font-mono">{formatCurrency(totals.total, false)}</span>
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
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              thermalWidth === '58mm' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            58mm Roll
          </button>
          <button
            onClick={() => setThermalWidth('80mm')}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              thermalWidth === '80mm' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            80mm Roll
          </button>
        </div>
      )}

      <div className="print:hidden">
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-10 font-sans">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full animate-fade-in shadow-2xl px-3">
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-3 backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <p className="flex-1 leading-snug">{toast.msg}</p>
            <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 p-0.5">
              ×
            </button>
          </div>
        </div>
      )}

      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-[1440px] mx-auto p-4 sm:p-6 pb-28 sm:pb-8 space-y-4">
        {/* Mobile Segmented Control: [Edit Details] vs [Live Preview] */}
        <div className="lg:hidden bg-slate-200/80 p-1 rounded-full grid grid-cols-2 gap-1">
          <button
            onClick={() => setMobileTab('edit')}
            className={`py-2 rounded-full text-xs font-bold transition-all ${
              mobileTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Edit Details
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`py-2 rounded-full text-xs font-bold transition-all ${
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
          <div className={`lg:col-span-6 lg:sticky lg:top-20 ${mobileTab === 'edit' ? 'hidden lg:block print:block' : 'block'}`}>
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
        onAddBusiness={(newBiz) => {
          const updated = [...businesses, newBiz];
          setBusinesses(updated);
          setActiveBiz(newBiz);
          StorageService.saveBusiness(newBiz);
          StorageService.setActiveBusiness(newBiz.id);
        }}
        onDeleteBusiness={(bizId) => {
          StorageService.deleteBusiness(bizId);
          const remaining = StorageService.getBusinesses();
          setBusinesses(remaining);
          const current = StorageService.getActiveBusiness();
          setActiveBiz(current);
          showToast('Store outlet removed');
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
