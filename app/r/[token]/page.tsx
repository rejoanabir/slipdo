'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StorageService } from '../../../lib/storage';
import { Receipt, Business } from '../../../lib/types';
import { ReceiptPreview } from '../../../components/ReceiptPreview';
import { PrinterIcon, DownloadIcon, CheckCircleIcon, ReceiptIcon } from '../../../components/Icons';

export default function PublicReceiptPage() {
  const params = useParams();
  const token = params?.token as string;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    const foundReceipt = StorageService.getReceiptByToken(token);
    const b = StorageService.getBusiness();
    setBusiness(b);
    if (foundReceipt) {
      setReceipt(foundReceipt);
    }
    setLoaded(true);
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!receipt || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center space-y-4">
        <ReceiptIcon size={48} className="text-neutral-300" />
        <h1 className="text-xl font-bold text-neutral-800">Receipt Not Found</h1>
        <p className="text-xs text-neutral-500 max-w-sm">
          This receipt link is invalid or may have been deleted by the issuing merchant.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-6 sm:py-12 px-4">
      {/* Top Banner with Print / Download Controls */}
      <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircleIcon size={20} className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Official Payment Receipt</h2>
            <p className="text-xs text-emerald-700 font-medium">
              Verified digital voucher from {business.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
          >
            <PrinterIcon size={16} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* The Printable / Viewable Receipt Canvas */}
      <ReceiptPreview receipt={receipt} business={business} isPrintMode={false} />

      {/* Footer Branding */}
      <div className="max-w-2xl mx-auto mt-8 text-center text-xs text-neutral-400 print:hidden space-y-1">
        <p>🔒 Authenticity cryptographically signed by merchant token</p>
        <p className="text-[11px]">Powered by Payment Receipt SaaS</p>
      </div>
    </div>
  );
}
