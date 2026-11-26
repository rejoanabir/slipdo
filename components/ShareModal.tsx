'use client';

import React, { useState } from 'react';
import { Receipt, Business } from '../lib/types';
import { formatMoney } from '../lib/format';
import { WhatsAppIcon, MailIcon, LinkIcon, PrinterIcon, CheckCircleIcon } from './Icons';

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
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${receipt.publicToken}`
      : `https://receipt.io/r/${receipt.publicToken}`;

  // Clean phone number for WhatsApp wa.me link
  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    let p = phone.replace(/[^\d+]/g, '');
    if (p.startsWith('01')) {
      p = '880' + p.substring(1);
    } else if (p.startsWith('+880')) {
      p = p.substring(1);
    }
    return p;
  };

  const whatsappPhone = getCleanPhone(receipt.customerPhone);

  const getWhatsAppMessage = () => {
    return (
      `*Payment Receipt - ${business.name}*\n\n` +
      `Dear ${receipt.customerName},\n` +
      `Thank you for your payment! Here is your official receipt:\n\n` +
      `📄 *Receipt No:* ${receipt.number}\n` +
      `💰 *Amount Paid:* ${formatMoney(receipt.amountPaid, receipt.currency)}\n` +
      `💳 *Method:* ${receipt.paymentMethod}\n` +
      `📅 *Date:* ${receipt.issueDate}\n\n` +
      `🔗 *View / Download Receipt:* \n${publicUrl}\n\n` +
      `If you have any questions, feel free to contact us at ${business.phone}.`
    );
  };

  const handleWhatsAppClick = () => {
    const text = encodeURIComponent(getWhatsAppMessage());
    const url = whatsappPhone
      ? `https://wa.me/${whatsappPhone}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Payment Receipt #${receipt.number} from ${business.name}`);
    const body = encodeURIComponent(getWhatsAppMessage());
    const mailto = `mailto:${receipt.customerEmail || ''}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    setEmailStatus('Draft opened in email app');
    setTimeout(() => setEmailStatus(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-5">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              {lang === 'bn' ? 'রশিদ শেয়ার ও প্রিন্ট' : 'Share & Deliver Receipt'}
            </h3>
            <p className="text-xs text-neutral-500">
              Receipt #{receipt.number} • {formatMoney(receipt.total, receipt.currency)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* 1. WhatsApp Button */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold rounded-2xl flex items-center justify-between shadow-md shadow-emerald-500/20 transition"
          >
            <div className="flex items-center gap-3">
              <WhatsAppIcon size={22} className="w-6 h-6" />
              <div className="text-left">
                <span className="block text-sm">
                  {lang === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send via WhatsApp'}
                </span>
                <span className="block text-[11px] text-white/80 font-normal">
                  {whatsappPhone ? `Send directly to ${whatsappPhone}` : 'Open WhatsApp click-to-chat'}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">1-Click</span>
          </button>

          {/* 2. Print / Save as PDF Button */}
          <button
            onClick={handlePrint}
            className="w-full py-3.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl flex items-center justify-between transition"
          >
            <div className="flex items-center gap-3">
              <PrinterIcon size={20} className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <span className="block text-sm">
                  {lang === 'bn' ? 'প্রিন্ট অথবা PDF সেভ করুন' : 'Print / Save as PDF'}
                </span>
                <span className="block text-[11px] text-neutral-400 font-normal">
                  Thermal roll or standard A4 format
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">Print</span>
          </button>

          {/* 3. Email Button */}
          <button
            onClick={handleEmailShare}
            className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-2xl flex items-center justify-between transition"
          >
            <div className="flex items-center gap-3">
              <MailIcon size={18} className="w-5 h-5 text-neutral-600" />
              <div className="text-left">
                <span className="block text-sm">
                  {lang === 'bn' ? 'ইমেইলে পাঠান' : 'Send via Email'}
                </span>
                <span className="block text-[11px] text-neutral-500">
                  {receipt.customerEmail || 'Open mail composer'}
                </span>
              </div>
            </div>
            {emailStatus && <span className="text-xs text-emerald-700 font-bold">{emailStatus}</span>}
          </button>
        </div>

        {/* Public Share Link Box */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {lang === 'bn' ? 'অনলাইন ভেরিফিকেশন লিংক' : 'Public Verification Link'}
          </label>
          <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-2xl p-1.5 pl-3">
            <LinkIcon size={16} className="text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="w-full text-xs bg-transparent text-neutral-700 outline-none truncate font-mono"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
          >
            Close window
          </button>
        </div>
      </div>
    </div>
  );
};
