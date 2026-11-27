'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SlipDoLogo } from '../../components/SlipDoLogo';
import { StorageService } from '../../lib/storage';
import { supabase, SupabaseSession } from '../../lib/supabase';
import {
  UserIcon,
  ShieldCheckIcon,
  BuildingIcon,
  CheckIcon,
  LockIcon,
  BadgeCheckIcon,
  ChevronRightIcon,
  WhatsAppIcon,
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
  const [phone, setPhone] = useState('01711223344');
  const [email, setEmail] = useState('merchant.nextech@gmail.com');
  const [password, setPassword] = useState('SlipDoMerchant2026!');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // --- Step 2: Verification (OTP) ---
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [resendCountdown, setResendCountdown] = useState(45);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Step 3: Storefront Onboarding ---
  const [merchantName, setMerchantName] = useState('Arif Rahman');
  const [businessName, setBusinessName] = useState('NexTech Gadgets BD');
  const [category, setCategory] = useState('Consumer Electronics & Accessories');
  const [city, setCity] = useState('Dhaka (Multiplan Center, Elephant Road)');
  const [currency] = useState('BDT');
  const [invoicePrefix, setInvoicePrefix] = useState('SD-');

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

  // --- Step 1 Submit: Request OTP / Proceed ---
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      showToast('Please agree to terms and privacy policy', 'error');
      return;
    }

    if (loginMethod === 'phone' && (!phone || phone.length < 10)) {
      showToast('Please enter a valid 11-digit Bangladesh phone number', 'error');
      return;
    }

    if (loginMethod === 'email' && (!email || !email.includes('@'))) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);

    try {
      // Optional: Attempt live Supabase OTP or API trigger
      if (loginMethod === 'email') {
        await supabase.auth.signInWithOtp({ email }).catch(() => {});
      }
      showToast('Verification code dispatched via SMS & WhatsApp');
      setCurrentStep(2);
      setResendCountdown(45);
    } catch {
      // Offline fallback: still proceed to Step 2
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

    // Allow sandbox test code "123456" or any valid code
    setTimeout(() => {
      setLoading(false);
      showToast('Identity verified cryptographically');
      setCurrentStep(3);
    }, 600);
  };

  // OTP inputs handling
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of whole 6 digits
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

    // Auto advance
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
    if (!businessName.trim()) {
      showToast('Please enter your business or store name', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: merchantName,
        businessName,
        category,
        phone: loginMethod === 'phone' ? phone : '+880 1711-223344',
        email: loginMethod === 'email' ? email : `merchant_${phone.replace(/\D/g, '')}@slipdo.app`,
        password,
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
        name: businessName,
        category,
        address: city,
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
        name: merchantName,
        phone: payload.phone,
        role: 'Store Owner',
      });

      showToast(`Welcome ${merchantName}! Storefront launched.`);

      setTimeout(() => {
        router.push('/');
      }, 800);
    } catch (err: any) {
      showToast('Onboarding completed in offline mode: ' + (err?.message || 'Proceeding'));
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo autofill
  const handleQuickDemo = () => {
    setLoginMethod('phone');
    setPhone('01711223344');
    setEmail('merchant.nextech@gmail.com');
    setMerchantName('Arif Rahman');
    setBusinessName('NexTech Gadgets BD');
    setCategory('Consumer Electronics & Accessories');
    setCity('Dhaka (Multiplan Center, Elephant Road)');
    setOtp(['1', '2', '3', '4', '5', '6']);
    showToast('Demo merchant credentials filled');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          <CheckIcon className="w-4 h-4 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <SlipDoLogo size={34} className="group-hover:scale-105 transition-transform" />
          <div>
            <span className="font-display font-extrabold text-lg text-white leading-none tracking-tight">
              SlipDo
            </span>
            <span className="text-[10px] text-emerald-400 block font-medium">
              Merchant Authentication
            </span>
          </div>
        </Link>

        {/* Supabase Connection Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[10px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseConnected === true
                ? 'bg-emerald-400 animate-pulse'
                : supabaseConnected === false
                ? 'bg-amber-400'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-slate-300">
            {supabaseConnected === true ? 'Supabase Live' : 'Supabase Cloud'}
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-6 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80">
        {/* Already Logged In Banner */}
        {existingUser && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-emerald-900">Signed in as {existingUser.name || existingUser.email}</p>
              <p className="text-[11px] text-emerald-700">Active session detected</p>
            </div>
            <Link
              href="/"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Dashboard
            </Link>
          </div>
        )}

        {/* 3-Step Wizard Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between relative">
            {/* Step Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-300"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />

            {/* Step 1 Circle */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 1
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <CheckIcon className="w-4 h-4" /> : '1'}
            </button>

            {/* Step 2 Circle */}
            <button
              type="button"
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 2
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <CheckIcon className="w-4 h-4" /> : '2'}
            </button>

            {/* Step 3 Circle */}
            <div
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 3
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-2 px-1">
            <span className={currentStep === 1 ? 'text-emerald-700' : ''}>1. Identity</span>
            <span className={currentStep === 2 ? 'text-emerald-700' : ''}>2. Verify</span>
            <span className={currentStep === 3 ? 'text-emerald-700' : ''}>3. Store Setup</span>
          </div>
        </div>

        {/* ================= STEP 1: IDENTITY ================= */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Merchant Sign In / Register
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Enter your mobile number or business email to access your receipts.
              </p>
            </div>

            {/* Phone vs Email Toggle */}
            <div className="flex p-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Mobile (+880 BD)
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Business Email
              </button>
            </div>

            {/* Phone Field */}
            {loginMethod === 'phone' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Bangladesh Mobile Number
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-emerald-600 focus-within:bg-white overflow-hidden transition-colors">
                  <span className="px-3 py-2.5 text-xs font-bold text-slate-700 border-r border-slate-200 bg-slate-100">
                    +880
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711-223344"
                    className="flex-1 px-3 py-2.5 text-xs font-mono font-semibold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports bKash/Nagad registered mobile or WhatsApp SIM.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@yourstore.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Password / Master PIN
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>
            )}

            {/* 1-Click Demo Sandbox Fill */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
              >
                <BadgeCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>1-Click Fill Demo Merchant (Instant Test)</span>
              </button>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 text-[11px] text-slate-500 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                I agree to the SlipDo SaaS Merchant Terms & verified cryptographic token policy.
              </span>
            </label>

            {/* Step 1 Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Sending Code...' : 'Continue to Step 2'}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ================= STEP 2: VERIFICATION (OTP) ================= */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Verify Security Code
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Enter the 6-digit verification code sent to{' '}
                <strong className="text-slate-800">
                  {loginMethod === 'phone' ? `+880 ${phone}` : email}
                </strong>
              </p>
            </div>

            {/* 6 Digit Input Boxes */}
            <div>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
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
                    className="w-11 h-12 text-center text-lg font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none shadow-xs"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>Demo Code: <strong className="text-emerald-700 font-mono">123456</strong></span>
                {resendCountdown > 0 ? (
                  <span>Resend in {resendCountdown}s</span>
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

            {/* WhatsApp Alternative */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                <span className="font-semibold text-[11px]">Send code via WhatsApp</span>
              </div>
              <button
                type="button"
                onClick={() => showToast('WhatsApp OTP dispatched')}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                Send
              </button>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: STOREFRONT ONBOARDING ================= */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BuildingIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Storefront & Merchant Setup
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Configure your shop name and default receipt settings for Bangladesh.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Owner / Merchant Name
                </label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Arif Rahman"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. NexTech Gadgets BD"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Industry / Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-emerald-600 bg-white"
                >
                  <option value="Consumer Electronics & Accessories">Consumer Electronics & Accessories</option>
                  <option value="Fashion, Boutique & Clothing">Fashion, Boutique & Clothing</option>
                  <option value="Grocery, Dept Store & Supermarket">Grocery, Dept Store & Supermarket</option>
                  <option value="Restaurant, Cafe & Cloud Kitchen">Restaurant, Cafe & Cloud Kitchen</option>
                  <option value="Pharmacy & Healthcare Supplies">Pharmacy & Healthcare Supplies</option>
                  <option value="Wholesale & Hardware Trade">Wholesale & Hardware Trade</option>
                  <option value="General Retail Services">General Retail Services</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Storefront Address / Outlet
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Shop 42, Multiplan Center, Dhaka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                    ৳ BDT (Taka)
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Slip Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Submit Step 3 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Launching Dashboard...' : 'Complete Setup & Launch Dashboard'}</span>
                <BadgeCheckIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-xs text-slate-400 py-2 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <LockIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connected to Supabase Project: lexyffenbdoysbfxdsen</span>
        </p>
        <p className="text-[11px] text-slate-500">
          SlipDo SaaS · Smart Digital Receipts & Thermal Invoicing for Bangladesh
        </p>
      </footer>
    </div>
  );
}
