'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business, LogoLockup, Currency } from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { SlipDoLogo } from '../../components/SlipDoLogo';
import { SSLCommerzModal } from '../../components/SSLCommerzModal';
import { CheckIcon, BuildingIcon, PrinterIcon, CreditCardIcon, ExternalLinkIcon, ShieldCheckIcon } from '../../components/Icons';

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [logoLockup, setLogoLockup] = useState<LogoLockup>('voucher-check');
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [isSslModalOpen, setIsSslModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Editable Form State
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeBin, setStoreBin] = useState('');
  const [storeCurrency, setStoreCurrency] = useState<Currency>('BDT');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>('58mm');

  useEffect(() => {
    setMounted(true);
    const session = supabase.getSession();
    const authUser = StorageService.getAuthUser();
    if (!session && !authUser) {
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
    const bList = StorageService.getBusinesses();
    const active = StorageService.getActiveBusiness();
    setBusinesses(bList);
    setActiveBiz(active);
    setLogoLockup(StorageService.getLogoLockup());

    if (active) {
      setStoreName(active.name);
      setStoreCategory(active.category);
      setStoreAddress(active.address);
      setStorePhone(active.phone);
      setStoreBin(active.bin);
      setStoreCurrency(active.currency || 'BDT');
      setLogoUrl(active.logoUrl || '');
    }
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

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoUrl(dataUrl);
      showToast('Store logo uploaded! Click Save to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBiz) return;

    const updatedBiz: Business = {
      ...activeBiz,
      name: storeName.trim() || activeBiz.name,
      category: storeCategory.trim() || activeBiz.category,
      address: storeAddress.trim() || activeBiz.address,
      phone: storePhone.trim() || activeBiz.phone,
      bin: storeBin.trim() || activeBiz.bin,
      currency: storeCurrency,
      currencySymbol: storeCurrency === 'USD' ? '$' : storeCurrency === 'EUR' ? '€' : storeCurrency === 'INR' ? '₹' : '৳',
      logoUrl: logoUrl || undefined,
    };

    StorageService.saveBusiness(updatedBiz);
    setActiveBiz(updatedBiz);
    setBusinesses((prev) => prev.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));

    const session = supabase.getSession();
    if (session?.user?.id) {
      await supabaseDb.saveBusiness(updatedBiz, session.user.id).catch(console.error);
    }

    showToast('Storefront settings updated successfully!');
  };

  const currentBiz = activeBiz || (businesses[0] ?? {
    id: 'biz_default',
    name: 'My Store',
    category: 'General Retail & Services',
    address: 'Dhaka, Bangladesh',
    phone: '+880 1700-000000',
    bin: '000000000-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  });

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {toast && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg animate-fade-in flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">Settings & Storefront Branding</h2>
          <p className="text-xs text-slate-500">
            Configure your store logo, billing defaults, VAT details, and thermal POS settings.
          </p>
        </div>

        {/* Store Profile & Logo Form */}
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BuildingIcon className="w-5 h-5 text-emerald-700" />
            <h3 className="font-display font-bold text-base text-slate-900">Store Profile & Branding</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store / Outlet Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Industry / Category</label>
              <input
                type="text"
                value={storeCategory}
                onChange={(e) => setStoreCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">BIN / VAT Registration No.</label>
              <input
                type="text"
                value={storeBin}
                onChange={(e) => setStoreBin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Outlet Address</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Custom Store Logo Upload */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Custom Storefront Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Store logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <SlipDoLogo size={32} />
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoFileUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">Recommended: PNG or SVG with transparent background, max 2MB.</p>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl('');
                      showToast('Logo removed');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Remove Custom Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Currency & Thermal POS Settings */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Currency</label>
              <select
                value={storeCurrency}
                onChange={(e) => setStoreCurrency(e.target.value as Currency)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="BDT">BDT (৳) — Bangladeshi Taka</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="INR">INR (₹) — Indian Rupee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thermal POS Paper Roll Width</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThermalWidth('58mm')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    thermalWidth === '58mm' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  58mm (Small Roll)
                </button>
                <button
                  type="button"
                  onClick={() => setThermalWidth('80mm')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    thermalWidth === '80mm' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  80mm (Standard POS)
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft transition-all"
            >
              Save Storefront Settings
            </button>
          </div>
        </form>

        {/* Logo Lockup Concept Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft space-y-3">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">
              SlipDo Brand Lockup Preference
            </h3>
            <p className="text-xs text-slate-500">
              Select your preferred logo style for navigation and digital slip footers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleLogoChange('voucher-check')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                logoLockup === 'voucher-check'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlipDoLogo lockup="voucher-check" size={40} />
              <div>
                <p className="text-xs font-bold text-slate-900">Voucher + Checkmark</p>
                <p className="text-[11px] text-slate-500">Traditional receipt paper with verification notch</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleLogoChange('monogram-s')}
              className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                logoLockup === 'monogram-s'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlipDoLogo lockup="monogram-s" size={40} />
              <div>
                <p className="text-xs font-bold text-slate-900">Monogram S Mark</p>
                <p className="text-[11px] text-slate-500">Modern geometric curve with fold lines</p>
              </div>
            </button>
          </div>
        </div>

        {/* Subscription & Billing Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-bold text-sm text-slate-900">SlipDo Pro Merchant Tier</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">৳৪৯৯ / month · Next billing renewal on December 28, 2026</p>
            </div>
          </div>

          <button
            onClick={() => setIsSslModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0"
          >
            Manage via SSLCommerz
          </button>
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
        onAddBusiness={(newBiz) => {
          const updated = [...businesses, newBiz];
          setBusinesses(updated);
          setActiveBiz(newBiz);
          StorageService.saveBusiness(newBiz);
          StorageService.setActiveBusiness(newBiz.id);
          showToast(`Storefront "${newBiz.name}" added!`);
        }}
        lang={lang}
      />

      <SSLCommerzModal
        isOpen={isSslModalOpen}
        onClose={() => setIsSslModalOpen(false)}
        onSuccess={(method) => {
          showToast(`Pro Tier renewed successfully via ${method}!`);
        }}
      />
    </div>
  );
}
