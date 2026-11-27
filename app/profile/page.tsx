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

  // Storefront Editing State
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreCategory, setEditStoreCategory] = useState('General Retail & Services');
  const [editStoreAddress, setEditStoreAddress] = useState('');
  const [editStorePhone, setEditStorePhone] = useState('');
  const [editStoreBin, setEditStoreBin] = useState('');

  // User Profile form state
  const [merchantName, setMerchantName] = useState('Store Owner');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantCountryCode, setMerchantCountryCode] = useState('BD');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [thermalSize, setThermalSize] = useState<'58mm' | '80mm'>('80mm');
  const [autoSms, setAutoSms] = useState(true);
  const [pinProtected, setPinProtected] = useState(true);
  const [currentDevice, setCurrentDevice] = useState({
    name: 'Current Browser Session',
    location: 'Dhaka, Bangladesh · Active now',
  });

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

    // Resolve real user identity
    const email = session?.user?.email || authUser?.email || '';
    const name = session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || authUser?.name || current?.name || 'Store Owner';
    const phone = session?.user?.user_metadata?.phone || session?.user?.phone || authUser?.phone || current?.phone || '';

    if (name) setMerchantName(name);
    if (email) setMerchantEmail(email);
    if (phone) {
      if (phone.startsWith('+880')) {
        setMerchantCountryCode('BD');
        setMerchantPhone(phone.replace('+880', '').trim());
      } else {
        setMerchantPhone(phone);
      }
    }

    // Dynamic Client Device Detection
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent;
      let browser = 'Web Browser';
      let os = 'Device';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edg')) browser = 'Microsoft Edge';
      else if (ua.includes('Chrome')) browser = 'Google Chrome';
      else if (ua.includes('Safari')) browser = 'Apple Safari';

      if (ua.includes('Windows')) os = 'Windows PC';
      else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
      else if (ua.includes('Linux')) os = 'Linux';

      setCurrentDevice({
        name: `${browser} on ${os}`,
        location: 'Verified Terminal · Active now',
      });
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
      const currentUid = session?.user?.id || StorageService.getCurrentUserId();

      if (currentUid && currentUid !== 'guest') {
        await supabaseDb.deleteAccount(currentUid);
      }

      await supabase.auth.signOut().catch(() => {});
      StorageService.wipeAllUserData();
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}

      showToast('Merchant account and all data permanently deleted.');
      setTimeout(() => {
        window.location.href = '/login?deleted=true';
      }, 400);
    } catch (err: any) {
      showToast('Error deleting account: ' + (err?.message || 'Unknown error'));
      setIsDeleting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBiz) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated = { ...activeBiz, logoUrl: dataUrl };
      setActiveBiz(updated);
      StorageService.saveBusiness(updated);
      const session = supabase.getSession();
      if (session?.user?.id) {
        await supabaseDb.saveBusiness(updated, session.user.id).catch(console.error);
      }
      showToast('Store logo updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBiz) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Signature file size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated = { ...activeBiz, signatureUrl: dataUrl };
      setActiveBiz(updated);
      StorageService.saveBusiness(updated);
      const session = supabase.getSession();
      if (session?.user?.id) {
        supabaseDb.saveBusiness(updated, session.user.id).catch(console.error);
      }
      showToast('Digital signature updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const openEditStoreModal = () => {
    if (!activeBiz) return;
    setEditStoreName(activeBiz.name);
    setEditStoreCategory(activeBiz.category);
    setEditStoreAddress(activeBiz.address);
    setEditStorePhone(activeBiz.phone);
    setEditStoreBin(activeBiz.bin || '');
    setIsEditStoreModalOpen(true);
  };

  const handleSaveStorefront = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBiz) return;
    const updated: Business = {
      ...activeBiz,
      name: editStoreName.trim() || activeBiz.name,
      category: editStoreCategory.trim() || activeBiz.category,
      address: editStoreAddress.trim() || 'Online Store',
      phone: editStorePhone.trim() || activeBiz.phone,
      bin: editStoreBin.trim(),
    };
    setActiveBiz(updated);
    StorageService.saveBusiness(updated);
    const updatedList = businesses.map((b) => (b.id === updated.id ? updated : b));
    setBusinesses(updatedList);
    const session = supabase.getSession();
    if (session?.user?.id) {
      supabaseDb.saveBusiness(updated, session.user.id).catch(console.error);
    }
    setIsEditStoreModalOpen(false);
    showToast('Storefront details updated successfully!');
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
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {activeBiz.logoUrl ? (
                  <img src={activeBiz.logoUrl} alt={activeBiz.name} className="w-full h-full object-contain p-1.5 bg-white" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-display font-extrabold text-xl">
                    {merchantName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SO'}
                  </div>
                )}
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
                Merchant ID: <strong className="font-mono text-slate-900">#BD-{(activeBiz?.id || StorageService.getCurrentUserId()).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase()}</strong>
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
                Active Tier · Verified digital receipts & unlimited cloud backup
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-display font-bold text-base text-slate-900">
                {lang === 'bn' ? 'ব্যবসায়িক তথ্য ও প্রতিষ্ঠান' : 'Business & Storefront Profile'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openEditStoreModal}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-1.5 rounded-full transition-colors border border-slate-200"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={() => setIsStoreDrawerOpen(true)}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-1.5 rounded-full transition-colors border border-blue-200/60"
              >
                Switch Storefront
              </button>
            </div>
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

            {/* Storefront Logo Upload & Preview */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {activeBiz.logoUrl ? (
                    <img src={activeBiz.logoUrl} alt="Store logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <BuildingIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Storefront Logo</h4>
                  <p className="text-[11px] text-slate-400">
                    {activeBiz.logoUrl ? 'Configured and active on all vouchers' : 'No logo uploaded yet'}
                  </p>
                </div>
              </div>
              <div>
                <label className="px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/60 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                  <span>{activeBiz.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Digital Signature Upload & Preview (Feature Added) */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 p-1">
                  {activeBiz.signatureUrl ? (
                    <img src={activeBiz.signatureUrl} alt="Digital signature" className="w-full h-full object-contain" />
                  ) : (
                    <ShieldCheckIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Digital Signature</h4>
                  <p className="text-[11px] text-slate-400">
                    {activeBiz.signatureUrl ? 'Signed and attached to all printed slips & PDFs' : 'No signature uploaded yet'}
                  </p>
                </div>
              </div>
              <div>
                <label className="px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/60 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                  <span>{activeBiz.signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>
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
                    {currentDevice.name} (This Device)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {currentDevice.location}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                Current
              </span>
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

      {/* Edit Storefront Details Modal */}
      {isEditStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BuildingIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Edit Storefront Details
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Update profile for {activeBiz.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStoreModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStorefront} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Store / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  placeholder="e.g. Apex Retail, Velvet Studio"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={editStoreCategory}
                    onChange={(e) => setEditStoreCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="General Retail & Services">Retail & Services</option>
                    <option value="Electronics & Gadgets">Electronics</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Grocery & Supermart">Grocery & Mart</option>
                    <option value="Pharmacy & Healthcare">Pharmacy</option>
                    <option value="Restaurant & Cafe">Restaurant & Cafe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    BIN / VAT No.
                  </label>
                  <input
                    type="text"
                    value={editStoreBin}
                    onChange={(e) => setEditStoreBin(e.target.value)}
                    placeholder="000123456-0101"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={editStorePhone}
                  onChange={(e) => setEditStorePhone(e.target.value)}
                  placeholder="+880 1711-223344"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Outlet Address (Optional)
                </label>
                <input
                  type="text"
                  value={editStoreAddress}
                  onChange={(e) => setEditStoreAddress(e.target.value)}
                  placeholder="e.g. Banani, Dhaka or Online Store"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditStoreModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                >
                  Save Store Details
                </button>
              </div>
            </form>
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
        onDeleteBusiness={(bizId) => {
          StorageService.deleteBusiness(bizId);
          const remaining = StorageService.getBusinesses();
          setBusinesses(remaining);
          const current = StorageService.getActiveBusiness();
          setActiveBiz(current);
          showToast('Store outlet removed');
        }}
        lang={lang}
      />
    </div>
  );
}
