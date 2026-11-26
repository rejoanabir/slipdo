'use client';

import React from 'react';
import { Business } from '../lib/types';
import { SlipDoLogo } from './SlipDoLogo';

interface BusinessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  activeBusiness: Business;
  onSelectBusiness: (biz: Business) => void;
  lang?: 'en' | 'bn';
}

export const BusinessDrawer: React.FC<BusinessDrawerProps> = ({
  isOpen,
  onClose,
  businesses,
  activeBusiness,
  onSelectBusiness,
  lang = 'en',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlipDoLogo size={28} />
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                {lang === 'bn' ? 'স্টোরফ্রন্ট নির্বাচন করুন' : 'Switch Storefront'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn' ? 'সক্রিয় ব্যবসার ভাউচার প্রোফাইল' : 'Active business profile for receipts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ✕
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
                    {biz.address} · BIN: {biz.bin}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
