'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { CountryCodeSelect } from '../../components/CountryCodeSelect';
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
  Trash2Icon,
  AlertCircleIcon,
  XIcon,
  ShieldAlertIcon,
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

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // User Profile form state
  const [merchantName, setMerchantName] = useState('Store Owner');
  const [merchantEmail, setMerchantEmail] = useState('merchant@mystore.bd');
  const [merchantCountryCode, setMerchantCountryCode] = useState('BD');
  const [merchantPhone, setMerchantPhone] = useState('1700-000000');
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
      if (authUser.phone) {
        const raw = authUser.phone;
        if (raw.startsWith('+880')) {
          setMerchantCountryCode('BD');
          setMerchantPhone(raw.replace('+880', '').trim());
        } else {
          setMerchantPhone(raw);
        }
      }
    }
  }, [router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm account removal');
      return;
    }

    setIsDeleting(true);
    try {
      const session = supabase.getSession();
      if (session?.user?.id) {
        await supabaseDb.deleteAccount(session.user.id);
      }
      await supabase.auth.signOut();
      StorageService.wipeAllUserData();
      showToast('Merchant account and all data permanently deleted.');
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    } catch (err: any) {
      showToast('Error deleting account: ' + (err?.message || 'Unknown error'));
      setIsDeleting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefixMap: Record<string, string> = {
      BD: '+880',
      US: '+1',
      GB: '+44',
      IN: '+91',
      AE: '+971',
      SA: '+966',
      SG: '+65',
      MY: '+60',
      PK: '+92',
      CA: '+1',
      AU: '+61',
    };
    const codePrefix = prefixMap[merchantCountryCode] || '+880';
    const cleanNum = merchantPhone.replace(/^[+\d\s-]+/, (m) => (m.startsWith('+') ? '' : m)).trim();
    const formattedPhone = cleanNum ? `${codePrefix} ${cleanNum}` : '+880 1700-000000';

    if (activeBiz) {
      const updatedBiz = {
        ...activeBiz,
        phone: formattedPhone,
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 md:pb-10 font-sans">
      <Navbar
        business={activeBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {toastMessage && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xl animate-fade-in flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-display font-extrabold text-xl shadow-md shrink-0">
                {merchantName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SO'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 leading-tight">
                    {merchantName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/60">
                    <BadgeCheckIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Verified Merchant</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Store Owner</span>
                  <span>·</span>
                  <span>{merchantEmail}</span>
                  <span>·</span>
                  <span className="font-mono">+{merchantCountryCode} {merchantPhone}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                Merchant ID: <strong className="font-mono text-slate-900">#BD-84920</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-3xl p-5 sm:p-6 shadow-elevated">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                <ZapIcon className="w-3 h-3 text-blue-400" />
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
              <div className="inline-block px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs">
                Usage: <span className="font-mono text-blue-300 font-bold">{StorageService.getReceipts().length}</span> / Unlimited Receipts
              </div>
            </div>
          </div>
        </div>

        {/* Storefront Overview Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-display font-bold text-base text-slate-900">
                {lang === 'bn' ? 'ব্যবসায়িক তথ্য ও প্রতিষ্ঠান' : 'Business & Storefront Profile'}
              </h3>
            </div>
            <button
              onClick={() => setIsStoreDrawerOpen(true)}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full transition-colors border border-blue-200/60"
            >
              Switch Storefront
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Active Store Name
              </label>
              <div className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                {activeBiz.name}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category / Industry
              </label>
              <div className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800">
                {activeBiz.category}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                BIN / Tax Identifier
              </label>
              <div className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
                {activeBiz.bin || 'Pending TIN/BIN'}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <div className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
                {activeBiz.phone}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Outlet Address
              </label>
              <div className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800">
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
            <UserIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-bold text-base text-slate-900">
              {lang === 'bn' ? 'ব্যক্তিগত তথ্য ও প্রিফারেন্স' : 'Account Details & Hardware Settings'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={merchantEmail}
                onChange={(e) => setMerchantEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp / Phone Number
              </label>
              <div className="flex items-center gap-1.5">
                <CountryCodeSelect
                  value={merchantCountryCode}
                  onChange={setMerchantCountryCode}
                  className="w-32 shrink-0"
                />
                <input
                  type="tel"
                  value={merchantPhone}
                  onChange={(e) => setMerchantPhone(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-[0.99]"
            >
              Save Profile Changes
            </button>
          </div>
        </form>

        {/* Security & Active Devices */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-bold text-base text-slate-900">
              Security & Active Terminals
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
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
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                Current
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
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
                className="text-[11px] font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-full transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out / Danger Zone */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900">
              Active Session & Local Cache
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Cached vouchers are securely saved in user-scoped storage and synced to cloud ledger.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                showToast('All local cache refreshed and synced');
              }}
              className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
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
              className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="bg-rose-50/60 rounded-3xl p-5 sm:p-6 border border-rose-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="w-4 h-4 text-rose-600" />
              <h4 className="font-display font-bold text-sm text-rose-950">
                Danger Zone: Delete Merchant Account
              </h4>
            </div>
            <p className="text-xs text-rose-800/80">
              Permanently wipe your merchant profile, all generated receipts, customer lists, and cloud credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setIsDeleteModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Trash2Icon className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2Icon className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Permanently Delete Account?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This action is non-reversible. All your registered stores, voucher receipts, customer history, and authentication sessions will be permanently purged from the database.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs">
              <p className="font-bold mb-1">To proceed, please type DELETE below:</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-rose-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Permanently Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
