'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business, Currency } from '../../lib/types';
import { CountryCodeSelect } from '../../components/CountryCodeSelect';
import {
  SparklesIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  CheckIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  BuildingIcon,
  XIcon,
} from '../../components/Icons';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'otp_verify' | 'step3_store';

const CATEGORIES = [
  'General Retail & Services',
  'Fashion & Clothing',
  'Electronics & Tech',
  'Grocery & Super Shop',
  'Restaurant & Cafe',
  'Pharmacy & Healthcare',
  'Wholesale & Distribution',
];

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form Fields (Step 1 & 2)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification Fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [verificationNotice, setVerificationNotice] = useState('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Security: Progressive attempt throttling
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Step 3 Storefront Setup Fields
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState(CATEGORIES[0]);
  const [storeCountryCode, setStoreCountryCode] = useState('BD'); // Default BD
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCurrency, setStoreCurrency] = useState<Currency>('BDT');
  const [storeBin, setStoreBin] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  const [storeSignatureUrl, setStoreSignatureUrl] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setMounted(true);

    const handleAuthRedirect = async () => {
      try {
        const isStep3Requested =
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('step') === '3';

        const session = (await supabase.handleAuthCallback()) || supabase.getSession();
        if (session?.user?.id) {
          const uid = session.user.id;
          if (isStep3Requested) {
            setAuthMode('step3_store');
            return;
          }

          // Check if this user already has an active store in Supabase
          const cloudBusinesses = await supabaseDb.getBusinesses(uid);
          if (!cloudBusinesses || cloudBusinesses.length === 0) {
            setAuthMode('step3_store');
          } else {
            StorageService.setCloudBusinesses(uid, cloudBusinesses);
            StorageService.markStoreSetupCompleted(uid);
            showToast('Signed in successfully!');
            setTimeout(() => router.replace('/'), 400);
          }
        } else if (isStep3Requested) {
          setAuthMode('step3_store');
        }
      } catch (err) {
        console.error('Redirect auth handling error:', err);
      }
    };

    handleAuthRedirect();
  }, [router]);

  // Resend Countdown
  useEffect(() => {
    if (authMode !== 'otp_verify' || resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [authMode, resendCountdown]);

  // Security Lockout Timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // --- Sign In Handler ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      showToast(`Security pause active. Please wait ${lockoutRemaining}s`, 'error');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (res.error) {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);

        if (newFailed >= 5) {
          setLockoutRemaining(300);
          showToast('Too many failed attempts. Locked for 5 minutes.', 'error');
        } else if (newFailed >= 3) {
          setLockoutRemaining(20);
          showToast('3 incorrect attempts. Please wait 20 seconds.', 'error');
        } else {
          if (res.error.message?.toLowerCase().includes('not confirmed')) {
            showToast('Email not confirmed. Sending a 6-digit code to verify.', 'error');
            await supabase.auth.signInWithOtp({ email: cleanEmail });
            setVerificationNotice(`A 6-digit verification code has been dispatched to ${cleanEmail}`);
            setAuthMode('otp_verify');
            setResendCountdown(60);
            setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
            return;
          }
          showToast(res.error.message || 'Invalid email or password', 'error');
        }
        return;
      }

      setFailedAttempts(0);
      setLockoutRemaining(0);

      if (rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('slipdo_remember_device', 'true');
      }

      // Check if this specific merchant already has a configured business in Supabase
      const uid = res.data?.session?.user?.id;
      if (uid) {
        const cloudBusinesses = await supabaseDb.getBusinesses(uid);
        if (!cloudBusinesses || cloudBusinesses.length === 0) {
          setAuthMode('step3_store');
        } else {
          StorageService.setCloudBusinesses(uid, cloudBusinesses);
          StorageService.markStoreSetupCompleted(uid);
          showToast('Signed in successfully!');
          setTimeout(() => router.replace('/'), 400);
        }
      } else {
        const existing = StorageService.getBusinesses();
        if (!existing || existing.length === 0) {
          setAuthMode('step3_store');
        } else {
          showToast('Signed in successfully!');
          setTimeout(() => router.replace('/'), 400);
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Authentication error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Sign Up Handler ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      showToast('Please provide an email and password', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (res.error) {
        showToast(res.error.message || 'Unable to register account', 'error');
        return;
      }

      // If email confirmation is disabled and session returned immediately:
      if (res.data?.session) {
        showToast('Account registered! Now set up your storefront.');
        setAuthMode('step3_store');
        return;
      }

      // Email confirmation required:
      showToast('Account created! Enter the 6-digit verification code sent to your email.');
      setVerificationNotice(`Enter the 6-digit verification code sent to ${cleanEmail}`);
      setAuthMode('otp_verify');
      setResendCountdown(60);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      showToast(err?.message || 'Registration error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password ---
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Please enter your email above first', 'error');
      return;
    }

    setLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://slipdo.vercel.app';
      const res = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { emailRedirectTo: `${origin}/login` },
      });

      if (res.error) {
        showToast(res.error.message || 'Notice: Dispatched code if account exists');
      } else {
        showToast('Password reset link & 6-digit code dispatched to your email!');
      }

      setVerificationNotice(`Enter the 6-digit code or click the link sent to ${cleanEmail}`);
      setAuthMode('otp_verify');
      setResendCountdown(60);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch {
      showToast('Dispatched verification to your email');
      setAuthMode('otp_verify');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP Verification ---
  const executeOtpVerification = async (code: string) => {
    if (code.length < 6) {
      showToast('Please enter all 6 digits of the code', 'error');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'email',
      });

      if (res.error) {
        showToast(res.error.message || 'Invalid verification code', 'error');
        setLoading(false);
        return;
      }

      showToast('Identity confirmed! Please configure your storefront.');
      setAuthMode('step3_store');
    } catch (err: any) {
      showToast(err?.message || 'Verification error', 'error');
      setLoading(false);
    }
  };

  // OTP Input Handlers
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      pasted.split('').forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtp(newDigits);

      if (pasted.length === 6) {
        executeOtpVerification(newDigits.join(''));
      } else {
        otpInputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      executeOtpVerification(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Google OAuth
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://slipdo.vercel.app/login',
        },
      });
      if (error) {
        showToast(error.message || 'Google Sign-In failed', 'error');
      }
    } catch {
      showToast('Google Sign-In initialization failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Logo File Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file size must be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setStoreLogoUrl(ev.target?.result as string);
      showToast('Store logo uploaded!');
    };
    reader.readAsDataURL(file);
  };

  // Signature File Upload Handler
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Signature file size must be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setStoreSignatureUrl(ev.target?.result as string);
      showToast('Digital signature uploaded!');
    };
    reader.readAsDataURL(file);
  };

  // --- Step 3 Storefront Setup Submission ---
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      showToast('Please enter your store or business name', 'error');
      return;
    }
    if (!storeAddress.trim()) {
      showToast('Please provide your store or outlet address', 'error');
      return;
    }

    setLoading(true);

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
    const cleanNum = storePhone.replace(/^[+\d\s-]+/, (m) => (m.startsWith('+') ? '' : m)).trim();
    const fullPhone = cleanNum ? `${codePrefix} ${cleanNum}` : '';

    const newBusiness: Business = {
      id: 'biz_' + Date.now(),
      name: storeName.trim(),
      category: storeCategory,
      address: storeAddress.trim(),
      phone: fullPhone,
      bin: storeBin.trim(),
      currency: storeCurrency,
      currencySymbol: storeCurrency === 'USD' ? '$' : storeCurrency === 'EUR' ? '€' : storeCurrency === 'INR' ? '₹' : '৳',
      logoUrl: storeLogoUrl || undefined,
      signatureUrl: storeSignatureUrl || undefined,
    };

    try {
      // 1. Save to Supabase cloud if session is present
      const session = supabase.getSession();
      if (session?.user?.id) {
        const uid = session.user.id;
        await supabaseDb.saveBusiness(newBusiness, uid).catch(console.error);
        StorageService.setCloudBusinesses(uid, [newBusiness]);
        StorageService.markStoreSetupCompleted(uid);
      }

      // 2. Save to user-scoped local storage
      StorageService.saveBusiness(newBusiness);
      StorageService.setActiveBusiness(newBusiness.id);

      showToast('Storefront configured successfully! Welcome to SlipDo.');
      setTimeout(() => router.replace('/'), 500);
    } catch (err: any) {
      showToast(err?.message || 'Error saving storefront details', 'error');
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]/60 flex items-center justify-center p-4 sm:p-6 text-slate-800 font-sans selection:bg-blue-500 selection:text-white antialiased">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full animate-fade-in shadow-2xl px-3">
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-3 backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-900/10'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {toast.type === 'error' ? <AlertCircleIcon className="w-3.5 h-3.5" /> : <CheckIcon className="w-3.5 h-3.5" />}
            </div>
            <p className="flex-1 leading-snug">{toast.msg}</p>
            <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 p-0.5">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Card Container */}
      <main className="w-full max-w-[390px] sm:max-w-[420px] mx-auto py-6">
        {/* Brand Header: Different Logo on Step 3 as requested */}
        {authMode === 'step3_store' ? (
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="relative mb-3">
              {storeLogoUrl ? (
                <img
                  src={storeLogoUrl}
                  alt="Store Logo"
                  className="w-16 h-16 rounded-3xl object-contain p-1.5 bg-white border border-slate-200 shadow-md shadow-blue-500/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1e40af] to-[#3b82f6] text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <BuildingIcon className="w-8 h-8 text-white" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold tracking-wider uppercase border-2 border-white shadow-2xs">
                Outlet
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Setup Your Storefront
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Step 3 of 3: Configure branding & digital receipts
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">SlipDo</span>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {authMode === 'signup'
                  ? 'Create an Account'
                  : authMode === 'otp_verify'
                  ? 'Enter Verification Code'
                  : 'Welcome Back Creative!'}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {authMode === 'signup'
                  ? 'Start issuing digital receipts in seconds'
                  : authMode === 'otp_verify'
                  ? verificationNotice || 'Verify code to access your merchant account'
                  : 'We Are Happy To See You Again'}
              </p>
            </div>
          </div>
        )}

        {/* ================= MODE: SIGN IN / SIGN UP ================= */}
        {(authMode === 'signin' || authMode === 'signup') && (
          <div className="space-y-4">
            {/* Pill Segmented Switch */}
            <div className="flex p-1 rounded-full border border-slate-200 bg-white/90 shadow-2xs mb-5">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  authMode === 'signin'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  authMode === 'signup'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3.5">
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-5 pr-12 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 p-1 flex items-center justify-center">
                  <MailIcon className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-5 pr-12 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center"
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password (Sign Up Mode) */}
              {authMode === 'signup' && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-5 pr-12 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center"
                  >
                    {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Remember me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      rememberMe ? 'border-[#3b82f6] bg-[#3b82f6]' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {rememberMe && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-slate-600">Remember me</span>
                </label>

                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[#3b82f6] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              {/* Main Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : authMode === 'signin' ? 'Login' : 'Sign Up'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                OR
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Google OAuth (No Apple login per instruction) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-2xs active:scale-[0.99] disabled:opacity-50"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Log in with Google</span>
            </button>
          </div>
        )}

        {/* ================= MODE: OTP VERIFICATION (STEP 2) ================= */}
        {authMode === 'otp_verify' && (
          <div className="space-y-5 animate-fade-in" onPaste={handleOtpPaste}>
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between">
              <span className="truncate mr-2 font-mono font-semibold">{email}</span>
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-[#3b82f6] font-bold hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            {/* 6-Digit Boxes */}
            <div className="space-y-2">
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
                    className="w-12 h-13 text-center text-xl font-mono font-bold rounded-2xl border border-slate-200 bg-white text-slate-900 focus:bg-white focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-400 text-center pt-1">
                Auto-submits once all 6 digits are entered or pasted
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => executeOtpVerification(otp.join(''))}
              disabled={loading || otp.some((d) => !d)}
              className="w-full py-3.5 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            {/* Resend Cooldown */}
            <div className="text-center text-xs text-slate-500 pt-1">
              {resendCountdown > 0 ? (
                <span>
                  Resend code in <strong className="font-mono text-slate-700">{resendCountdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-[#3b82f6] font-bold hover:underline"
                >
                  Resend Verification Code
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= MODE: STEP 3 STOREFRONT SETUP ================= */}
        {authMode === 'step3_store' && (
          <form onSubmit={handleStep3Submit} className="space-y-4 animate-fade-in">
            {/* Store Name Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Store / Outlet Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Apex Retail, Velvet Studio"
                className="w-full px-5 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Business Category
              </label>
              <div className="relative">
                <select
                  value={storeCategory}
                  onChange={(e) => setStoreCategory(e.target.value)}
                  className="w-full appearance-none px-5 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs pr-10"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Store Contact Phone with Country Code */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <div className="flex items-center gap-2">
                <CountryCodeSelect
                  value={storeCountryCode}
                  onChange={setStoreCountryCode}
                />
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="1711-223344"
                  className="flex-1 px-5 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Physical Outlet Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Physical Outlet Address *
              </label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shop 42, Level 2, Elephant Road, Dhaka"
                className="w-full px-5 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
              />
            </div>

            {/* Currency & BIN Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Currency
                </label>
                <select
                  value={storeCurrency}
                  onChange={(e) => setStoreCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#3b82f6] shadow-2xs"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  BIN / VAT No.
                </label>
                <input
                  type="text"
                  value={storeBin}
                  onChange={(e) => setStoreBin(e.target.value)}
                  placeholder="000123456-0101"
                  className="w-full px-4 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-mono font-medium focus:outline-none focus:border-[#3b82f6] shadow-2xs"
                />
              </div>
            </div>

            {/* Store Logo & Signature Upload Cards */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Logo Upload */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs text-center flex flex-col items-center justify-center">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Store Logo
                </label>
                {storeLogoUrl ? (
                  <div className="relative mb-2">
                    <img src={storeLogoUrl} alt="Preview" className="w-12 h-12 object-contain rounded-xl border border-slate-200 p-1" />
                    <button
                      type="button"
                      onClick={() => setStoreLogoUrl(null)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center mb-1.5 text-slate-400">
                    <BuildingIcon className="w-5 h-5" />
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all">
                  <span>{storeLogoUrl ? 'Change' : 'Upload Logo'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              {/* Signature Upload */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs text-center flex flex-col items-center justify-center">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Digital Signature
                </label>
                {storeSignatureUrl ? (
                  <div className="relative mb-2">
                    <img src={storeSignatureUrl} alt="Signature" className="h-10 w-auto object-contain" />
                    <button
                      type="button"
                      onClick={() => setStoreSignatureUrl(null)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center mb-1.5 text-slate-400">
                    <ShieldCheckIcon className="w-5 h-5" />
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all">
                  <span>{storeSignatureUrl ? 'Change' : 'Upload Sign'}</span>
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Submit Step 3 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-3 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? 'Configuring Storefront...' : 'Complete Store Setup & Launch'}
            </button>
          </form>
        )}

        {/* Security Footer Note */}
        <div className="mt-8 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>256-Bit Cryptographically Secured Authentication</span>
        </div>
      </main>
    </div>
  );
}
