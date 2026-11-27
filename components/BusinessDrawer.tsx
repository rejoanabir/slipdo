'use client';

import React, { useState } from 'react';
import { Business } from '../lib/types';
import { SlipDoLogo } from './SlipDoLogo';
import { XIcon, PlusIcon, BuildingIcon, CheckIcon, Trash2Icon } from './Icons';

interface BusinessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  activeBusiness: Business;
  onSelectBusiness: (biz: Business) => void;
  onAddBusiness?: (biz: Business) => void;
  onDeleteBusiness?: (bizId: string) => void;
  lang?: 'en' | 'bn';
}

export const BusinessDrawer: React.FC<BusinessDrawerProps> = ({
  isOpen,
  onClose,
  businesses,
  activeBusiness,
  onSelectBusiness,
  onAddBusiness,
  onDeleteBusiness,
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
      address: newAddress.trim() || 'Online Store',
      phone: newPhone.trim() || activeBusiness.phone || '',
      bin: activeBusiness.bin || '',
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlipDoLogo size={32} />
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
                {lang === 'bn' ? 'স্টোরফ্রন্ট ও আউটলেট' : 'Storefronts & Outlets'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {lang === 'bn' ? 'সক্রিয় ব্যবসার ভাউচার প্রোফাইল' : 'Select or register a business branch'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddForm(false);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Store List */}
        <div className="p-4 sm:p-5 space-y-2.5 max-h-[60vh] overflow-y-auto thin-scroll">
          {businesses.map((biz) => {
            const isSelected = biz.id === activeBusiness.id;
            return (
              <div
                key={biz.id}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectBusiness(biz);
                    onClose();
                  }}
                  className="flex-1 flex items-start gap-3 text-left"
                >
                  {biz.logoUrl ? (
                    <img
                      src={biz.logoUrl}
                      alt={biz.name}
                      className="w-11 h-11 rounded-xl object-contain bg-white p-1 border border-slate-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {biz.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-slate-900 truncate">{biz.name}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0">
                          <CheckIcon className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{biz.category}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {biz.address || 'Online Store'} {biz.phone ? `· Tel: ${biz.phone}` : ''}
                    </p>
                  </div>
                </button>

                {businesses.length > 1 && onDeleteBusiness && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBusiness(biz.id);
                    }}
                    title="Remove this outlet"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add New Outlet Form */}
          {showAddForm ? (
            <form onSubmit={handleCreateOutlet} className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3 mt-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                  <BuildingIcon className="w-4 h-4 text-blue-600" />
                  <span>Register Storefront Outlet</span>
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
                  placeholder="e.g. Dhanmondi Flagship Outlet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-500"
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
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Physical Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Banani, Dhaka (leave blank for Online Store)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Create Outlet
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 px-3 rounded-2xl border border-dashed border-slate-300 text-blue-700 hover:bg-blue-50/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2"
            >
              <PlusIcon className="w-4 h-4 text-blue-600" />
              <span>Add Storefront Outlet / Branch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
