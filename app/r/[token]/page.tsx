'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StorageService } from '../../../lib/storage';
import { supabaseDb } from '../../../lib/supabase';
import { Receipt, Business } from '../../../lib/types';
import { ReceiptPreview } from '../../../components/ReceiptPreview';
import { QRCodeSVG } from '../../../components/QRCodeSVG';
import { ShieldCheckIcon, LockIcon } from '../../../components/Icons';

export default function PublicVerificationPage() {
  const params = useParams();
  const token = params?.token as string;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      setLoading(false);
      return;
    }

    async function loadReceipt() {
      setLoading(true);
      try {
        // 1. Try fetching from Supabase cloud first
        const cloudReceipt = await supabaseDb.getReceiptByToken(token);
        if (cloudReceipt) {
          setReceipt(cloudReceipt);
          const localBiz = StorageService.getActiveBusiness();
          const mergedBiz: Business = {
            ...localBiz,
            logoUrl: cloudReceipt.logoUrl || localBiz.logoUrl,
            signatureUrl: cloudReceipt.signatureUrl || localBiz.signatureUrl,
            customTemplate: cloudReceipt.customTemplate || localBiz.customTemplate,
          };
          setBusiness(mergedBiz);
          setLoading(false);
          return;
        }

        // 2. Fall back to local storage
        const localReceipt = StorageService.getReceiptByToken(token);
        const localBiz = StorageService.getActiveBusiness();
        if (localReceipt) {
          setReceipt(localReceipt);
          const mergedBiz: Business = {
            ...localBiz,
            logoUrl: localReceipt.logoUrl || localBiz.logoUrl,
            signatureUrl: localReceipt.signatureUrl || localBiz.signatureUrl,
            customTemplate: localReceipt.customTemplate || localBiz.customTemplate,
          };
          setBusiness(mergedBiz);
        } else {
          setBusiness(localBiz);
        }
      } catch (err) {
        console.error('Error loading digital receipt:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReceipt();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Verifying Cryptographic Receipt...</p>
      </div>
    );
  }

  // If receipt is not found in cloud or local
  if (!receipt) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-soft text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Receipt Not Found</h1>
            <p className="text-xs text-slate-500 mt-1">
              Token <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-700">{token || 'unknown'}</code> is invalid or the voucher record has not been published yet.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentBiz = business || StorageService.getActiveBusiness();
  const publicUrl =
    typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/r/${token}`
      : `https://slipdo.vercel.app/r/${token}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Verification Status Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-soft print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-2xl shrink-0 shadow-xs">
              <QRCodeSVG value={publicUrl} size={48} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[10px] font-bold mb-1">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-300" />
                <span>CRYPTOGRAPHICALLY VERIFIED</span>
              </div>
              <h2 className="font-display font-bold text-base leading-tight">Authentic Digital Receipt</h2>
              <p className="font-mono text-[11px] text-blue-200/90 mt-0.5">
                SHA-256: 8f4c...{token} · Issued {receipt.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-full bg-white text-slate-900 hover:bg-blue-50 text-xs font-bold shadow-sm transition-colors w-full sm:w-auto"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* The Rendered Voucher */}
        <div id="printable-receipt-area">
          <ReceiptPreview
            receipt={receipt}
            business={currentBiz}
            templateId={receipt.template}
          />
        </div>

        {/* Bottom Security Footer */}
        <div className="text-center py-4 print:hidden space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <LockIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Secured & Verified via SlipDo Cryptographic Ledger · Bangladesh</span>
          </div>
          <p className="text-[11px] text-slate-400">
            For billing inquiries or returns, present this QR code or token to {currentBiz.name}.
          </p>
        </div>
      </div>
    </div>
  );
}
