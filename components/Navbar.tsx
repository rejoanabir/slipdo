'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Business } from '../lib/types';
import { SlipDoLogo } from './SlipDoLogo';
import { GlobeIcon, UserIcon } from './Icons';

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
    { href: '/profile', label: lang === 'bn' ? 'প্রোফাইল' : 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo + Active Storefront Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <SlipDoLogo size={36} lockup="official" className="group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 leading-none block">
                SlipDo
              </span>
            </div>
          </Link>

          {/* Active Storefront Drawer Button */}
          <button
            onClick={onOpenStoreDrawer}
            className="flex items-center gap-1.5 sm:gap-2 ml-1.5 sm:ml-3 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 border border-slate-200/80 transition-colors max-w-[140px] sm:max-w-none shrink-0"
            title="Switch storefront outlet"
          >
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-5 h-5 rounded-md object-contain bg-white border border-slate-200 shrink-0 p-0.5"
              />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
            )}
            <span className="max-w-[80px] sm:max-w-[150px] truncate">{business.name}</span>
            <svg className="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
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
            className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors bg-white shadow-2xs"
            title="Toggle English / বাংলা"
          >
            <GlobeIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Quick Create CTA */}
          <Link
            href="/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>+</span>
            <span>{lang === 'bn' ? 'নতুন রশিদ' : 'New Slip'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
