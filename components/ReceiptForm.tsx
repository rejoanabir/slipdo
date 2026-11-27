'use client';

import React, { useState } from 'react';
import { Business, Customer, Receipt, ReceiptItem, TemplateId, PaymentMethod, PaymentStatus, Currency } from '../lib/types';
import { generateSecureToken } from '../lib/format';
import { PlusIcon, Trash2Icon, CheckCircleIcon } from './Icons';

interface ReceiptFormProps {
  business: Business;
  customers: Customer[];
  initialReceipt?: Receipt;
  onReceiptChange: (receipt: Receipt) => void;
  onSave: (receipt: Receipt) => void;
  lang?: 'en' | 'bn';
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({
  business,
  customers,
  initialReceipt,
  onReceiptChange,
  onSave,
  lang = 'en',
}) => {
  const [currency, setCurrency] = useState<Currency>(initialReceipt?.currency || business.currency || 'BDT');
  const [customerName, setCustomerName] = useState(initialReceipt?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialReceipt?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(initialReceipt?.customerEmail || '');
  const [customerAddress, setCustomerAddress] = useState(initialReceipt?.customerAddress || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialReceipt?.customerId || '');

  const [issueDate, setIssueDate] = useState(
    initialReceipt?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialReceipt?.paymentMethod || 'bKash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialReceipt?.paymentStatus || 'Paid');
  const [transactionId, setTransactionId] = useState(initialReceipt?.transactionId || '');
  const [templateId, setTemplateId] = useState<TemplateId>(initialReceipt?.templateId || 'modern-emerald');

  const [items, setItems] = useState<ReceiptItem[]>(
    initialReceipt?.items || [
      {
        id: 'item-1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: business.defaultTaxRate || 0,
        lineTotal: 0,
      },
    ]
  );

  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>(
    initialReceipt?.discountType || 'flat'
  );
  const [discountValue, setDiscountValue] = useState<number>(initialReceipt?.discountValue || 0);
  const [shippingFee, setShippingFee] = useState<number>(initialReceipt?.shippingFee || 0);
  const [notes, setNotes] = useState(initialReceipt?.notes || business.defaultNotes || '');
  const [terms, setTerms] = useState(initialReceipt?.terms || '');

  // Calculate live totals
  const calculateTotals = (
    currentItems: ReceiptItem[],
    discType: 'flat' | 'percentage',
    discVal: number,
    shipFee: number
  ) => {
    const subtotal = currentItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
    const taxTotal = currentItems.reduce(
      (acc, it) => acc + (it.lineTotal * (it.taxRate || 0)) / 100,
      0
    );

    let discountAmount = 0;
    if (discType === 'flat') {
      discountAmount = Math.min(discVal, subtotal);
    } else {
      discountAmount = (subtotal * discVal) / 100;
    }

    const total = Math.max(0, subtotal - discountAmount + taxTotal + shipFee);

    return {
      subtotal,
      taxTotal,
      discountAmount,
      total,
      amountPaid: paymentStatus === 'Paid' ? total : 0,
      amountDue: paymentStatus === 'Paid' ? 0 : total,
    };
  };

  const notifyChange = (updatedData: Partial<Receipt>) => {
    const calc = calculateTotals(
      updatedData.items || items,
      updatedData.discountType || discountType,
      updatedData.discountValue !== undefined ? updatedData.discountValue : discountValue,
      updatedData.shippingFee !== undefined ? updatedData.shippingFee : shippingFee
    );

    const year = new Date().getFullYear();
    const receiptNumber =
      initialReceipt?.number ||
      `${business.receiptPrefix || 'RCP'}-${year}-${String(business.nextNumber || 1).padStart(4, '0')}`;

    const updated: Receipt = {
      id: initialReceipt?.id || 'rcp-' + Date.now(),
      businessId: business.id,
      customerId: selectedCustomerId,
      customerName: updatedData.customerName !== undefined ? updatedData.customerName : customerName,
      customerPhone: updatedData.customerPhone !== undefined ? updatedData.customerPhone : customerPhone,
      customerEmail: updatedData.customerEmail !== undefined ? updatedData.customerEmail : customerEmail,
      customerAddress: updatedData.customerAddress !== undefined ? updatedData.customerAddress : customerAddress,
      number: receiptNumber,
      issueDate: updatedData.issueDate || issueDate,
      currency: updatedData.currency || currency,
      currencySymbol: currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : '৳',
      items: updatedData.items || items,
      subtotal: calc.subtotal,
      discountType: updatedData.discountType || discountType,
      discountValue: updatedData.discountValue !== undefined ? updatedData.discountValue : discountValue,
      discountAmount: calc.discountAmount,
      shippingFee: updatedData.shippingFee !== undefined ? updatedData.shippingFee : shippingFee,
      taxTotal: calc.taxTotal,
      total: calc.total,
      paymentMethod: updatedData.paymentMethod || paymentMethod,
      paymentStatus: updatedData.paymentStatus || paymentStatus,
      amountPaid: calc.amountPaid,
      amountDue: calc.amountDue,
      transactionId: updatedData.transactionId !== undefined ? updatedData.transactionId : transactionId,
      templateId: updatedData.templateId || templateId,
      notes: updatedData.notes !== undefined ? updatedData.notes : notes,
      terms: updatedData.terms !== undefined ? updatedData.terms : terms,
      publicToken: initialReceipt?.publicToken || generateSecureToken('sd_'),
      createdAt: initialReceipt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onReceiptChange(updated);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) return;
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || '');
      setCustomerEmail(cust.email || '');
      setCustomerAddress(cust.address || '');
      notifyChange({
        customerName: cust.name,
        customerPhone: cust.phone || '',
        customerEmail: cust.email || '',
        customerAddress: cust.address || '',
      });
    }
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) || 0 : item.quantity;
      const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
      item.lineTotal = q * p;
    }

    updated[index] = item;
    setItems(updated);
    notifyChange({ items: updated });
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: 'item-' + Date.now(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: business.defaultTaxRate || 0,
      lineTotal: 0,
    };
    const updated = [...items, newItem];
    setItems(updated);
    notifyChange({ items: updated });
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    notifyChange({ items: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calc = calculateTotals(items, discountType, discountValue, shippingFee);
    const year = new Date().getFullYear();
    const receiptNumber =
      initialReceipt?.number ||
      `${business.receiptPrefix || 'RCP'}-${year}-${String(business.nextNumber || 1).padStart(4, '0')}`;

    const receipt: Receipt = {
      id: initialReceipt?.id || 'rcp-' + Date.now(),
      businessId: business.id,
      customerId: selectedCustomerId,
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      customerAddress: customerAddress.trim(),
      number: receiptNumber,
      issueDate,
      currency,
      currencySymbol: currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : '৳',
      items: items.filter((it) => it.description.trim() !== '' || it.lineTotal > 0),
      subtotal: calc.subtotal,
      discountType,
      discountValue,
      discountAmount: calc.discountAmount,
      shippingFee,
      taxTotal: calc.taxTotal,
      total: calc.total,
      paymentMethod,
      paymentStatus,
      amountPaid: calc.amountPaid,
      amountDue: calc.amountDue,
      transactionId,
      templateId,
      notes,
      terms,
      publicToken: initialReceipt?.publicToken || generateSecureToken('sd_'),
      createdAt: initialReceipt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(receipt);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Header & Template Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              {lang === 'bn' ? 'ডিজাইন টেমপ্লেট নির্বাচন' : 'Receipt Design Template'}
            </h2>
            <p className="text-xs text-neutral-500">
              {lang === 'bn' ? 'পছন্দমতো প্রিমিয়াম লেআউট বেছে নিন' : 'Choose a layout tailored for your brand'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-neutral-600">Currency:</label>
            <select
              value={currency}
              onChange={(e) => {
                const c = e.target.value as Currency;
                setCurrency(c);
                notifyChange({ currency: c });
              }}
              className="text-xs bg-neutral-100 border border-neutral-300 rounded-lg px-2.5 py-1.5 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="BDT">BDT (৳ Taka)</option>
              <option value="USD">USD ($ Dollar)</option>
              <option value="EUR">EUR (€ Euro)</option>
              <option value="INR">INR (₹ Rupee)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'modern-emerald', label: 'Modern Emerald', desc: 'SaaS / Clean Card' },
            { id: 'bangla-first', label: 'বাংলা মেমো', desc: 'Traditional BD Voucher' },
            { id: 'classic-formal', label: 'Classic Formal', desc: 'Official Dual Border' },
            { id: 'clean-minimal', label: 'Clean Minimal', desc: 'Swiss Minimalist' },
            { id: 'thermal-pos', label: '58mm POS', desc: 'Thermal Slip Roll' },
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => {
                setTemplateId(t.id as TemplateId);
                notifyChange({ templateId: t.id as TemplateId });
              }}
              className={`p-2.5 rounded-xl border text-left transition ${
                templateId === t.id
                  ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <span className={`block text-xs font-bold ${templateId === t.id ? 'text-emerald-900' : 'text-neutral-800'}`}>
                {t.label}
              </span>
              <span className="block text-[10px] text-neutral-500 truncate">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Customer & Date Meta */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900">
            {lang === 'bn' ? 'গ্রাহকের তথ্য ও তারিখ' : 'Customer & Invoice Details'}
          </h2>
          {customers.length > 0 && (
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1 font-medium outline-none"
            >
              <option value="">+ Existing Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {lang === 'bn' ? 'গ্রাহকের নাম *' : 'Customer Name *'}
            </label>
            <input
              type="text"
              required
              value={customerName}
              placeholder="e.g. Tanvir Hossain / ক্রেতার নাম"
              onChange={(e) => {
                setCustomerName(e.target.value);
                notifyChange({ customerName: e.target.value });
              }}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {lang === 'bn' ? 'ফোন নম্বর' : 'Phone / WhatsApp'}
            </label>
            <input
              type="text"
              value={customerPhone}
              placeholder="+880 17XX-XXXXXX"
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                notifyChange({ customerPhone: e.target.value });
              }}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {lang === 'bn' ? 'ইস্যুর তারিখ' : 'Issue Date'}
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => {
                setIssueDate(e.target.value);
                notifyChange({ issueDate: e.target.value });
              }}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {lang === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Customer Email'}
            </label>
            <input
              type="email"
              value={customerEmail}
              placeholder="customer@example.com"
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                notifyChange({ customerEmail: e.target.value });
              }}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Line Items Section */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900">
            {lang === 'bn' ? 'আইটেম ও সেবার তালিকা' : 'Line Items'}
          </h2>
          <span className="text-xs text-neutral-500">{items.length} items</span>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/80 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center text-xs font-bold text-neutral-400">{idx + 1}</span>
                <input
                  type="text"
                  required
                  placeholder="Item description / পণ্যের বিবরণ..."
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="flex-1 text-sm bg-white border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-30 transition"
                  title="Remove Item"
                >
                  <Trash2Icon size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pl-7">
                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase">Qty</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase">Line Total</label>
                  <div className="text-xs bg-neutral-100 border border-neutral-200 rounded-lg px-2.5 py-1.5 font-bold text-neutral-800 truncate">
                    {item.lineTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-dashed border-emerald-300 flex items-center justify-center gap-1.5 transition"
        >
          <PlusIcon size={16} />
          <span>{lang === 'bn' ? '+ নতুন আইটেম যোগ করুন' : '+ Add Line Item'}</span>
        </button>
      </div>

      {/* 4. Payment & Discount Adjustments */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
          {lang === 'bn' ? 'পেমেন্ট ও ডিসকাউন্ট' : 'Payment Method & Adjustments'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {lang === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'bKash', color: 'border-pink-200 hover:border-pink-400 text-pink-700' },
                { name: 'Nagad', color: 'border-amber-200 hover:border-amber-400 text-amber-700' },
                { name: 'Rocket', color: 'border-purple-200 hover:border-purple-400 text-purple-700' },
                { name: 'Cash', color: 'border-emerald-200 hover:border-emerald-400 text-emerald-700' },
                { name: 'Bank Card', color: 'border-blue-200 hover:border-blue-400 text-blue-700' },
                { name: 'Bank Transfer', color: 'border-neutral-300 text-neutral-700' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.name}
                  onClick={() => {
                    setPaymentMethod(m.name as PaymentMethod);
                    notifyChange({ paymentMethod: m.name as PaymentMethod });
                  }}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                    paymentMethod === m.name
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : `bg-neutral-50 ${m.color}`
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {lang === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
            </label>
            <div className="flex gap-2">
              {(['Paid', 'Partial', 'Unpaid'] as PaymentStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => {
                    setPaymentStatus(st);
                    notifyChange({ paymentStatus: st });
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                    paymentStatus === st
                      ? st === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : st === 'Partial'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-neutral-600 border-neutral-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="block text-xs text-neutral-600 mb-1">Transaction ID / TrxID</label>
              <input
                type="text"
                placeholder="e.g. BK-9X882A / TrxID"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  notifyChange({ transactionId: e.target.value });
                }}
                className="w-full text-xs font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Discount & Shipping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-neutral-700">Discount</label>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('flat');
                    notifyChange({ discountType: 'flat' });
                  }}
                  className={`px-2 py-0.5 rounded ${discountType === 'flat' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-500'}`}
                >
                  Flat (৳)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('percentage');
                    notifyChange({ discountType: 'percentage' });
                  }}
                  className={`px-2 py-0.5 rounded ${discountType === 'percentage' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-500'}`}
                >
                  %
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              value={discountValue}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setDiscountValue(val);
                notifyChange({ discountValue: val });
              }}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-1.5 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Delivery / Shipping Charge
            </label>
            <input
              type="number"
              min="0"
              value={shippingFee}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setShippingFee(val);
                notifyChange({ shippingFee: val });
              }}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-1.5 outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {lang === 'bn' ? 'বিশেষ দ্রষ্টব্য / মন্তব্য' : 'Remarks / Warranty / Policy'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              notifyChange({ notes: e.target.value });
            }}
            placeholder="Warranty valid for 1 year... / ধন্যবাদ আবার আসবেন।"
            className="w-full text-xs border border-neutral-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
      >
        <CheckCircleIcon size={20} />
        <span>{lang === 'bn' ? 'রশিদ সংরক্ষণ ও প্রিভিউ দেখুন' : 'Save & View Generated Receipt'}</span>
      </button>
    </form>
  );
};
