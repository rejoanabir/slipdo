'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboardIcon, ReceiptIcon, PlusIcon, UsersIcon, SettingsIcon } from './Icons';

interface BottomNavProps {
  lang?: 'en' | 'bn';
}

export const BottomNav: React.FC<BottomNavProps> = ({ lang = 'en' }) => {
  const pathname = usePathname();

  const links = [
    {
      href: '/',
      label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home',
      icon: LayoutDashboardIcon,
    },
    {
      href: '/receipts',
      label: lang === 'bn' ? 'রশিদ' : 'Receipts',
      icon: ReceiptIcon,
    },
    {
      href: '/new',
      label: lang === 'bn' ? 'নতুন' : 'Create',
      icon: PlusIcon,
      isPrimary: true,
    },
    {
      href: '/customers',
      label: lang === 'bn' ? 'গ্রাহক' : 'Customers',
      icon: UsersIcon,
    },
    {
      href: '/settings',
      label: lang === 'bn' ? 'সেটিংস' : 'Settings',
      icon: SettingsIcon,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          if (link.isPrimary) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative -top-4 flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-active:scale-95 transition">
                  <Icon size={24} className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-0.5">{link.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition ${
                isActive ? 'text-emerald-700 font-bold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-neutral-400'} />
              <span className="text-[10px] mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
