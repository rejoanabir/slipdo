'use client';

import React, { useState } from 'react';
import { Business } from '../lib/types';
import { SlipDoLogo } from './SlipDoLogo';
import { XIcon, PlusIcon, BuildingIcon, CheckIcon } from './Icons';

interface BusinessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  activeBusiness: Business;
  onSelectBusiness: (biz: Business) => void;
  onAddBusiness?: (biz: Business) => void;
  lang?: 'en' | 'bn';
}

export const BusinessDrawer: React.FC<BusinessDrawerProps> = ({
  isOpen,
  onClose,
  businesses,
  activeBusiness,
  onSelectBusiness,
  onAddBusiness,
  lang = 'en',
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('General Retail & Services');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');

  if (!isOpen) return null;

  const handleCreateOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newBiz: Business = {
      id: 'biz_' + Date.now().toString(36),
      name: newName.trim(),
      category: newCategory,
      address: newAddress.trim() || 'Dhaka, Bangladesh',
      phone: newPhone.trim() || activeBusiness.phone || '+880 1700-000000',
      bin: activeBusiness.bin || '000000000-0101',
      currency: activeBusiness.currency || 'BDT',
      currencySymbol: activeBusiness.currencySymbol || '৳',
    };

    if (onAddBusiness) {
      onAddBusiness(newBiz);
    }
    setShowAddForm(false);
    setNewName('');
    setNewAddress('');
    setNewPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlipDoLogo size={28} />
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                {lang === 'bn' ? 'স্টোরফ্রন্ট ও আউটলেট' : 'Storefronts & Outlets'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn' ? 'সক্রিয় ব্যবসার ভাউচার প্রোফাইল' : 'Manage retail outlets and branches'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddForm(false);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto thin-scroll">
          {businesses.map((biz) => {
            const isSelected = biz.id === activeBusiness.id;
            return (
              <button
                key={biz.id}
                onClick={() => {
                  onSelectBusiness(biz);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-slate-900">{biz.name}</span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{biz.category}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {biz.address} · Tel: {biz.phone}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Add New Outlet Form */}
          {showAddForm ? (
            <form onSubmit={handleCreateOutlet} className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/30 space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                  <BuildingIcon className="w-4 h-4 text-emerald-600" />
                  <span>New Storefront Outlet</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Outlet / Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanmondi Outlet #2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="General Retail & Services">Retail & Commerce</option>
                    <option value="Electronics & Tech">Electronics & Gadget</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Grocery & Mart">Grocery & Mart</option>
                    <option value="Pharmacy & Health">Pharmacy & Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+880 1..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Road 27, Dhanmondi, Dhaka"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Add Outlet
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2"
            >
              <PlusIcon className="w-4 h-4 text-emerald-600" />
              <span>+ Add Storefront Outlet / Branch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
