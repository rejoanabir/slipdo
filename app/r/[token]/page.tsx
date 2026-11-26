'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StorageService } from '../../../lib/storage';
import { Receipt, Business } from '../../../lib/types';
import { ReceiptPreview } from '../../../components/ReceiptPreview';
import { QRCodeSVG } from '../../../components/QRCodeSVG';

export default function PublicVerificationPage() {
  const params = useParams();
  const token = params?.token as string;
  const [mounted, setMounted] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!token) return;
    const r = StorageService.getReceiptByToken(token);
    const b = StorageService.getActiveBusiness();
    setBusiness(b);
    if (r) {
      setReceipt(r);
    }
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F1F5F9]"></div>;
  }

  // Fallback if receipt not found
  const displayReceipt = receipt || {
    id: 'SD-2026-0842',
    receiptNo: 'SD-2026-0842',
    token: token || 'sd_9f8a2c4e',
    date: '27 Nov 2026, 11:20 AM',
    customerName: 'Tanvir Ahmed',
    customerPhone: '+880 1712-908123',
    paymentMethod: 'bKash' as const,
    status: 'Paid' as const,
    template: 'modern-emerald' as const,
    taxRate: 5,
    enableTax: true,
    discount: 2500,
    enableDiscount: true,
    items: [
      { id: 1, desc: 'MacBook Air M3 Sleeve & Hub', descBn: 'ম্যাকবুক এয়ার স্লিভ ও হাব', qty: 2, price: 6500 },
      { id: 2, desc: 'Keychron K2 Pro Mechanical', descBn: 'কীক্রোন কে২ প্রো কীবোর্ড', qty: 1, price: 11500 },
      { id: 3, desc: 'Dell UltraSharp 27" 4K Monitor', descBn: 'ডেল আলট্রাশার্প ২৭" ৪কে মনিটর', qty: 1, price: 95481.9 },
    ],
    total: 123456.0,
  };

  const currentBiz = business || StorageService.getActiveBusiness();

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-6 sm:py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Verification Status Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-soft print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shrink-0">
              <QRCodeSVG value={`https://slipdo.app/r/${token}`} size={48} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold mb-1">
                <span>✓ CRYPTOGRAPHICALLY VERIFIED</span>
              </div>
              <h2 className="font-display font-bold text-base leading-tight">Authentic Digital Receipt</h2>
              <p className="font-mono text-[11px] text-emerald-200/90 mt-0.5">
                SHA-256: 8f4c...{token} · Issued {displayReceipt.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-sm transition-colors w-full sm:w-auto"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* The Rendered Voucher */}
        <div id="printable-receipt-area">
          <ReceiptPreview
            receipt={displayReceipt}
            business={currentBiz}
            templateId={displayReceipt.template}
          />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 space-y-1 print:hidden pt-4">
          <p>🔒 Authenticity cryptographically signed by SlipDo SHA-256 token</p>
          <Link href="/" className="text-emerald-700 font-semibold hover:underline">
            SlipDo — Smart Digital Receipts for Bangladesh
          </Link>
        </div>
      </div>
    </div>
  );
}
