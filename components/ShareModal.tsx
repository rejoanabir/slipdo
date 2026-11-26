'use client';

import React, { useState } from 'react';
import { Receipt, Business } from '../lib/types';
import { formatCurrency } from '../lib/format';
import {
  WhatsAppIcon,
  PrinterIcon,
  FileTextIcon,
  XIcon,
  CheckIcon,
  ExternalLinkIcon,
} from './Icons';

interface ShareModalProps {
  receipt: Receipt;
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'bn';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  receipt,
  business,
  isOpen,
  onClose,
  lang = 'en',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const token = receipt.token || 'sd_9f8a2c4e';
  const publicUrl = `https://slipdo.app/r/${token}`;

  // WhatsApp click-to-chat formatted message
  const getWhatsAppMessage = () => {
    return (
      `*Payment Receipt - ${business.name}*\n\n` +
      `Dear ${receipt.customerName},\n` +
      `Thank you for your payment! Here is your official verified receipt:\n\n` +
      `*Receipt No:* #${receipt.receiptNo || receipt.id}\n` +
      `*Amount Paid:* ${formatCurrency(receipt.total, false)}\n` +
      `*Method:* ${receipt.paymentMethod} (${receipt.status || 'Paid'})\n` +
      `*Date:* ${receipt.date || 'Today'}\n\n` +
      `*View & Download Verified Voucher:*\n${publicUrl}\n\n` +
      `If you have any questions, feel free to contact us at ${business.phone}.`
    );
  };

  const cleanPhone = (receipt.customerPhone || '').replace(/[^\d+]/g, '');
  const waPhone = cleanPhone.startsWith('01') ? '880' + cleanPhone.substring(1) : cleanPhone.replace(/^\+/, '');
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(getWhatsAppMessage())}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(getWhatsAppMessage())}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleThermalPrint = () => {
    window.print();
  };

  const handleA4Print = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">
              {lang === 'bn' ? 'ভাউচার ডেলিভারি ও প্রিন্ট' : 'Receipt Delivery & Print'}
            </h3>
            <p className="text-xs text-slate-500">
              #{receipt.receiptNo || receipt.id} · {formatCurrency(receipt.total, false)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 1-Click WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-sm flex items-center justify-between shadow-sm transition-all"
          >
            <span className="flex items-center gap-2.5">
              <WhatsAppIcon className="w-5 h-5 text-white" />
              <span>1-Click Send via WhatsApp (wa.me)</span>
            </span>
            <ExternalLinkIcon className="w-4 h-4 opacity-80" />
          </a>

          {/* Public Link Copier */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Public Verification Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <span>Copy</span>
                )}
              </button>
            </div>
          </div>

          {/* Print Triggers */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleThermalPrint}
              className="py-3 px-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all"
            >
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-0.5">
                <PrinterIcon className="w-4 h-4 text-emerald-700" />
                <span>Thermal POS Print</span>
              </div>
              <p className="text-[11px] text-slate-500">58mm / 80mm roll format</p>
            </button>

            <button
              onClick={handleA4Print}
              className="py-3 px-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all"
            >
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-0.5">
                <FileTextIcon className="w-4 h-4 text-emerald-700" />
                <span>A4 / PDF Print</span>
              </div>
              <p className="text-[11px] text-slate-500">Full invoice layout</p>
            </button>
          </div>

          {/* Open /r/[token] preview */}
          <a
            href={`/r/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Preview Customer Verification Page (/r/[token])</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
