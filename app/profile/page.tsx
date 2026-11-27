'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business } from '../../lib/types';
import {
  UserIcon,
  BadgeCheckIcon,
  BuildingIcon,
  ShieldCheckIcon,
  PrinterIcon,
  GlobeIcon,
  CheckIcon,
  CreditCardIcon,
  FileTextIcon,
  ZapIcon,
  LockIcon,
  ExternalLinkIcon,
} from '../../components/Icons';

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile form state
  const [merchantName, setMerchantName] = useState('Store Owner');
  const [merchantEmail, setMerchantEmail] = useState('merchant@mystore.bd');
  const [merchantPhone, setMerchantPhone] = useState('+880 1700-000000');
  const [thermalSize, setThermalSize] = useState<'58mm' | '80mm'>('80mm');
  const [autoSms, setAutoSms] = useState(true);
  const [pinProtected, setPinProtected] = useState(true);

  useEffect(() => {
    setMounted(true);
    const session = supabase.getSession();
    const authUser = StorageService.getAuthUser();
    if (!session && !authUser) {
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
    const bizList = StorageService.getBusinesses();
    setBusinesses(bizList);
    const current = StorageService.getActiveBusiness();
    setActiveBiz(current);

    if (authUser) {
      if (authUser.name) setMerchantName(authUser.name);
      if (authUser.email) setMerchantEmail(authUser.email);
      if (authUser.phone) setMerchantPhone(authUser.phone);
    }
  }, [router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeBiz) {
      const updatedBiz = {
        ...activeBiz,
        phone: merchantPhone || activeBiz.phone,
      };
      StorageService.saveBusiness(updatedBiz);
      setActiveBiz(updatedBiz);

      const session = supabase.getSession();
      if (session?.user?.id) {
        await supabaseDb.saveBusiness(updatedBiz, session.user.id).catch(console.error);
      }
    }
    showToast(lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে' : 'Profile updated successfully!');
  };

  if (!mounted || !isAuthenticated || !activeBiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-10">
      <Navbar
        business={activeBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-display font-extrabold text-xl shadow-md shrink-0">
                {merchantName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SO'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 leading-tight">
                    {merchantName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <BadgeCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Merchant</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Store Owner</span>
                  <span>·</span>
                  <span>{merchantEmail}</span>
                  <span>·</span>
                  <span className="font-mono">{merchantPhone}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                Merchant ID: <strong className="font-mono text-slate-900">#BD-84920</strong>
              </span>
            </div>
          </div>
        </div>

        {/* SaaS Subscription & Quotas */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-5 sm:p-6 shadow-elevated">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                <ZapIcon className="w-3 h-3 text-emerald-400" />
                <span>Active Subscription</span>
              </div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                SlipDo Pro Merchant Tier
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                ৳৪৯৯ / month · Next billing renewal on <strong>December 28, 2026</strong>
              </p>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto">
              <div className="inline-block px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold backdrop-blur-xs">
                Usage: <span className="font-mono text-emerald-300 font-bold">{StorageService.getReceipts().length}</span> / Unlimited Receipts
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> All 5 Templates Unlocked
              </span>
              <span className="flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp & SMS API
              </span>
              <span className="flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> No Watermark
              </span>
            </div>
            <Link
              href="/settings"
              className="text-emerald-300 hover:text-emerald-200 font-semibold inline-flex items-center gap-1 underline underline-offset-2"
            >
              <span>Manage Billing & Invoices</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Merchant & Storefront Details */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-emerald-700" />
              <h3 className="font-display font-bold text-base text-slate-900">
                {lang === 'bn' ? 'ব্যবসায়িক তথ্য ও প্রতিষ্ঠান' : 'Business & Storefront Profile'}
              </h3>
            </div>
            <button
              onClick={() => setIsStoreDrawerOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              Switch Storefront
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Active Store Name
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                {activeBiz.name}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category / Industry
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                {activeBiz.category}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Trade License No.
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
                {activeBiz.bin ? `TRAD/DNCC/${activeBiz.bin.slice(0, 6)}/2026` : 'Pending Registration'}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                BIN / Tax Identifier
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
                {activeBiz.bin || 'Pending TIN/BIN'}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Outlet / Store Address
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                {activeBiz.address}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Contact & Account Preferences */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-5"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <UserIcon className="w-5 h-5 text-emerald-700" />
            <h3 className="font-display font-bold text-base text-slate-900">
              {lang === 'bn' ? 'ব্যক্তিগত তথ্য ও প্রিফারেন্স' : 'Account Details & Hardware Settings'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={merchantEmail}
                onChange={(e) => setMerchantEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp / Phone Number
              </label>
              <input
                type="tel"
                value={merchantPhone}
                onChange={(e) => setMerchantPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Hardware & Automation Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Default Thermal POS Roll Size
                </p>
                <p className="text-[11px] text-slate-500">
                  Standard roll width for USB / Bluetooth ESC/POS printers
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setThermalSize('58mm')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    thermalSize === '58mm'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => setThermalSize('80mm')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    thermalSize === '80mm'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  80mm
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Automated SMS Notification
                </p>
                <p className="text-[11px] text-slate-500">
                  Send instant SMS with short verification link on receipt creation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoSms(!autoSms)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  autoSms ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoSms ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Require PIN for Voiding or Deleting Slips
                </p>
                <p className="text-[11px] text-slate-500">
                  Prevents staff from accidentally deleting recorded payment records
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPinProtected(!pinProtected)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  pinProtected ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    pinProtected ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs shadow-sm transition-all"
            >
              Save Profile Changes
            </button>
          </div>
        </form>

        {/* Security & Active Devices */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-700" />
            <h3 className="font-display font-bold text-base text-slate-900">
              Security & Active Terminals
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Android Termux Browser (This Device)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Dhaka, Bangladesh · Active now
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Current
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    POS Counter Windows PC (Edge)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Elephant Road Outlet · Last active 2 hours ago
                  </p>
                </div>
              </div>
              <button
                onClick={() => showToast('Session revoked successfully')}
                className="text-[11px] font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out / Danger Zone */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-red-200/80 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-display font-bold text-sm text-red-900">
              Session & Offline Data
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Cached vouchers are securely saved in local IndexedDB storage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                showToast('All local cache refreshed and synced');
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              Sync Cache
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                StorageService.clearAuthSession();
                showToast('Signed out of merchant session');
                setTimeout(() => {
                  router.push('/login');
                }, 400);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>

      <BottomNav lang={lang} />

      <BusinessDrawer
        isOpen={isStoreDrawerOpen}
        onClose={() => setIsStoreDrawerOpen(false)}
        businesses={businesses}
        activeBusiness={activeBiz}
        onSelectBusiness={(b) => {
          setActiveBiz(b);
          StorageService.setActiveBusiness(b.id);
          showToast(`Switched storefront to ${b.name}`);
        }}
        onAddBusiness={(newBiz) => {
          const updated = [...businesses, newBiz];
          setBusinesses(updated);
          setActiveBiz(newBiz);
          StorageService.saveBusiness(newBiz);
          StorageService.setActiveBusiness(newBiz.id);
          showToast(`New branch "${newBiz.name}" created!`);
        }}
        lang={lang}
      />
    </div>
  );
}
