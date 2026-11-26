'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { Business, LogoLockup } from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { SlipDoLogo } from '../../components/SlipDoLogo';
import { SSLCommerzModal } from '../../components/SSLCommerzModal';
import { CheckIcon } from '../../components/Icons';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [logoLockup, setLogoLockup] = useState<LogoLockup>('voucher-check');
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [isSslModalOpen, setIsSslModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setBusinesses(StorageService.getBusinesses());
    setActiveBiz(StorageService.getActiveBusiness());
    setLogoLockup(StorageService.getLogoLockup());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogoChange = (lockup: LogoLockup) => {
    setLogoLockup(lockup);
    StorageService.setLogoLockup(lockup);
    showToast(`Logo lockup switched to: ${lockup === 'voucher-check' ? 'Voucher + Checkmark' : 'Monogram S'}`);
  };

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

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        {toast && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg animate-fade-in flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        <div>
          <h2 className="font-display font-bold text-xl text-slate-900">Settings & Branding</h2>
          <p className="text-xs text-slate-500">
            Manage your store details, logo lockup preference, and subscription tiers
          </p>
        </div>

        {/* Logo Lockup Concept (Designer Decision) Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">
              Logo Lockup Concept (Designer Decision)
            </h3>
            <p className="text-xs text-slate-500">
              Click to preview both options live in the app header and templates
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleLogoChange('voucher-check')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                logoLockup === 'voucher-check'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlipDoLogo lockup="voucher-check" size={40} />
              <div>
                <p className="font-display font-bold text-xs text-slate-900">Concept A: Voucher + Checkmark</p>
                <p className="text-[11px] text-slate-500">Perforated ticket edges with verified checkmark</p>
                {logoLockup === 'voucher-check' && (
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    CURRENT SELECTION
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => handleLogoChange('monogram-s')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                logoLockup === 'monogram-s'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlipDoLogo lockup="monogram-s" size={40} />
              <div>
                <p className="font-display font-bold text-xs text-slate-900">Concept B: Monogram "S"</p>
                <p className="text-[11px] text-slate-500">Sleek fintech curve with accent dot</p>
                {logoLockup === 'monogram-s' && (
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    CURRENT SELECTION
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Business Storefront Details */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">Active Business Profile</h3>
              <p className="text-xs text-slate-500">This information appears on all printed & shared receipts</p>
            </div>
            <button
              onClick={() => setIsStoreDrawerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
            >
              Switch Store
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Name</span>
              <span className="font-bold text-slate-900 text-sm">{currentBiz.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
              <span className="font-semibold text-slate-800">{currentBiz.category}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
              <span className="font-semibold text-slate-800">{currentBiz.phone}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">BIN / Tax ID</span>
              <span className="font-mono font-bold text-slate-800">{currentBiz.bin}</span>
            </div>
          </div>
        </div>

        {/* Subscription Plans Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Subscription Plans</h3>
              <p className="text-xs text-slate-500">Supports bKash, Nagad, Rocket and Cards via SSLCommerz</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              FREE ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Tier */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-display font-bold text-sm text-slate-800">Free Tier</span>
                <span className="font-display font-extrabold text-base text-slate-900">৳০ / month</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>30 receipts per month</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1-Click WhatsApp sharing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Standard voucher templates</span>
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-display font-bold text-sm text-emerald-950">SlipDo Pro</span>
                <span className="font-display font-extrabold text-base text-emerald-900">৳৪৯৯ / month</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Unlimited</strong> receipts</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>All 5 Premium Templates</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Custom logo & no watermark</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100 SMS notifications / mo</span>
                </li>
              </ul>
              <button
                onClick={() => setIsSslModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                Upgrade with SSLCommerz (bKash)
              </button>
            </div>
          </div>
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

      <SSLCommerzModal
        isOpen={isSslModalOpen}
        onClose={() => setIsSslModalOpen(false)}
        onSuccess={(gw) => {
          showToast(`Upgraded to SlipDo Pro via ${gw}!`);
        }}
      />
    </div>
  );
}
