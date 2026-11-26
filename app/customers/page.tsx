'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { Business, Customer } from '../../lib/types';
import { formatCurrency } from '../../lib/format';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';

export default function CustomersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
    setCustomers(StorageService.getCustomers());
  }, []);

  const currentBiz = activeBiz || (businesses[0] ?? {
    id: 'biz_1',
    name: 'Bengal Gadget Studio',
    category: 'Electronics & Smart Tech',
    address: 'House #42, Road #11, Banani, Dhaka-1213',
    phone: '+880 1711-000000',
    bin: '002345891-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  });

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) {
    return <div className="min-h-screen bg-[#F1F5F9]"></div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-[1440px] mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">Customer Directory</h2>
            <p className="text-xs text-slate-500">
              CRM profiles with lifetime South Asian BDT spend
            </p>
          </div>
          <div className="sm:w-64">
            <input
              type="text"
              value={search}
              suppressHydrationWarning
              placeholder="Search customer..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-display font-bold text-sm flex items-center justify-center shrink-0">
                  {c.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900 truncate">{c.name}</h4>
                  <p className="text-xs text-slate-500">{c.phone}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {c.receipts} receipts · {c.lastVisit}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-display font-bold text-sm text-emerald-700">
                  {formatCurrency(c.totalSpent, lang === 'bn')}
                </p>
                <button
                  onClick={() => router.push('/new')}
                  className="mt-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors"
                >
                  + New Bill
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav lang={lang} />

      <BusinessDrawer
        isOpen={isStoreDrawerOpen}
        onClose={() => setIsStoreDrawerOpen(false)}
        businesses={businesses}
        activeBusiness={currentBiz}
        onSelectBusiness={(b) => {
          setActiveBiz(b);
          StorageService.setActiveBusiness(b.id);
        }}
        lang={lang}
      />
    </div>
  );
}
