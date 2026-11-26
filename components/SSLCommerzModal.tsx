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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-display font-bold text-sm">SSLCommerz Secure Checkout</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800">SlipDo Pro Plan (Monthly)</p>
              <p className="text-[11px] text-emerald-700">Unlimited receipts, custom branding & 5 templates</p>
            </div>
            <span className="font-display font-bold text-lg text-emerald-900">৳ 499</span>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Select Bangladesh Payment Gateway:</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'bKash', color: 'border-[#E2136E] text-[#E2136E] bg-[#E2136E]/5' },
                { name: 'Nagad', color: 'border-[#F7941D] text-[#F7941D] bg-[#F7941D]/5' },
                { name: 'Rocket', color: 'border-[#8C3494] text-[#8C3494] bg-[#8C3494]/5' },
                { name: 'Cards', color: 'border-blue-600 text-blue-600 bg-blue-50' },
              ].map((gw) => (
                <button
                  key={gw.name}
                  onClick={() => setSelectedGw(gw.name as any)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    selectedGw === gw.name
                      ? `${gw.color} font-bold shadow-xs ring-2 ring-emerald-500/20`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs font-bold">{gw.name}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Secured via SSLCommerz 256-bit IPN encryption. Instant automated upgrade for Bangladeshi merchants.
          </p>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
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
