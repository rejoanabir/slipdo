'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Business } from '../lib/types';
import { SlipDoLogo } from './SlipDoLogo';

interface NavbarProps {
  business: Business;
  lang: 'en' | 'bn';
  onToggleLang: () => void;
  onOpenStoreDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  lang,
  onToggleLang,
  onOpenStoreDrawer,
}) => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard' },
    { href: '/new', label: lang === 'bn' ? 'নতুন রশিদ' : 'Creator' },
    { href: '/receipts', label: lang === 'bn' ? 'রশিদ সমূহ' : 'Vouchers' },
    { href: '/customers', label: lang === 'bn' ? 'গ্রাহক' : 'Customers' },
    { href: '/settings', label: lang === 'bn' ? 'সেটিংস' : 'Settings' },
    { href: '/checklist', label: '🎨 Figma Checklist' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo + Active Storefront Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <SlipDoLogo size={36} className="group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                  SlipDo
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 tracking-wider">
                  SAAS
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide block">
                Digital Receipts for BD
              </span>
            </div>
          </Link>

          {/* Active Storefront Drawer Button */}
          <button
            onClick={onOpenStoreDrawer}
            className="hidden sm:flex items-center gap-2 ml-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 border border-slate-200/80 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="max-w-[150px] truncate">{business.name}</span>
            <span className="text-slate-400 text-[10px]">▼</span>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors bg-white shadow-xs"
            title="Toggle English / বাংলা"
          >
            <span>{lang === 'bn' ? '🇧🇩 বাংলা' : '🇬🇧 EN'}</span>
          </button>

          {/* Quick Create CTA */}
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-display font-bold shadow-sm transition-all active:scale-95"
          >
            <span>+ New Slip</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
