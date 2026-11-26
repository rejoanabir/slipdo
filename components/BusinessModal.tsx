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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              {lang === 'bn' ? 'প্রতিষ্ঠানের প্রোফাইল সেটিংস' : 'Business Profile'}
            </h3>
            <p className="text-xs text-neutral-500">
              {lang === 'bn' ? 'এই তথ্যগুলো আপনার রশিদের ব্যানারে প্রদর্শিত হবে' : 'This information appears on your receipts'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center font-bold text-sm transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Tagline / Subheading
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Authentic Gadgets & IT Solutions"
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">BIN / TIN No.</label>
              <input
                type="text"
                value={binTin}
                onChange={(e) => setBinTin(e.target.value)}
                placeholder="BIN: 002345891-0101"
                className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Receipt Prefix</label>
              <input
                type="text"
                value={receiptPrefix}
                maxLength={6}
                onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
                placeholder="RCP"
                className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 outline-none font-mono font-bold uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Default Notes</label>
            <textarea
              rows={2}
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-xl p-2.5 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
