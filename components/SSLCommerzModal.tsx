'use client';

import React, { useState } from 'react';
import { XIcon } from './Icons';

interface SSLCommerzModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: string) => void;
}

export const SSLCommerzModal: React.FC<SSLCommerzModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedGw, setSelectedGw] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Cards'>('bKash');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(selectedGw);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <div>
              <span className="font-display font-bold text-sm text-slate-900 block">SSLCommerz Secure Checkout</span>
              <span className="text-[10px] text-slate-400">256-bit encrypted merchant payment</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-950">SlipDo Business Plan</p>
              <p className="text-[11px] text-blue-700/80 mt-0.5">Unlimited receipts, custom branding & all templates</p>
            </div>
            <span className="font-display font-extrabold text-lg text-blue-900">৳ 499</span>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">Select Payment Method:</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'bKash', color: 'border-[#E2136E] text-[#E2136E] bg-[#E2136E]/5' },
                { name: 'Nagad', color: 'border-[#F7941D] text-[#F7941D] bg-[#F7941D]/5' },
                { name: 'Rocket', color: 'border-[#8C3494] text-[#8C3494] bg-[#8C3494]/5' },
                { name: 'Cards', color: 'border-blue-600 text-blue-600 bg-blue-50' },
              ].map((gw) => (
                <button
                  key={gw.name}
                  type="button"
                  onClick={() => setSelectedGw(gw.name as any)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedGw === gw.name
                      ? `${gw.color} font-bold shadow-xs ring-2 ring-blue-500/20`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs font-bold">{gw.name}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Secured via SSLCommerz 256-bit IPN encryption. Instant automated upgrade for registered merchants.
          </p>

          <button
            type="button"
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="animate-pulse">Authorizing with {selectedGw}...</span>
            ) : (
              <span>Pay ৳ 499.00 via {selectedGw}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
