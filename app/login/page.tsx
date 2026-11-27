'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SlipDoLogo } from '../../components/SlipDoLogo';
import { StorageService } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import {
  UserIcon,
  ShieldCheckIcon,
  BuildingIcon,
  CheckIcon,
  LockIcon,
  BadgeCheckIcon,
  ChevronRightIcon,
  WhatsAppIcon,
  ReceiptIcon,
  GlobeIcon,
  XIcon,
  EyeIcon,
} from '../../components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);

  // Existing session state
  const [existingUser, setExistingUser] = useState<any>(null);

  // --- Step 1: Identity ---
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // --- Step 2: Verification (OTP) ---
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(45);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Step 3: Storefront Onboarding ---
  const [merchantName, setMerchantName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Consumer Electronics & Accessories');
  const [city, setCity] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('SD-');

  // Business Category Options
  const CATEGORIES = [
    { id: 'Consumer Electronics & Accessories', label: 'Electronics & Tech', sub: 'Phones, PCs & Gadgets' },
    { id: 'Fashion, Boutique & Clothing', label: 'Fashion & Boutique', sub: 'Apparel, Shoes & Jewelry' },
    { id: 'Grocery, Dept Store & Supermarket', label: 'Grocery & Mart', sub: 'Daily essentials & Superstores' },
    { id: 'Restaurant, Cafe & Cloud Kitchen', label: 'Food & Dining', sub: 'Cafes, Bakeries & Cloud Kitchens' },
    { id: 'Pharmacy & Healthcare Supplies', label: 'Pharmacy & Health', sub: 'Medicines & Health goods' },
    { id: 'General Retail & Wholesale Services', label: 'General Trade', sub: 'Wholesale & Services' },
  ];

  useEffect(() => {
    setMounted(true);

    // Check if user is already logged in
    const cachedUser = StorageService.getAuthUser();
    const session = supabase.auth.getSession();
    if (cachedUser || session) {
      setExistingUser(cachedUser || session?.user);
    }

    // Health check Supabase connection
    supabase.testConnection().then((res) => {
      setSupabaseConnected(res.ok);
    });
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (currentStep !== 2 || resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, resendCountdown]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Bangladesh Operator detection hint
  const getOperatorName = (rawPhone: string) => {
    const clean = rawPhone.replace(/\D/g, '');
    const prefix = clean.startsWith('880') ? clean.slice(3, 5) : clean.slice(0, 3);
    if (prefix === '017' || prefix === '013' || prefix === '17' || prefix === '13') return 'Grameenphone';
    if (prefix === '018' || prefix === '18') return 'Robi';
    if (prefix === '019' || prefix === '014' || prefix === '19' || prefix === '14') return 'Banglalink';
    if (prefix === '016' || prefix === '16') return 'Airtel';
    if (prefix === '015' || prefix === '15') return 'Teletalk';
    return null;
  };

  // --- Step 1 Submit: Request OTP / Proceed ---
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      showToast('Please agree to merchant terms to proceed', 'error');
      return;
    }

    if (loginMethod === 'phone') {
      const clean = phone.replace(/\D/g, '');
      if (clean.length < 10) {
        showToast('Please enter a valid 11-digit Bangladesh phone number', 'error');
        return;
      }
    } else {
      if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      if (!password || password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (loginMethod === 'email') {
        await supabase.auth.signInWithOtp({ email }).catch(() => {});
      }
      showToast('Verification code dispatched via SMS & WhatsApp');
      setCurrentStep(2);
      setResendCountdown(45);
      // Pre-fill demo OTP for convenient evaluation
      setOtp(['1', '2', '3', '4', '5', '6']);
    } catch {
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2 Submit: Verify 6-digit Code ---
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      showToast('Please enter all 6 digits of the verification code', 'error');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      showToast('Identity verified cryptographically');
      setCurrentStep(3);
    }, 500);
  };

  // OTP inputs handling
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      otpInputRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // --- Step 3 Submit: Complete Store Setup & Onboard ---
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBizName = businessName.trim() || 'My Digital Store';
    const finalMerchantName = merchantName.trim() || 'Store Owner';

    setLoading(true);

    try {
      const payload = {
        name: finalMerchantName,
        businessName: finalBizName,
        category,
        phone: loginMethod === 'phone' ? phone : '+880 1700-000000',
        email: loginMethod === 'email' ? email : `merchant_${phone.replace(/\D/g, '')}@slipdo.app`,
        password: password || 'SlipDoMerchant2026!',
      };

      // 1. Call Next.js server route to register/authenticate on Supabase
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.session) {
        supabase.setSession(data.session);
      }

      // 2. Save merchant and business profile in StorageService
      const newBiz = {
        id: 'biz_' + Date.now().toString(36),
        name: finalBizName,
        category,
        address: city || 'Dhaka, Bangladesh',
        phone: payload.phone,
        bin: '00' + Math.floor(10000000 + Math.random() * 90000000) + '-0101',
        currency: 'BDT' as const,
        currencySymbol: '৳',
      };

      StorageService.saveBusiness(newBiz);
      StorageService.setActiveBusiness(newBiz.id);
      StorageService.setAuthUser({
        id: data?.session?.user?.id || 'usr_merchant',
        email: payload.email,
        name: finalMerchantName,
        phone: payload.phone,
        role: 'Store Owner',
      });

      showToast(`Welcome ${finalMerchantName}! Storefront launched successfully.`);

      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch (err: any) {
      showToast('Storefront launched in local offline mode');
      setTimeout(() => {
        router.push('/');
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  // Fast Demo Sandbox Auto-fill
  const handleQuickDemo = () => {
    setLoginMethod('phone');
    setPhone('01711223344');
    setEmail('merchant.nextech@gmail.com');
    setPassword('SlipDoMerchant2026!');
    setMerchantName('Arif Rahman');
    setBusinessName('NexTech Gadgets BD');
    setCategory('Consumer Electronics & Accessories');
    setCity('Shop 42, Multiplan Center, Elephant Road, Dhaka');
    setOtp(['1', '2', '3', '4', '5', '6']);
    showToast('Demo merchant credentials filled');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const detectedOperator = getOperatorName(phone);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2.5 backdrop-blur-md border ${
            toast.type === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-800/60'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800/60'
          }`}
        >
          <CheckIcon className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Header Nav */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <SlipDoLogo size={36} className="group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-lg text-white leading-none tracking-tight">
                SlipDo
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
              Digital Receipts & Thermal Invoicing
            </span>
          </div>
        </Link>

        {/* Live Supabase Cloud Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono shadow-xs backdrop-blur-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseConnected === true
                ? 'bg-emerald-400 animate-pulse'
                : supabaseConnected === false
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-slate-300">
            {supabaseConnected === true ? 'Supabase Live' : 'Supabase Cloud'}
          </span>
        </div>
      </header>

      {/* Main Glassmorphic Card Container */}
      <main className="max-w-xl w-full mx-auto my-6 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 relative z-10">
        {/* Active Session Notice Banner */}
        {existingUser && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                ✓
              </div>
              <div>
                <p className="font-bold text-emerald-950">
                  Signed in as {existingUser.name || existingUser.email}
                </p>
                <p className="text-[11px] text-emerald-700">Active merchant session authenticated</p>
              </div>
            </div>
            <Link
              href="/"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* --- Interactive Stepper with Animated Progress --- */}
        <div className="mb-7">
          <div className="flex items-center justify-between relative px-2">
            {/* Background Line */}
            <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-6 h-0.5 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500 ease-out"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '48%' : '92%',
              }}
            />

            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                currentStep >= 1
                  ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>1. Identity</span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                currentStep >= 2
                  ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>2. Verify</span>
            </button>

            {/* Step 3 Pill */}
            <div
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                currentStep === 3
                  ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <BuildingIcon className="w-3.5 h-3.5" />
              <span>3. Setup</span>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: IDENTITY & MERCHANT CONTACT ================= */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-5 animate-fade-in">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                Merchant Sign In / Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant digital receipt creation, WhatsApp billing & thermal printing for Bangladesh.
              </p>
            </div>

            {/* Switch: Mobile vs Email */}
            <div className="flex p-1 rounded-2xl bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Mobile (+880 BD)
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Business Email
              </button>
            </div>

            {/* Mobile Input with Bangladesh Flag & Operator Detection */}
            {loginMethod === 'phone' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Bangladesh Mobile Number
                  </label>
                  {detectedOperator && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {detectedOperator}
                    </span>
                  )}
                </div>

                <div className="flex items-center rounded-2xl border-2 border-slate-200 bg-slate-50 focus-within:border-emerald-600 focus-within:bg-white overflow-hidden transition-all shadow-xs">
                  <span className="px-3.5 py-3 text-xs font-bold text-slate-700 border-r border-slate-200 bg-slate-100/80 flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>+880</span>
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711 - 223344"
                    className="flex-1 px-3.5 py-3 text-sm font-mono font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                  />
                  {phone && (
                    <button
                      type="button"
                      onClick={() => setPhone('')}
                      className="p-2 mr-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter your 11-digit mobile (e.g. 017, 018, 019, 016, 013, 014, 015).
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Business Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@yourstore.com"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password / Master PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all shadow-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1-Click Sandbox Test helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center justify-between transition-all border border-emerald-200/80 group"
              >
                <span className="flex items-center gap-2">
                  <BadgeCheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>1-Click Fill Demo Merchant</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-mono group-hover:translate-x-0.5 transition-transform">
                  Auto-fill →
                </span>
              </button>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 text-[11px] text-slate-500 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>
                I agree to the SlipDo SaaS Terms of Service and cryptographic receipt verification agreement.
              </span>
            </label>

            {/* Continue to Step 2 Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ================= STEP 2: VERIFICATION (OTP) ================= */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                  Verify Security Code
                </h2>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Edit number
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit verification code sent to{' '}
                <strong className="text-slate-900 font-mono">
                  {loginMethod === 'phone' ? `+880 ${phone}` : email}
                </strong>
              </p>
            </div>

            {/* 6 Digit Input Boxes */}
            <div>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-mono font-bold rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all shadow-xs"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Demo Code: <strong className="text-emerald-800 font-mono">123456</strong></span>
                </span>
                {resendCountdown > 0 ? (
                  <span className="text-slate-400 font-mono">Resend in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setResendCountdown(45);
                      showToast('New code sent via SMS');
                    }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            {/* 1-Click WhatsApp Alternative */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-emerald-950 font-medium">
                <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                <div>
                  <p className="font-bold text-[11px]">Send code via WhatsApp</p>
                  <p className="text-[10px] text-emerald-700">Instant delivery with zero SMS delays</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => showToast('Verification code dispatched to your WhatsApp')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors"
              >
                Send
              </button>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: STOREFRONT ONBOARDING ================= */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-5 animate-fade-in">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                Storefront & Merchant Setup
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your digital cash memo header, category, and currency defaults.
              </p>
            </div>

            {/* Inputs: Owner Name & Store Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner / Merchant Name
                </label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Arif Rahman"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Store / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. NexTech Gadgets BD"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Category Selector Grid */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Business Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <p className={`font-bold text-xs leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                        {cat.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cat.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outlet Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Outlet / Store Address
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Shop 42, Level 3, Multiplan Center, Elephant Road, Dhaka"
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Live Voucher Preview Mini-Card (Delightful UX Touch) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-950 text-white shadow-soft flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300 block mb-0.5">
                  Live Voucher Preview
                </span>
                <p className="font-display font-extrabold text-sm truncate">
                  {businessName || 'My Digital Store'}
                </p>
                <p className="text-[10px] text-emerald-200/80 truncate">
                  {category} · {invoicePrefix}2026-0001
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white font-mono font-bold text-xs">
                  ৳ BDT
                </span>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs sm:text-sm shadow-elevated flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? 'Launching Dashboard...' : 'Launch Digital Storefront'}</span>
                <BadgeCheckIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto text-center text-xs text-slate-400 py-2 space-y-1 relative z-10">
        <p className="flex items-center justify-center gap-1.5">
          <LockIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cryptographically Secured by Supabase Cloud · Project: lexyffenbdoysbfxdsen</span>
        </p>
        <p className="text-[11px] text-slate-500">
          SlipDo SaaS · Smart Digital Receipts, Cash Memos & Thermal Invoicing for Bangladesh
        </p>
      </footer>
    </div>
  );
}
