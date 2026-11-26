'use client';

import React from 'react';
import Link from 'next/link';
import { Business } from '../lib/types';
import { ReceiptIcon, PlusIcon, SettingsIcon } from './Icons';

interface NavbarProps {
  business: Business;
  lang: 'en' | 'bn';
  onToggleLang: () => void;
  onOpenBusinessSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  lang,
  onToggleLang,
  onOpenBusinessSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
              <ReceiptIcon size={22} className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-neutral-900 block leading-tight">
                Payment Receipt
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block">
                {lang === 'bn' ? 'রশিদ ও ভাউচার' : 'Invoicing & Pos'}
              </span>
            </div>
          </Link>

          {/* Business Switcher / Profile Badge */}
          <button
            onClick={onOpenBusinessSettings}
            className="hidden md:flex items-center gap-2 ml-4 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl text-xs font-semibold text-neutral-700 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="max-w-[140px] truncate">{business.name}</span>
            <SettingsIcon size={14} className="text-neutral-500" />
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 text-xs font-bold text-neutral-700 flex items-center gap-1.5 transition bg-neutral-50"
            title="Toggle Bangla / English"
          >
            <span>{lang === 'bn' ? '🇧🇩 বাংলা' : '🇬🇧 EN'}</span>
          </button>

          {/* New Receipt Quick Button */}
          <Link
            href="/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <PlusIcon size={16} />
            <span>{lang === 'bn' ? 'নতুন রশিদ' : 'Create Receipt'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
