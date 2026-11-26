'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  lang?: 'en' | 'bn';
}

export const BottomNav: React.FC<BottomNavProps> = ({ lang = 'en' }) => {
  const pathname = usePathname();

  const links = [
    {
      href: '/',
      label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home',
      icon: '📊',
    },
    {
      href: '/receipts',
      label: lang === 'bn' ? 'রশিদ' : 'Vouchers',
      icon: '🧾',
    },
    {
      href: '/new',
      label: lang === 'bn' ? 'নতুন' : 'Create',
      icon: '+',
      isPrimary: true,
    },
    {
      href: '/customers',
      label: lang === 'bn' ? 'গ্রাহক' : 'Customers',
      icon: '👥',
    },
    {
      href: '/checklist',
      label: 'Figma',
      icon: '🎨',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden pb-safe shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href;

          if (link.isPrimary) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative -top-4 flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-elevated group-active:scale-95 transition-all">
                  {link.icon}
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-0.5">{link.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span className="text-[10px] mt-0.5">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
