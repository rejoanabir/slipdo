'use client';

import React, { useState } from 'react';
import { Business, Currency } from '../lib/types';
import { XIcon } from './Icons';

interface BusinessModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Business) => void;
  lang?: 'en' | 'bn';
}

export const BusinessModal: React.FC<BusinessModalProps> = ({
  business,
  isOpen,
  onClose,
  onSave,
  lang = 'en',
}) => {
  const [name, setName] = useState(business.name);
  const [tagline, setTagline] = useState(business.tagline || '');
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email);
  const [address, setAddress] = useState(business.address);
  const [binTin, setBinTin] = useState(business.binTin || '');
  const [currency, setCurrency] = useState<Currency>(business.currency);
  const [receiptPrefix, setReceiptPrefix] = useState(business.receiptPrefix || 'RCP');
  const [defaultTaxRate, setDefaultTaxRate] = useState(business.defaultTaxRate || 0);
  const [defaultNotes, setDefaultNotes] = useState(business.defaultNotes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...business,
      name: name.trim() || 'My Business',
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      binTin: binTin.trim(),
      currency,
      currencySymbol: currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : '৳',
      receiptPrefix: receiptPrefix.trim().toUpperCase() || 'RCP',
      defaultTaxRate: Number(defaultTaxRate) || 0,
      defaultNotes: defaultNotes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto thin-scroll space-y-4 animate-scale-up">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              {lang === 'bn' ? 'প্রতিষ্ঠানের প্রোফাইল সেটিংস' : 'Business Profile Settings'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn' ? 'এই তথ্যগুলো আপনার রশিদের ব্যানারে প্রদর্শিত হবে' : 'Configure branding and header identity for digital receipts'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Tagline / Subheading
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Authentic Gadgets & IT Solutions"
              className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">BIN / TIN No.</label>
              <input
                type="text"
                value={binTin}
                onChange={(e) => setBinTin(e.target.value)}
                placeholder="BIN: 002345891-0101"
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-mono focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Receipt Prefix</label>
              <input
                type="text"
                value={receiptPrefix}
                maxLength={6}
                onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
                placeholder="RCP"
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Default Notes</label>
            <textarea
              rows={2}
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
