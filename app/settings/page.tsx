'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business, LogoLockup, Currency, CustomTemplateConfig } from '../../lib/types';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessDrawer } from '../../components/BusinessDrawer';
import { SlipDoLogo } from '../../components/SlipDoLogo';
import { CountryCodeSelect } from '../../components/CountryCodeSelect';
import { SSLCommerzModal } from '../../components/SSLCommerzModal';
import {
  CheckIcon,
  BuildingIcon,
  PrinterIcon,
  ShieldCheckIcon,
  LockIcon,
  SparklesIcon,
  XIcon,
  Trash2Icon,
  ShieldAlertIcon,
} from '../../components/Icons';

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

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Store Profile State
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCountryCode, setStoreCountryCode] = useState('BD');
  const [storePhone, setStorePhone] = useState('');
  const [storeBin, setStoreBin] = useState('');
  const [storeCurrency, setStoreCurrency] = useState<Currency>('BDT');
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>('58mm');

  // Custom Template Studio State
  const [customAccent, setCustomAccent] = useState('#2563eb');
  const [customLayout, setCustomLayout] = useState<'split' | 'centered' | 'minimal'>('split');
  const [customFont, setCustomFont] = useState<'sans' | 'mono' | 'serif'>('sans');
  const [showLogo, setShowLogo] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showBin, setShowBin] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [customFooter, setCustomFooter] = useState('Thank you for shopping with us! Valid warranty with verified digital slip.');
  const [badgeText, setBadgeText] = useState('OFFICIAL TAX INVOICE');

  // Signature Canvas Drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasCanvasSignature, setHasCanvasSignature] = useState(false);

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
      setStoreName(active.name || '');
      setStoreCategory(active.category || '');
      setStoreAddress(active.address || '');
      setStoreBin(active.bin || '');
      setStoreCurrency(active.currency || 'BDT');
      setLogoUrl(active.logoUrl || '');
      setSignatureUrl(active.signatureUrl || '');

      // Parse phone into country code and subscriber number
      const fullPhone = active.phone || '';
      if (fullPhone.startsWith('+880')) {
        setStoreCountryCode('BD');
        setStorePhone(fullPhone.replace('+880', '').trim());
      } else if (fullPhone.startsWith('+1')) {
        setStoreCountryCode('US');
        setStorePhone(fullPhone.replace('+1', '').trim());
      } else if (fullPhone.startsWith('+44')) {
        setStoreCountryCode('GB');
        setStorePhone(fullPhone.replace('+44', '').trim());
      } else if (fullPhone.startsWith('+91')) {
        setStoreCountryCode('IN');
        setStorePhone(fullPhone.replace('+91', '').trim());
      } else {
        setStorePhone(fullPhone);
      }

      // Load custom template config if available
      if (active.customTemplate) {
        setCustomAccent(active.customTemplate.accentColor || '#2563eb');
        setCustomLayout(active.customTemplate.headerLayout || 'split');
        setCustomFont(active.customTemplate.fontFamily || 'sans');
        setShowLogo(active.customTemplate.showLogo !== false);
        setShowPhone(active.customTemplate.showPhone !== false);
        setShowAddress(active.customTemplate.showAddress !== false);
        setShowBin(active.customTemplate.showBin !== false);
        setShowQr(active.customTemplate.showQrCode !== false);
        setShowSignature(active.customTemplate.showSignature !== false);
        setCustomFooter(active.customTemplate.customFooterText || 'Thank you for shopping with us!');
        setBadgeText(active.customTemplate.badgeText || 'OFFICIAL TAX INVOICE');
      }
    }
  }, [router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
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

  // --- Signature Canvas Helpers ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasCanvasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasCanvasSignature(false);
  };

  const applyCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasCanvasSignature) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
    showToast('Signature captured! Click Save to apply across all receipts.');
  };

  // --- File Uploads ---
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

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Signature file size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSignatureUrl(dataUrl);
      showToast('Signature image uploaded! Click Save to apply.');
    };
    reader.readAsDataURL(file);
  };

  // --- Save Settings ---
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeBiz) return;

    // Build country prefix
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
    const codePrefix = prefixMap[storeCountryCode] || '+880';
    const cleanNumber = storePhone.replace(/^[+\d\s-]+/, (match) => {
      return match.startsWith('+') ? '' : match;
    }).trim();
    const formattedPhone = cleanNumber ? `${codePrefix} ${cleanNumber}` : (activeBiz.phone || '+880 1700-000000');

    const customTemplateConfig: CustomTemplateConfig = {
      accentColor: customAccent,
      primaryColor: customAccent,
      fontFamily: customFont,
      headerLayout: customLayout,
      showLogo,
      showPhone,
      showAddress,
      showBin,
      showQrCode: showQr,
      showSignature,
      customFooterText: customFooter,
      badgeText,
    };

    const updatedBiz: Business = {
      ...activeBiz,
      name: storeName.trim() || activeBiz.name,
      category: storeCategory.trim() || activeBiz.category,
      address: storeAddress.trim() || activeBiz.address,
      phone: formattedPhone,
      bin: storeBin.trim() || activeBiz.bin,
      currency: storeCurrency,
      currencySymbol: storeCurrency === 'USD' ? '$' : storeCurrency === 'EUR' ? '€' : storeCurrency === 'INR' ? '₹' : '৳',
      logoUrl: logoUrl || undefined,
      signatureUrl: signatureUrl || undefined,
      customTemplate: customTemplateConfig,
    };

    const updatedList = businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
    StorageService.saveBusiness(updatedBiz);
    setActiveBiz(updatedBiz);
    setBusinesses(updatedList);

    const session = supabase.getSession();
    if (session?.user?.id) {
      StorageService.setCloudBusinesses(session.user.id, updatedList);
      await supabaseDb.saveBusiness(updatedBiz, session.user.id).catch(console.error);
    }

    showToast('Storefront profile & custom template updated successfully!');
  };

  const currentBiz = activeBiz || (businesses[0] ?? {
    id: 'biz_default',
    name: 'Merchant Store',
    category: 'General Retail & Services',
    address: 'Dhaka, Bangladesh',
    phone: '+880 1700-000000',
    bin: '000000000-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  });

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-10 font-sans">
      <Navbar
        business={currentBiz}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenStoreDrawer={() => setIsStoreDrawerOpen(true)}
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {toast && (
          <div className="fixed top-20 right-5 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xl animate-fade-in flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Settings & Storefront Branding
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure your store logo, digital signature, custom template layout, and billing preferences.
          </p>
        </div>

        {/* 1. STORE PROFILE & IDENTITY */}
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BuildingIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Store Profile & Identity</h3>
              <p className="text-[11px] text-slate-400">Official business information rendered on customer receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store / Outlet Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Industry / Category</label>
              <input
                type="text"
                value={storeCategory}
                onChange={(e) => setStoreCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
              <div className="flex items-center gap-2">
                <CountryCodeSelect
                  value={storeCountryCode}
                  onChange={setStoreCountryCode}
                  className="w-36 shrink-0"
                />
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="1700-000000"
                  className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">BIN / VAT Registration No.</label>
              <input
                type="text"
                value={storeBin}
                onChange={(e) => setStoreBin(e.target.value)}
                placeholder="000000000-0101"
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Outlet Address</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shop 12, Level 3, Jamuna Future Park, Dhaka"
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>

          {/* Store Logo Section */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-2">Storefront Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
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
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">PNG or SVG with transparent background recommended. Appears at top of all receipts.</p>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl('');
                      showToast('Logo removed');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Currency & POS Settings */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Currency</label>
              <select
                value={storeCurrency}
                onChange={(e) => setStoreCurrency(e.target.value as Currency)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
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
                  className={`py-2 px-3 rounded-full border text-xs font-bold transition-all ${
                    thermalWidth === '58mm' ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  58mm (Small Roll)
                </button>
                <button
                  type="button"
                  onClick={() => setThermalWidth('80mm')}
                  className={`py-2 px-3 rounded-full border text-xs font-bold transition-all ${
                    thermalWidth === '80mm' ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  80mm (Standard POS)
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.99]"
            >
              Save Store Profile
            </button>
          </div>
        </form>

        {/* 2. DIGITAL SIGNATURE STUDIO */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Digital Signature & PDF Export</h3>
                <p className="text-[11px] text-slate-400">Attached to every printed slip and PDF certificate for legal authenticity</p>
              </div>
            </div>

            {signatureUrl && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Interactive Canvas Pad */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Option A: Draw Signature Live</label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[130px] touch-none cursor-crosshair bg-white"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyCanvasSignature}
                    disabled={!hasCanvasSignature}
                    className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all disabled:opacity-40"
                  >
                    Apply Signature
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Draw with your finger or mouse cursor, then click Apply.</p>
            </div>

            {/* Right: Upload File or Active Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Option B: Upload Signature Stamp / PNG</label>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSignatureFileUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                />

                {/* Active Signature Preview */}
                {signatureUrl ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Signature</p>
                      <img src={signatureUrl} alt="Signature" className="h-10 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureUrl('');
                        showToast('Signature removed');
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3 text-slate-400 text-xs">
                    No signature loaded. Draw on the left or upload above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. CUSTOM TEMPLATE BUILDER STUDIO */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Custom Template Studio</h3>
                <p className="text-[11px] text-slate-400">Design your own customized receipt layout, colors, and visibility toggles</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold">
              Builder Active
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls: 7 cols */}
            <div className="lg:col-span-7 space-y-4">
              {/* Accent Color Palette */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Accent & Header Theme Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { hex: '#2563eb', label: 'Sapphire Blue' },
                    { hex: '#059669', label: 'Emerald' },
                    { hex: '#7c3aed', label: 'Violet' },
                    { hex: '#dc2626', label: 'Crimson' },
                    { hex: '#d97706', label: 'Amber' },
                    { hex: '#0f172a', label: 'Midnight' },
                  ].map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setCustomAccent(color.hex)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        customAccent === color.hex
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: color.hex }} />
                      <span>{color.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="w-7 h-7 rounded-full border border-slate-300 cursor-pointer overflow-hidden p-0"
                    />
                    <span className="font-mono text-xs text-slate-500 uppercase">{customAccent}</span>
                  </div>
                </div>
              </div>

              {/* Header Layout */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Header Layout Structure</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'split', title: 'Split Columns', desc: 'Store Left / Vchr Right' },
                    { id: 'centered', title: 'Centered', desc: 'Modern Clean Center' },
                    { id: 'minimal', title: 'Minimalist', desc: 'Single Row Compact' },
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setCustomLayout(layout.id as any)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        customLayout === layout.id
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/15'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className={`block text-xs font-bold ${customLayout === layout.id ? 'text-blue-900' : 'text-slate-800'}`}>
                        {layout.title}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{layout.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Font Family */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Typography Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sans', title: 'Modern Sans', preview: 'Inter / Geist' },
                    { id: 'mono', title: 'POS Monospace', preview: 'Courier / Tech' },
                    { id: 'serif', title: 'Classic Serif', preview: 'Formal / Legal' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setCustomFont(font.id as any)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        customFont === font.id
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/15'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className={`block text-xs font-bold ${customFont === font.id ? 'text-blue-900' : 'text-slate-800'}`}>
                        {font.title}
                      </span>
                      <span className="block text-[10px] text-slate-400">{font.preview}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Element Visibility Toggles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Display Elements On Receipt</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Store Logo', checked: showLogo, toggle: () => setShowLogo(!showLogo) },
                    { label: 'Phone Number', checked: showPhone, toggle: () => setShowPhone(!showPhone) },
                    { label: 'Physical Address', checked: showAddress, toggle: () => setShowAddress(!showAddress) },
                    { label: 'BIN / VAT No.', checked: showBin, toggle: () => setShowBin(!showBin) },
                    { label: 'Scannable QR', checked: showQr, toggle: () => setShowQr(!showQr) },
                    { label: 'Signature Block', checked: showSignature, toggle: () => setShowSignature(!showSignature) },
                  ].map((item, i) => (
                    <label
                      key={i}
                      onClick={item.toggle}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none ${
                        item.checked ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Badge & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Header Badge Title</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. OFFICIAL TAX INVOICE"
                    className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Footer Terms / Notice</label>
                  <input
                    type="text"
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    placeholder="e.g. 7-Day Exchange Policy"
                    className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Live Mini Preview: 5 cols */}
            <div className="lg:col-span-5 bg-slate-50 p-4 rounded-3xl border border-slate-200 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Template Preview</span>
              <div
                className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex-1 space-y-3 ${
                  customFont === 'mono' ? 'font-mono' : customFont === 'serif' ? 'font-serif' : 'font-sans'
                }`}
              >
                {/* Header mock */}
                <div
                  className={`p-3 rounded-xl text-white ${
                    customLayout === 'centered' ? 'text-center' : 'flex items-center justify-between'
                  }`}
                  style={{ backgroundColor: customAccent }}
                >
                  <div className={customLayout === 'centered' ? 'space-y-1' : ''}>
                    {showLogo && logoUrl && (
                      <img src={logoUrl} alt="" className={`h-6 object-contain mb-1 ${customLayout === 'centered' ? 'mx-auto' : ''}`} />
                    )}
                    <h4 className="font-bold text-sm leading-tight">{storeName || 'Your Store Name'}</h4>
                    {showPhone && <p className="text-[10px] opacity-90">{storePhone ? `+880 ${storePhone}` : '+880 1700-000000'}</p>}
                  </div>
                  <div className={customLayout === 'centered' ? 'mt-2 pt-2 border-t border-white/20' : 'text-right'}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-white/20 tracking-wider">
                      {badgeText}
                    </span>
                    <p className="text-[10px] opacity-80 mt-0.5">#SD-2026-1042</p>
                  </div>
                </div>

                {/* Sample items */}
                <div className="space-y-1.5 text-xs text-slate-700 py-2 border-b border-slate-100">
                  <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase border-b pb-1">
                    <span>Item</span>
                    <span>Total</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wireless Earbuds Pro</span>
                    <span className="font-bold">৳3,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fast Charging Cable</span>
                    <span className="font-bold">৳450</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 pt-1">
                  <span>Grand Total</span>
                  <span style={{ color: customAccent }}>৳3,650</span>
                </div>

                {/* Signature & QR Mockup */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[10px] text-slate-400">
                  {showQr ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[8px]">QR</div>
                      <span>Scannable</span>
                    </div>
                  ) : <div />}

                  {showSignature && (
                    <div className="text-right">
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="" className="h-6 object-contain ml-auto" />
                      ) : (
                        <span className="italic text-slate-400 font-serif">Signature</span>
                      )}
                      <p className="text-[8px] font-bold text-slate-500 uppercase border-t border-slate-300 mt-0.5">Authorized Sign</p>
                    </div>
                  )}
                </div>

                {/* Footer terms */}
                <p className="text-[9px] text-center text-slate-400 pt-1">{customFooter}</p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="mt-4 w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                Save as My Custom Template
              </button>
            </div>
          </div>
        </div>

        {/* 4. SUBSCRIPTION & BILLING */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-bold text-sm text-slate-900">SlipDo Pro Merchant Tier</h4>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">Active</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">৳৪৯৯ / month · Next billing renewal on December 28, 2026</p>
            </div>
          </div>

          <button
            onClick={() => setIsSslModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0"
          >
            Manage via SSLCommerz
          </button>
        </div>

        {/* 5. DANGER ZONE: PERMANENT ACCOUNT DELETION */}
        <div className="bg-rose-50/60 rounded-3xl p-5 sm:p-7 border border-rose-200 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="w-4 h-4 text-rose-600" />
              <h4 className="font-display font-bold text-sm text-rose-950">Danger Zone: Delete Merchant Account</h4>
            </div>
            <p className="text-xs text-rose-800/80">
              Permanently delete all stores, customer records, receipts, and login credentials. This cannot be undone.
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

      {/* Delete Confirmation Modal */}
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
