import React from 'react';
import { Receipt, Business, TemplateId } from '../lib/types';
import { formatMoney, formatDate, toBengaliDigits } from '../lib/format';
import { QRCodeSVG } from './QRCodeSVG';
import { CheckCircleIcon } from './Icons';

interface ReceiptPreviewProps {
  receipt: Receipt;
  business: Business;
  templateId?: TemplateId;
  publicUrl?: string;
  isPrintMode?: boolean;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  receipt,
  business,
  templateId = receipt.templateId || 'modern-emerald',
  publicUrl,
  isPrintMode = false,
}) => {
  const shareUrl = publicUrl || (typeof window !== 'undefined' ? `${window.location.origin}/r/${receipt.publicToken}` : `https://receipt.io/r/${receipt.publicToken}`);

  // 1. THERMAL POS 58mm / 80mm STYLE
  if (templateId === 'thermal-pos') {
    return (
      <div className="receipt-paper max-w-[340px] mx-auto bg-white p-4 font-mono text-xs text-neutral-900 border border-neutral-300 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="text-center pb-2 border-b border-dashed border-neutral-400">
          <h2 className="font-bold text-sm tracking-wide uppercase">{business.name}</h2>
          {business.tagline && <p className="text-[11px] text-neutral-600">{business.tagline}</p>}
          <p className="text-[10px] text-neutral-600 mt-1">{business.address}</p>
          <p className="text-[10px] text-neutral-600">Tel: {business.phone}</p>
          {business.binTin && <p className="text-[10px] text-neutral-700 font-bold">{business.binTin}</p>}
        </div>

        <div className="py-2 border-b border-dashed border-neutral-400 text-[11px]">
          <div className="flex justify-between">
            <span>RC#: {receipt.number}</span>
            <span>{receipt.issueDate}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Cust: {receipt.customerName}</span>
            <span>{receipt.paymentMethod}</span>
          </div>
          {receipt.customerPhone && (
            <div className="text-[10px] text-neutral-600">Ph: {receipt.customerPhone}</div>
          )}
          <div className="mt-1 font-bold text-emerald-800">Status: {receipt.paymentStatus.toUpperCase()}</div>
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-neutral-400">
          <div className="flex justify-between font-bold pb-1 text-[11px]">
            <span className="w-1/2">ITEM</span>
            <span className="w-1/4 text-center">QTY</span>
            <span className="w-1/4 text-right">TOTAL</span>
          </div>
          {receipt.items.map((item, idx) => (
            <div key={item.id || idx} className="py-1">
              <div className="font-medium text-[11px] leading-tight">{item.description}</div>
              <div className="flex justify-between text-[10px] text-neutral-600">
                <span>{item.quantity} x {formatMoney(item.unitPrice, receipt.currency)}</span>
                <span className="font-bold text-neutral-900">{formatMoney(item.lineTotal, receipt.currency)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Calculation */}
        <div className="py-2 border-b border-dashed border-neutral-400 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatMoney(receipt.subtotal, receipt.currency)}</span>
          </div>
          {receipt.discountAmount > 0 && (
            <div className="flex justify-between text-neutral-700">
              <span>Discount:</span>
              <span>-{formatMoney(receipt.discountAmount, receipt.currency)}</span>
            </div>
          )}
          {receipt.taxTotal > 0 && (
            <div className="flex justify-between">
              <span>VAT / Tax:</span>
              <span>+{formatMoney(receipt.taxTotal, receipt.currency)}</span>
            </div>
          )}
          {receipt.shippingFee > 0 && (
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>+{formatMoney(receipt.shippingFee, receipt.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-800">
            <span>GRAND TOTAL:</span>
            <span>{formatMoney(receipt.total, receipt.currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-[11px] pt-1">
            <span>PAID ({receipt.paymentMethod}):</span>
            <span>{formatMoney(receipt.amountPaid, receipt.currency)}</span>
          </div>
        </div>

        {/* Thermal Barcode / QR footer */}
        <div className="text-center pt-3 pb-1 flex flex-col items-center">
          <QRCodeSVG value={shareUrl} size={84} />
          <p className="text-[10px] font-mono mt-1 text-neutral-600 tracking-widest">{receipt.publicToken.slice(0, 12)}</p>
          <p className="text-[10px] mt-1 font-sans text-neutral-600">{receipt.notes || 'Thank you for your visit!'}</p>
          <p className="text-[9px] text-neutral-500 mt-2 font-mono">=== Powered by Payment Receipt ===</p>
        </div>
      </div>
    );
  }

  // 2. BANGLA FIRST (বাংলা ভাউচার / ক্যাশ মেমো)
  if (templateId === 'bangla-first') {
    return (
      <div className="receipt-paper max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-emerald-200 shadow-sm font-bengali text-neutral-800 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-emerald-600 gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full mb-1">
              ক্যাশ মেমো / মানি রিসিট
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">{business.name}</h1>
            {business.tagline && <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">{business.tagline}</p>}
            <p className="text-xs text-neutral-600 mt-1">{business.address}</p>
            <p className="text-xs text-neutral-600">ফোন: {toBengaliDigits(business.phone)}</p>
            {business.binTin && <p className="text-xs text-emerald-700 font-bold mt-0.5">{business.binTin}</p>}
          </div>
          <div className="text-left sm:text-right bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 w-full sm:w-auto">
            <div className="text-xs text-neutral-500">রশিদ নং:</div>
            <div className="text-base font-bold text-emerald-900 font-mono">{receipt.number}</div>
            <div className="text-xs text-neutral-500 mt-1">ইস্যু তারিখ:</div>
            <div className="text-sm font-semibold">{formatDate(receipt.issueDate, 'bn')}</div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white text-xs font-medium rounded">
              <CheckCircleIcon size={14} className="w-3.5 h-3.5" />
              <span>{receipt.paymentStatus === 'Paid' ? 'পরিশোধিত' : receipt.paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 my-2 bg-neutral-50/70 p-4 rounded-lg border border-neutral-100">
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider block">গ্রাহকের নাম:</span>
            <span className="text-sm sm:text-base font-bold text-neutral-900">{receipt.customerName}</span>
            {receipt.customerPhone && (
              <span className="block text-xs text-neutral-600 mt-0.5">ফোন: {toBengaliDigits(receipt.customerPhone)}</span>
            )}
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider block">পেমেন্ট মাধ্যম:</span>
            <span className="text-sm font-semibold text-emerald-800">{receipt.paymentMethod}</span>
            {receipt.transactionId && (
              <span className="block text-xs text-neutral-600 font-mono mt-0.5">ট্রানজেকশন আইডি: {receipt.transactionId}</span>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-emerald-800 text-white font-medium">
                <th className="py-2 px-3 rounded-l">ক্রমিক</th>
                <th className="py-2 px-3">পণ্যের বিবরণ</th>
                <th className="py-2 px-3 text-center">পরিমাণ</th>
                <th className="py-2 px-3 text-right">দর (টাকা)</th>
                <th className="py-2 px-3 text-right rounded-r">মোট (টাকা)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {receipt.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-emerald-50/30">
                  <td className="py-2.5 px-3 text-neutral-500 font-medium">{toBengaliDigits(idx + 1)}</td>
                  <td className="py-2.5 px-3 font-medium text-neutral-900">{item.description}</td>
                  <td className="py-2.5 px-3 text-center">{toBengaliDigits(item.quantity)}</td>
                  <td className="py-2.5 px-3 text-right">{formatMoney(item.unitPrice, receipt.currency, true)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-950">{formatMoney(item.lineTotal, receipt.currency, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-emerald-100">
          <div className="w-full sm:w-1/2 flex items-center gap-3 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100">
            <QRCodeSVG value={shareUrl} size={76} />
            <div className="text-[11px] text-neutral-600">
              <p className="font-semibold text-emerald-900">ডিজিটাল ভেরিফিকেশন</p>
              <p className="mt-0.5">ক্যামেরা দিয়ে স্ক্যান করে রশিদের সত্যতা নিশ্চিত করুন।</p>
            </div>
          </div>
          <div className="w-full sm:w-5/12 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>সাবটোটাল:</span>
              <span>{formatMoney(receipt.subtotal, receipt.currency, true)}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>ছাড় (ডিসকাউন্ট):</span>
                <span>-{formatMoney(receipt.discountAmount, receipt.currency, true)}</span>
              </div>
            )}
            {receipt.taxTotal > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>ভ্যাট / কর:</span>
                <span>+{formatMoney(receipt.taxTotal, receipt.currency, true)}</span>
              </div>
            )}
            {receipt.shippingFee > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>ডেলিভারি চার্জ:</span>
                <span>+{formatMoney(receipt.shippingFee, receipt.currency, true)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base sm:text-lg text-emerald-950 pt-2 border-t-2 border-emerald-600">
              <span>সর্বমোট:</span>
              <span>{formatMoney(receipt.total, receipt.currency, true)}</span>
            </div>
            <div className="flex justify-between font-semibold text-xs text-neutral-700 pt-1">
              <span>পরিশোধিত ({receipt.paymentMethod}):</span>
              <span>{formatMoney(receipt.amountPaid, receipt.currency, true)}</span>
            </div>
          </div>
        </div>

        {/* Notes and Signatures */}
        <div className="mt-8 pt-4 border-t border-neutral-200 text-xs text-neutral-600 flex flex-col sm:flex-row justify-between items-end gap-6">
          <div className="space-y-1 w-full sm:w-2/3">
            {receipt.notes && <p><span className="font-bold text-neutral-700">বিশেষ দ্রষ্টব্য:</span> {receipt.notes}</p>}
            {receipt.terms && <p><span className="font-bold text-neutral-700">শর্তাবলী:</span> {receipt.terms}</p>}
          </div>
          <div className="text-center min-w-[150px] border-t border-neutral-400 pt-1">
            <span className="text-xs font-medium text-neutral-700">কর্তৃপক্ষের স্বাক্ষর</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. CLASSIC FORMAL (Traditional Corporate Layout)
  if (templateId === 'classic-formal') {
    return (
      <div className="receipt-paper max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg border-4 border-double border-neutral-700 shadow-sm text-neutral-900 font-sans print:border-2 print:shadow-none print:p-0">
        <div className="text-center pb-4 border-b-2 border-neutral-800">
          <span className="text-xs uppercase tracking-widest font-bold text-neutral-600 block mb-1">Official Payment Receipt</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">{business.name}</h1>
          {business.tagline && <p className="text-xs text-neutral-600 italic mt-0.5">{business.tagline}</p>}
          <p className="text-xs text-neutral-700 mt-1">{business.address} | Phone: {business.phone}</p>
          {business.binTin && <p className="text-xs font-semibold text-neutral-800 mt-0.5">{business.binTin}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-300 text-xs">
          <div>
            <p><span className="font-bold text-neutral-700">Receipt No:</span> <span className="font-mono font-bold text-sm">{receipt.number}</span></p>
            <p className="mt-1"><span className="font-bold text-neutral-700">Date:</span> {formatDate(receipt.issueDate)}</p>
            <p className="mt-1"><span className="font-bold text-neutral-700">Payment Via:</span> {receipt.paymentMethod} {receipt.transactionId ? `(${receipt.transactionId})` : ''}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold text-neutral-700">Billed To:</span> <span className="font-bold text-sm">{receipt.customerName}</span></p>
            {receipt.customerPhone && <p className="text-neutral-600 mt-0.5">Contact: {receipt.customerPhone}</p>}
            {receipt.customerAddress && <p className="text-neutral-600">{receipt.customerAddress}</p>}
            <p className="mt-1">
              <span className="inline-block px-2 py-0.5 bg-neutral-900 text-white font-bold rounded text-[10px] uppercase">
                Status: {receipt.paymentStatus}
              </span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-4">
          <table className="w-full text-left text-xs border border-neutral-300">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 uppercase font-bold text-neutral-800">
                <th className="py-2 px-3 border-r border-neutral-300 w-12 text-center">#</th>
                <th className="py-2 px-3 border-r border-neutral-300">Description</th>
                <th className="py-2 px-3 border-r border-neutral-300 text-center w-16">Qty</th>
                <th className="py-2 px-3 border-r border-neutral-300 text-right w-24">Unit Price</th>
                <th className="py-2 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {receipt.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-2 px-3 border-r border-neutral-200 text-center text-neutral-500">{idx + 1}</td>
                  <td className="py-2 px-3 border-r border-neutral-200 font-medium">{item.description}</td>
                  <td className="py-2 px-3 border-r border-neutral-200 text-center">{item.quantity}</td>
                  <td className="py-2 px-3 border-r border-neutral-200 text-right">{formatMoney(item.unitPrice, receipt.currency)}</td>
                  <td className="py-2 px-3 text-right font-bold">{formatMoney(item.lineTotal, receipt.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Table */}
        <div className="flex justify-between items-start pt-2">
          <div className="w-1/2 flex items-center gap-3">
            <QRCodeSVG value={shareUrl} size={70} />
            <div className="text-[10px] text-neutral-600">
              <p className="font-bold text-neutral-800">Official Authenticity Stamp</p>
              <p>Scan to verify original record online.</p>
            </div>
          </div>
          <div className="w-5/12 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatMoney(receipt.subtotal, receipt.currency)}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-neutral-700">
                <span>Discount:</span>
                <span>-{formatMoney(receipt.discountAmount, receipt.currency)}</span>
              </div>
            )}
            {receipt.taxTotal > 0 && (
              <div className="flex justify-between">
                <span>VAT / Tax:</span>
                <span>+{formatMoney(receipt.taxTotal, receipt.currency)}</span>
              </div>
            )}
            {receipt.shippingFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>+{formatMoney(receipt.shippingFee, receipt.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm pt-2 border-t-2 border-neutral-900">
              <span>TOTAL PAID:</span>
              <span>{formatMoney(receipt.total, receipt.currency)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-10 pt-4 flex justify-between items-end text-xs">
          <div className="max-w-xs text-[11px] text-neutral-600">
            <p>{receipt.notes || 'Goods received in good order & condition.'}</p>
          </div>
          <div className="text-center min-w-[140px] border-t border-neutral-900 pt-1">
            <span className="font-bold">Authorized Signatory</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. CLEAN MINIMALIST
  if (templateId === 'clean-minimal') {
    return (
      <div className="receipt-paper max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-xl border border-neutral-200 shadow-sm text-neutral-800 font-sans print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-baseline pb-6 border-b border-neutral-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-light tracking-tight text-neutral-900">{business.name}</h1>
            <p className="text-xs text-neutral-400 mt-1">{business.address}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono tracking-wider text-neutral-500 uppercase">Receipt</span>
            <div className="text-sm font-mono font-medium text-neutral-900">{receipt.number}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{formatDate(receipt.issueDate)}</div>
          </div>
        </div>

        <div className="py-6 flex justify-between text-xs text-neutral-600">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Received From</span>
            <div className="font-semibold text-neutral-900 text-sm">{receipt.customerName}</div>
            {receipt.customerPhone && <div>{receipt.customerPhone}</div>}
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Settled With</span>
            <div className="font-medium text-neutral-900">{receipt.paymentMethod}</div>
            <div className="text-emerald-700 font-semibold">{receipt.paymentStatus}</div>
          </div>
        </div>

        {/* Minimal Item List */}
        <div className="border-t border-b border-neutral-100 py-3 my-2">
          {receipt.items.map((item, idx) => (
            <div key={item.id || idx} className="flex justify-between items-center py-2 text-xs">
              <div>
                <span className="font-medium text-neutral-900">{item.description}</span>
                <span className="text-neutral-400 ml-2">× {item.quantity}</span>
              </div>
              <div className="font-medium">{formatMoney(item.lineTotal, receipt.currency)}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center py-4">
          <QRCodeSVG value={shareUrl} size={64} />
          <div className="text-right text-xs space-y-1">
            <div className="text-neutral-500">Total: {formatMoney(receipt.subtotal, receipt.currency)}</div>
            {receipt.discountAmount > 0 && <div className="text-emerald-600">Discount: -{formatMoney(receipt.discountAmount, receipt.currency)}</div>}
            <div className="text-lg font-light tracking-tight text-neutral-900 pt-1">
              Paid: <span className="font-semibold">{formatMoney(receipt.total, receipt.currency)}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 text-center text-[10px] text-neutral-400 border-t border-neutral-50">
          {receipt.notes || 'Thank you for your business.'}
        </div>
      </div>
    );
  }

  // DEFAULT / 5. MODERN EMERALD (Recommended flagship template)
  return (
    <div className="receipt-paper max-w-2xl mx-auto bg-white rounded-2xl border border-emerald-100 shadow-md overflow-hidden text-neutral-800 font-sans print:border-none print:shadow-none print:rounded-none">
      {/* Top Emerald Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-900/60 text-emerald-200 text-xs font-medium rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Payment Receipt
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{business.name}</h1>
            {business.tagline && <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">{business.tagline}</p>}
          </div>
          <div className="text-left sm:text-right bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15">
            <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">Receipt No.</div>
            <div className="text-lg font-bold font-mono text-white">{receipt.number}</div>
            <div className="text-xs text-emerald-100 mt-0.5">{formatDate(receipt.issueDate)}</div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Business & Customer Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-emerald-100">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block mb-1">Issued By</span>
            <div className="text-sm font-semibold text-neutral-900">{business.name}</div>
            <div className="text-xs text-neutral-600 mt-0.5">{business.address}</div>
            <div className="text-xs text-neutral-600">Phone: {business.phone}</div>
            {business.binTin && <div className="text-xs font-semibold text-emerald-800 mt-1">{business.binTin}</div>}
          </div>
          <div className="sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block mb-1">Customer Details</span>
            <div className="text-sm font-bold text-neutral-900">{receipt.customerName}</div>
            {receipt.customerPhone && <div className="text-xs text-neutral-600 mt-0.5">{receipt.customerPhone}</div>}
            {receipt.customerEmail && <div className="text-xs text-neutral-600">{receipt.customerEmail}</div>}
            {receipt.customerAddress && <div className="text-xs text-neutral-600">{receipt.customerAddress}</div>}
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
              <CheckCircleIcon size={14} className="w-3.5 h-3.5" />
              <span>{receipt.paymentStatus} via {receipt.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-emerald-50/80 text-emerald-950 font-semibold border-b border-emerald-200">
                <th className="py-3 px-3 rounded-l-lg">Item Description</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right rounded-r-lg">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {receipt.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-neutral-50/50 transition">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-neutral-900">{item.description}</div>
                    {item.taxRate > 0 && <span className="text-[10px] text-emerald-700 font-medium">(VAT: {item.taxRate}%)</span>}
                  </td>
                  <td className="py-3 px-3 text-center text-neutral-700">{item.quantity}</td>
                  <td className="py-3 px-3 text-right text-neutral-700">{formatMoney(item.unitPrice, receipt.currency)}</td>
                  <td className="py-3 px-3 text-right font-bold text-neutral-900">{formatMoney(item.lineTotal, receipt.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation & QR Verification */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-emerald-100">
          <div className="w-full sm:w-1/2 flex items-center gap-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
            <QRCodeSVG value={shareUrl} size={80} />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 block">Verified Authentic</span>
              <p className="text-[11px] text-neutral-600 mt-0.5">Scan with any smartphone camera to view or verify this receipt online.</p>
              <span className="text-[10px] font-mono text-emerald-700 mt-1 block">Token: {receipt.publicToken.slice(0, 10)}...</span>
            </div>
          </div>

          <div className="w-full sm:w-5/12 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span className="font-medium text-neutral-900">{formatMoney(receipt.subtotal, receipt.currency)}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="font-semibold">-{formatMoney(receipt.discountAmount, receipt.currency)}</span>
              </div>
            )}
            {receipt.taxTotal > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>VAT / Tax:</span>
                <span>+{formatMoney(receipt.taxTotal, receipt.currency)}</span>
              </div>
            )}
            {receipt.shippingFee > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>Delivery:</span>
                <span>+{formatMoney(receipt.shippingFee, receipt.currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline font-bold text-base sm:text-xl text-emerald-950 pt-2 border-t-2 border-emerald-600">
              <span>Grand Total:</span>
              <span>{formatMoney(receipt.total, receipt.currency)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-emerald-800 pt-1">
              <span>Amount Paid ({receipt.paymentMethod}):</span>
              <span>{formatMoney(receipt.amountPaid, receipt.currency)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="pt-4 border-t border-neutral-100 text-xs text-neutral-500 space-y-1">
          {receipt.notes && (
            <p className="italic"><span className="font-semibold text-neutral-700 not-italic">Note:</span> {receipt.notes}</p>
          )}
          {receipt.terms && (
            <p className="text-[11px] text-neutral-400"><span className="font-semibold text-neutral-600">Terms:</span> {receipt.terms}</p>
          )}
          <div className="pt-2 text-center text-[10px] text-neutral-400 font-mono">
            Generated securely by Payment Receipt • {shareUrl}
          </div>
        </div>
      </div>
    </div>
  );
};
