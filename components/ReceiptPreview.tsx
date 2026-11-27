'use client';

import React from 'react';
import { Business, Receipt, TemplateId, CustomTemplateConfig } from '../lib/types';
import { formatCurrency, toBengaliDigits, numberToWordsEn, numberToWordsBn } from '../lib/format';
import { QRCodeSVG } from './QRCodeSVG';
import { SlipDoLogo } from './SlipDoLogo';

interface ReceiptPreviewProps {
  receipt: Receipt;
  business: Business;
  templateId?: TemplateId;
  thermalWidth?: '58mm' | '80mm';
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  receipt,
  business,
  templateId = receipt.template || 'modern-emerald',
  thermalWidth = '58mm',
}) => {
  const items = receipt.items || [];
  const taxRate = receipt.taxRate || 0;
  const enableTax = receipt.enableTax ?? (taxRate > 0);
  const discount = receipt.discount || 0;
  const enableDiscount = receipt.enableDiscount ?? (discount > 0);

  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
  const taxAmount = enableTax && taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
  const discountAmount = enableDiscount && discount > 0 ? Math.min(discount, subtotal + taxAmount) : 0;
  const deliveryAmount = Number(receipt.deliveryFee) || 0;
  const total = Math.max(0, subtotal + taxAmount - discountAmount + deliveryAmount);
  const token = receipt.token || 'sd_9f8a2c4e';

  // Dynamic QR URL pointing to the live site origin
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://slipdo.vercel.app';
  const qrVerificationUrl = `${origin}/r/${token}`;

  const storeLogo = receipt.logoUrl || business.logoUrl;
  const signature = receipt.signatureUrl || business.signatureUrl;

  // Helper for Payment Badge
  const renderPaymentBadge = (method: string) => {
    switch (method) {
      case 'bKash':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2136E]/10 text-[#E2136E] border border-[#E2136E]/20">bKash</span>;
      case 'Nagad':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7941D]/10 text-[#F7941D] border border-[#F7941D]/20">Nagad</span>;
      case 'Rocket':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8C3494]/10 text-[#8C3494] border border-[#8C3494]/20">Rocket</span>;
      case 'Cash':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">Cash</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">{method}</span>;
    }
  };

  // Helper for rendering Signature block
  const renderSignatureBlock = (label: string = 'Authorized Signatory') => {
    return (
      <div className="flex flex-col items-center text-center">
        {signature ? (
          <img
            src={signature}
            alt="Signature"
            className="h-10 w-auto max-w-[140px] object-contain mb-1"
          />
        ) : (
          <div className="h-8"></div>
        )}
        <span className="inline-block w-32 border-t border-slate-800/80 pt-1 text-[10px] uppercase tracking-wider font-semibold text-slate-600">
          {label}
        </span>
      </div>
    );
  };

  // ================= 1. CUSTOM TEMPLATE BUILDER RENDERER =================
  if (templateId === 'custom-template') {
    const custom: CustomTemplateConfig = receipt.customTemplate || business.customTemplate || {
      name: 'My Store Custom',
      primaryColor: '#2563eb',
      headerLayout: 'split',
      showLogo: true,
      showPhone: true,
      showAddress: true,
      showBin: true,
      showQrCode: true,
      showSignature: true,
      showPaymentBadge: true,
      customFooterNotes: 'Thank you for your business! Please keep this slip for your records.',
      fontFamily: 'sans',
      borderStyle: 'solid',
    };

    const primary = custom.primaryColor || '#2563eb';
    const fontCls = custom.fontFamily === 'mono' ? 'font-mono' : custom.fontFamily === 'serif' ? 'font-serif' : custom.fontFamily === 'bengali' ? 'font-bn' : 'font-sans';

    return (
      <div
        className={`receipt-paper bg-white rounded-2xl shadow-soft p-6 sm:p-7 text-slate-900 border ${
          custom.borderStyle === 'dashed' ? 'border-dashed border-2' : custom.borderStyle === 'none' ? 'border-0' : 'border'
        } border-slate-200 ${fontCls}`}
      >
        {/* Header Layout */}
        {custom.headerLayout === 'centered' ? (
          <div className="text-center pb-5 mb-5 border-b border-slate-100">
            {custom.showLogo && storeLogo && (
              <img src={storeLogo} alt={business.name} className="h-12 w-auto max-w-[160px] object-contain mx-auto mb-2 rounded-xl" />
            )}
            <h3 className="font-extrabold text-xl tracking-tight" style={{ color: primary }}>{business.name}</h3>
            <p className="text-xs text-slate-500 font-medium">{business.category}</p>
            {custom.showAddress && <p className="text-[11px] text-slate-500 mt-1">{business.address}</p>}
            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 mt-1">
              {custom.showPhone && <span>Tel: {business.phone}</span>}
              {custom.showBin && business.bin && <span>BIN: {business.bin}</span>}
            </div>
            <div className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-mono font-bold" style={{ backgroundColor: `${primary}15`, color: primary }}>
              Invoice #{receipt.receiptNo || receipt.id} · {receipt.date || '27 Nov 2026'}
            </div>
          </div>
        ) : custom.headerLayout === 'minimal' ? (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {custom.showLogo && storeLogo && (
                <img src={storeLogo} alt={business.name} className="h-9 w-auto max-w-[120px] object-contain rounded-lg" />
              )}
              <div>
                <h3 className="font-bold text-lg" style={{ color: primary }}>{business.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">#{receipt.receiptNo || receipt.id}</p>
              </div>
            </div>
            <div className="text-right text-xs font-medium text-slate-500">
              <p>{receipt.date || '27 Nov 2026'}</p>
            </div>
          </div>
        ) : (
          /* Split Layout (Default) */
          <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              {custom.showLogo && storeLogo && (
                <img src={storeLogo} alt={business.name} className="h-12 w-auto max-w-[140px] object-contain rounded-xl p-1 border border-slate-100 bg-white" />
              )}
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">{business.name}</h3>
                <p className="text-xs font-semibold" style={{ color: primary }}>{business.category}</p>
                {custom.showAddress && <p className="text-[11px] text-slate-500 mt-0.5">{business.address}</p>}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  {custom.showPhone && <span>Tel: {business.phone}</span>}
                  {custom.showBin && business.bin && <span>· BIN: {business.bin}</span>}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Memo / Invoice</span>
              <span className="font-mono font-bold text-sm text-slate-900">#{receipt.receiptNo || receipt.id}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">{receipt.date || '27 Nov 2026'}</span>
            </div>
          </div>
        )}

        {/* Customer & Settlement */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 mb-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Billed To</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{receipt.customerName}</p>
            <p className="text-slate-500 text-[11px] font-mono">{receipt.customerPhone}</p>
          </div>
          {custom.showPaymentBadge && (
            <div className="sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Payment Status</span>
              <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                {renderPaymentBadge(receipt.paymentMethod)}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${receipt.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {receipt.status || 'Paid'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-slate-600 font-semibold" style={{ borderColor: `${primary}30` }}>
                <th className="py-2 px-2 text-left">Item</th>
                <th className="py-2 px-2 text-center w-12">Qty</th>
                <th className="py-2 px-3 text-right w-24">Price</th>
                <th className="py-2 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="py-2.5 px-2">
                    <span className="font-semibold text-slate-900 block">{it.desc}</span>
                    {it.descBn && <span className="text-[11px] text-slate-500 font-bn">{it.descBn}</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600">{it.qty}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(it.price, false)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(it.qty * it.price, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & QR Code */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          {custom.showQrCode ? (
            <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <QRCodeSVG value={qrVerificationUrl} size={64} />
              <div className="text-[11px]">
                <p className="font-bold text-slate-900 flex items-center gap-1">Authentic Record</p>
                <p className="text-slate-500 font-mono text-[10px]">Token: {token}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Scan to verify authenticity</p>
              </div>
            </div>
          ) : <div />}

          <div className="w-full sm:w-56 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal, false)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>VAT ({taxRate}%):</span>
                <span className="font-mono">+{formatCurrency(taxAmount, false)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(discountAmount, false)}</span>
              </div>
            )}
            {deliveryAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-mono">+{formatCurrency(deliveryAmount, false)}</span>
              </div>
            )}
            <div
              className="flex justify-between font-bold text-base pt-2 border-t mt-1"
              style={{ color: primary, borderColor: `${primary}30` }}
            >
              <span>Total Payable:</span>
              <span>{formatCurrency(total, false)}</span>
            </div>
          </div>
        </div>

        {/* Signature & Remarks */}
        <div className="pt-6 mt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-4">
          <div className="text-[11px] text-slate-500 max-w-sm">
            <p className="font-medium">{custom.customFooterNotes || receipt.notes || 'Thank you for your business!'}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Ref: {token}</p>
          </div>
          {custom.showSignature && renderSignatureBlock('Authorized Signatory')}
        </div>
      </div>
    );
  }

  // ================= 2. MODERN EMERALD =================
  if (templateId === 'modern-emerald') {
    return (
      <div className="receipt-paper bg-white rounded-2xl shadow-soft border border-slate-200/90 overflow-hidden text-slate-900 transition-all">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={business.name}
                  className="h-10 w-auto max-w-[130px] object-contain rounded-xl bg-white p-1 shadow-sm shrink-0"
                />
              ) : (
                <SlipDoLogo size={36} />
              )}
              <div>
                <h4 className="font-display font-bold text-base sm:text-lg leading-tight tracking-tight text-white">{business.name}</h4>
                <p className="text-[11px] text-emerald-100/90 mt-0.5">{business.category}</p>
                <p className="text-[10px] text-emerald-200/80 mt-1">{business.address}</p>
                <p className="text-[10px] text-emerald-200/80">BIN: {business.bin} · Tel: {business.phone}</p>
              </div>
            </div>
            <div className="text-right shrink-0 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-200">Receipt No</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-white">#{receipt.receiptNo || receipt.id}</span>
              <span className="block text-[10px] text-emerald-100 mt-0.5">{receipt.date || '27 Nov 2026'}</span>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Customer & Settlement Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Customer Details</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{receipt.customerName}</p>
              <p className="text-slate-500 text-[11px] font-mono">{receipt.customerPhone}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Settlement</span>
              <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                {renderPaymentBadge(receipt.paymentMethod)}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${receipt.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {receipt.status || 'Paid'}
                </span>
              </div>
              {receipt.trxId && (
                <p className="font-mono text-[10px] font-bold text-slate-500 uppercase mt-0.5">TrxID: {receipt.trxId}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 text-left">Item Description</th>
                  <th className="py-2.5 px-2 text-center w-12">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Price</th>
                  <th className="py-2.5 px-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900 block">{it.desc}</span>
                      {it.descBn && <span className="text-[11px] text-slate-600 font-bn">{it.descBn}</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{it.qty}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(it.price, false)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(it.qty * it.price, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & QR Verification Box */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <QRCodeSVG value={qrVerificationUrl} size={64} />
              <div className="text-[11px]">
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <span>Cryptographically Verified</span>
                </p>
                <p className="text-slate-500 font-mono text-[10px]">Token: {token}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Scan with phone camera</p>
              </div>
            </div>

            <div className="w-full sm:w-56 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal, false)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT ({taxRate}%):</span>
                  <span className="font-mono">+{formatCurrency(taxAmount, false)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(discountAmount, false)}</span>
                </div>
              )}
              {deliveryAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge:</span>
                  <span className="font-mono">+{formatCurrency(deliveryAmount, false)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatCurrency(total, false)}</span>
              </div>
            </div>
          </div>

          {/* Signature & Remarks Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-3 text-xs">
            <div className="text-[10px] text-slate-500 text-center sm:text-left">
              <p>{receipt.notes || 'Thank you for shopping with us! Valid with verified SlipDo receipt.'}</p>
              <p className="font-mono text-blue-600 font-medium mt-0.5">{qrVerificationUrl.replace(/^https?:\/\//, '')}</p>
            </div>
            {renderSignatureBlock('Authorized Signatory')}
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. BANGLA FIRST (বাংলা মেমো / ভাউচার) =================
  if (templateId === 'bangla-memo') {
    return (
      <div className="receipt-paper bg-white rounded-2xl border-2 border-emerald-600 p-5 font-bn text-slate-900 shadow-soft">
        <div className="text-center border-b-2 border-emerald-700 pb-3 mb-3">
          {storeLogo && (
            <img src={storeLogo} alt={business.name} className="h-10 w-auto max-w-[130px] object-contain mx-auto mb-1.5 rounded-lg" />
          )}
          <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-1">
            ক্যাশ মেমো / মানি রিসিট
          </span>
          <h3 className="font-bold text-xl text-emerald-950">{business.nameBn || business.name}</h3>
          <p className="text-xs text-slate-600">{business.categoryBn || business.category}</p>
          <p className="text-xs text-slate-600">{business.address}</p>
          <p className="text-xs text-slate-600">মোবাইল: {toBengaliDigits(business.phone)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
          <div><span className="text-slate-600">ভাউচার নং:</span> <strong className="font-mono">{receipt.receiptNo || receipt.id}</strong></div>
          <div className="text-right"><span className="text-slate-600">তারিখ:</span> <strong>{receipt.date || '২৭ নভেম্বর ২০২৬'}</strong></div>
          <div className="col-span-2"><span className="text-slate-600">ক্রেতার নাম:</span> <strong>{receipt.customerName}</strong> ({toBengaliDigits(receipt.customerPhone)})</div>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-400 mb-3">
          <thead>
            <tr className="bg-emerald-800 text-white">
              <th className="border border-slate-400 px-2 py-1.5 text-center w-8">নং</th>
              <th className="border border-slate-400 px-2 py-1.5 text-left">বিবরণ</th>
              <th className="border border-slate-400 px-2 py-1.5 text-center w-12">পরিমাণ</th>
              <th className="border border-slate-400 px-2 py-1.5 text-right w-24">টাকা</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id || idx}>
                <td className="border border-slate-300 px-2 py-1.5 text-center">{toBengaliDigits(idx + 1)}</td>
                <td className="border border-slate-300 px-2 py-1.5">{it.descBn || it.desc}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center">{toBengaliDigits(it.qty)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold">{formatCurrency(it.qty * it.price, true)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {taxAmount > 0 && (
              <tr className="bg-slate-50">
                <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right text-slate-600">ভ্যাট ({toBengaliDigits(taxRate)}%)</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(taxAmount, true)}</td>
              </tr>
            )}
            {discountAmount > 0 && (
              <tr className="bg-slate-50">
                <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right text-emerald-700">ছাড় (ডিসকাউন্ট)</td>
                <td className="border border-slate-300 px-2 py-1 text-right text-emerald-700">- {formatCurrency(discountAmount, true)}</td>
              </tr>
            )}
            {deliveryAmount > 0 && (
              <tr className="bg-slate-50">
                <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right text-slate-600">ডেলিভারি চার্জ</td>
                <td className="border border-slate-300 px-2 py-1 text-right">+{formatCurrency(deliveryAmount, true)}</td>
              </tr>
            )}
            <tr className="bg-emerald-100 font-bold text-emerald-950">
              <td colSpan={3} className="border border-slate-400 px-2 py-1.5 text-right">সর্বমোট (৳)</td>
              <td className="border border-slate-400 px-2 py-1.5 text-right text-sm">{formatCurrency(total, true)}</td>
            </tr>
          </tfoot>
        </table>

        {/* In Words / কথায় */}
        <div className="mt-3 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-900">
          {numberToWordsBn(total)}
        </div>

        <div className="flex items-end justify-between pt-5 mt-2 text-xs">
          <div className="text-center">
            <div className="w-24 border-t border-slate-400 pt-1 text-slate-600">ক্রেতার স্বাক্ষর</div>
          </div>
          <div className="flex items-center gap-1.5">
            <QRCodeSVG value={qrVerificationUrl} size={48} />
          </div>
          {renderSignatureBlock('বিক্রেতার স্বাক্ষর')}
        </div>
      </div>
    );
  }

  // ================= 4. CLASSIC FORMAL =================
  if (templateId === 'classic-formal') {
    return (
      <div className="receipt-paper bg-white p-6 sm:p-7 classic-double-border text-slate-900 shadow-soft rounded-2xl">
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            {storeLogo && (
              <img src={storeLogo} alt={business.name} className="h-11 w-auto max-w-[130px] object-contain rounded-lg" />
            )}
            <div>
              <h4 className="font-serif font-bold text-lg tracking-tight uppercase text-slate-900">{business.name}</h4>
              <p className="text-xs text-slate-600 max-w-[220px]">{business.address}</p>
              <p className="text-xs text-slate-600">BIN: {business.bin} · Tel: {business.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-serif font-bold uppercase tracking-widest border border-slate-800 px-2.5 py-1">Official Invoice</span>
            <p className="font-mono text-xs mt-2 font-semibold">#{receipt.receiptNo || receipt.id}</p>
            <p className="text-xs text-slate-600">{receipt.date || '27 Nov 2026'}</p>
          </div>
        </div>

        <div className="flex justify-between text-xs mb-4">
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-600">Customer:</span>
            <p className="font-semibold">{receipt.customerName}</p>
            <p className="text-slate-600 text-[11px] font-mono">{receipt.customerPhone}</p>
          </div>
          <div className="text-right">
            <span className="font-bold uppercase text-[10px] text-slate-600">Settlement:</span>
            <div className="mt-0.5">{renderPaymentBadge(receipt.paymentMethod)}</div>
          </div>
        </div>

        <table className="w-full text-xs border border-slate-300 mb-4">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="text-left p-2 font-bold">Description</th>
              <th className="text-center p-2 font-bold">Qty</th>
              <th className="text-right p-2 font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((it, idx) => (
              <tr key={it.id || idx}>
                <td className="p-2">{it.desc}</td>
                <td className="p-2 text-center">{it.qty}</td>
                <td className="p-2 text-right font-mono">{formatCurrency(it.qty * it.price, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* In Words */}
        <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
          <strong className="font-bold text-slate-900">In Words:</strong> {numberToWordsEn(total)}
        </div>

        <div className="flex items-end justify-between pt-4">
          <div className="flex items-center gap-2">
            <QRCodeSVG value={qrVerificationUrl} size={50} />
            <div className="text-[10px] text-slate-600">
              <p className="font-semibold text-slate-800">Verified Stamp</p>
              <p className="font-mono text-slate-400">/r/{token}</p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <p className="text-xs text-slate-600">Net Payable: <strong className="text-base text-slate-900 font-mono">{formatCurrency(total, false)}</strong></p>
            {renderSignatureBlock('Authorized Signatory')}
          </div>
        </div>
      </div>
    );
  }

  // ================= 5. CLEAN MINIMALIST =================
  if (templateId === 'clean-minimalist') {
    return (
      <div className="receipt-paper bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 text-slate-900 shadow-soft">
        <div className="flex items-baseline justify-between mb-6">
          <div className="flex items-center gap-3">
            {storeLogo && (
              <img src={storeLogo} alt={business.name} className="h-9 w-auto max-w-[120px] object-contain rounded shrink-0" />
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Receipt</p>
              <h4 className="font-display font-bold text-xl tracking-tight">{business.name}</h4>
            </div>
          </div>
          <span className="font-mono text-xs text-slate-400">#{receipt.receiptNo || receipt.id}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 text-xs mb-5">
          <div>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Client</p>
            <p className="font-semibold">{receipt.customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Method</p>
            <p className="font-semibold">{receipt.paymentMethod} · {receipt.status || 'Paid'}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {items.map((it, idx) => (
            <div key={it.id || idx} className="flex justify-between items-baseline text-xs">
              <div>
                <span className="font-medium text-slate-900">{it.desc}</span>
                <span className="text-slate-400 ml-1.5">×{it.qty}</span>
              </div>
              <span className="font-mono font-medium">{formatCurrency(it.qty * it.price, false)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-900 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Total</span>
          <span className="font-display font-extrabold text-2xl tracking-tight text-blue-600">{formatCurrency(total, false)}</span>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            <QRCodeSVG value={qrVerificationUrl} size={48} />
            <div className="text-[10px] text-slate-400">
              <p className="font-semibold text-slate-600">Scan to Verify</p>
              <p className="font-mono">{token}</p>
            </div>
          </div>
          {renderSignatureBlock('Authorized Signatory')}
        </div>
      </div>
    );
  }

  // ================= 6. THERMAL POS (58mm / 80mm) =================
  const is80 = thermalWidth === '80mm';
  return (
    <div className={`receipt-paper mx-auto ${is80 ? 'max-w-[340px]' : 'max-w-[290px]'} font-mono text-xs text-slate-900 shadow-soft bg-white rounded-lg overflow-hidden`}>
      <div className="thermal-edge-top w-full"></div>

      <div className="px-4 py-3 bg-white space-y-2">
        <div className="text-center pb-2 border-b border-dashed border-slate-400">
          {storeLogo && (
            <img src={storeLogo} alt={business.name} className="h-8 w-auto max-w-[100px] object-contain mx-auto mb-1" />
          )}
          <h4 className="font-bold text-sm tracking-wide uppercase">{business.name}</h4>
          <p className="text-[10px] text-slate-600">{business.address}</p>
          <p className="text-[10px] text-slate-600">Tel: {business.phone}</p>
          {business.bin && <p className="text-[10px] text-slate-600">BIN: {business.bin}</p>}
        </div>

        <div className="text-[11px] leading-tight pb-2 border-b border-dashed border-slate-400">
          <div className="flex justify-between">
            <span>RC#: {receipt.receiptNo || receipt.id}</span>
            <span>{receipt.date || 'Today'}</span>
          </div>
          <div className="flex justify-between mt-0.5">
            <span>Cust: {receipt.customerName}</span>
            <span>{receipt.paymentMethod}</span>
          </div>
        </div>

        <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-400">
          <div className="flex justify-between font-bold text-[10px] text-slate-600">
            <span>ITEM</span>
            <span>QTY</span>
            <span>AMT</span>
          </div>
          {items.map((it, idx) => (
            <div key={it.id || idx}>
              <div className="truncate font-semibold">{it.desc}</div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>{it.qty} × {formatCurrency(it.price, false)}</span>
                <span className="font-bold text-slate-900">{formatCurrency(it.qty * it.price, false)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] space-y-1 pt-1 pb-2 border-b border-dashed border-slate-400">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{formatCurrency(subtotal, false)}</span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between">
              <span>VAT ({taxRate}%):</span>
              <span>+{formatCurrency(taxAmount, false)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-800">
              <span>DISCOUNT:</span>
              <span>-{formatCurrency(discountAmount, false)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-800">
            <span>TOTAL:</span>
            <span>{formatCurrency(total, false)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-emerald-800">
            <span>PAID ({receipt.paymentMethod}):</span>
            <span>{formatCurrency(total, false)}</span>
          </div>
        </div>

        {/* Thermal Barcode & QR Code Footer */}
        <div className="text-center pt-2 pb-1 space-y-2 flex flex-col items-center">
          <QRCodeSVG value={qrVerificationUrl} size={60} />
          <p className="font-mono text-[9px] text-slate-500">Token: {token}</p>
          {signature && (
            <div className="pt-1">
              <img src={signature} alt="Signature" className="h-7 w-auto object-contain mx-auto" />
              <p className="text-[8px] uppercase tracking-wider text-slate-500 border-t border-slate-400 pt-0.5">Signatory</p>
            </div>
          )}
          <p className="text-[10px] font-sans text-slate-600">*** Thank you, visit again ***</p>
          <p className="text-[8px] text-slate-400 font-mono">=== Powered by SlipDo ===</p>
        </div>
      </div>

      <div className="thermal-edge-bottom w-full"></div>
    </div>
  );
};
