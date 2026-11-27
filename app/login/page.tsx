'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '../../lib/storage';
import { supabase, supabaseDb } from '../../lib/supabase';
import { Business } from '../../lib/types';
import { SlipDoLogo } from '../../components/SlipDoLogo';
import {
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

type AuthMode = 'signin' | 'signup' | 'forgot' | 'otp_verify';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form Fields
  const [storeName, setStoreName] = useState('');
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
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Security: Progressive attempt throttling
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setMounted(true);

    const isDeleted =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('deleted') === 'true';

    if (isDeleted) {
      StorageService.wipeAllUserData();
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      setAuthMode('signin');
      showToast('Merchant account permanently deleted.');
      return;
    }

    const handleAuthRedirect = async () => {
      try {
        const pendingVerify = typeof window !== 'undefined' ? sessionStorage.getItem('slipdo_pending_otp') : null;
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const isVerifyStep = urlParams?.get('step') === 'verify' || !!pendingVerify;

        const session = (await supabase.handleAuthCallback()) || supabase.getSession();
        if (session?.user?.id) {
          const uid = session.user.id;
          const cloudBusinesses = await supabaseDb.getBusinesses(uid);
          const userMeta = session.user?.user_metadata;
          let activeList = cloudBusinesses || [];
          if (activeList.length === 0 && userMeta?.default_business) {
            activeList = [userMeta.default_business];
          }
          if (activeList.length === 0 && StorageService.getBusinesses().length > 0) {
            activeList = StorageService.getBusinesses();
          }
          if (activeList.length === 0) {
            const bizName = userMeta?.name || userMeta?.full_name || (session.user.email ? session.user.email.split('@')[0] : 'Merchant Store');
            const defaultBiz: Business = {
              id: 'biz_' + Date.now().toString(36),
              name: bizName,
              category: 'General Retail & Services',
              address: 'Online Store',
              phone: session.user.phone || '',
              bin: '',
              currency: 'BDT',
              currencySymbol: '৳',
            };
            StorageService.saveBusiness(defaultBiz);
            StorageService.setActiveBusiness(defaultBiz.id);
            activeList = [defaultBiz];
            supabaseDb.saveBusiness(defaultBiz, uid).catch(console.warn);
          }
          StorageService.setCloudBusinesses(uid, activeList);
          StorageService.markStoreSetupCompleted(uid);
          showToast('Signed in successfully!');
          window.location.href = '/';
          return;
        } else if (isVerifyStep) {
          let emailToVerify = urlParams?.get('email') || '';
          let notice = '';
          if (pendingVerify) {
            try {
              const parsed = JSON.parse(pendingVerify);
              if (parsed.email) emailToVerify = parsed.email;
              if (parsed.notice) notice = parsed.notice;
            } catch {}
          }
          if (emailToVerify) {
            setEmail(emailToVerify);
            setAuthMode('otp_verify');
            setVerificationNotice(notice || `Enter the 6-digit verification code sent to ${emailToVerify}`);
            setTimeout(() => otpInputRefs.current[0]?.focus(), 200);
            return;
          }
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

      // Check if this specific merchant already has a configured business
      const uid = res.data?.session?.user?.id;
      const userMeta = res.data?.session?.user?.user_metadata;
      if (uid) {
        const cloudBusinesses = await supabaseDb.getBusinesses(uid);
        let activeList = cloudBusinesses || [];
        if (activeList.length === 0 && userMeta?.default_business) {
          activeList = [userMeta.default_business];
        }
        if (activeList.length === 0 && StorageService.getBusinesses().length > 0) {
          activeList = StorageService.getBusinesses();
        }
        if (activeList.length === 0) {
          const bizName = userMeta?.name || userMeta?.full_name || cleanEmail.split('@')[0] || 'Merchant Store';
          const defaultBiz: Business = {
            id: 'biz_' + Date.now().toString(36),
            name: bizName,
            category: 'General Retail & Services',
            address: 'Online Store',
            phone: '',
            bin: '',
            currency: 'BDT',
            currencySymbol: '৳',
          };
          StorageService.saveBusiness(defaultBiz);
          StorageService.setActiveBusiness(defaultBiz.id);
          activeList = [defaultBiz];
          supabaseDb.saveBusiness(defaultBiz, uid).catch(console.warn);
        }
        StorageService.setCloudBusinesses(uid, activeList);
        StorageService.markStoreSetupCompleted(uid);
      }
      showToast('Signed in successfully!');
      setTimeout(() => {
        window.location.href = '/';
      }, 250);
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
        const uid = res.data.session.user.id;
        const bizName = storeName.trim() || cleanEmail.split('@')[0] || 'Merchant Store';
        const defaultBiz: Business = {
          id: 'biz_' + Date.now().toString(36),
          name: bizName,
          category: 'General Retail & Services',
          address: 'Online Store',
          phone: '',
          bin: '',
          currency: 'BDT',
          currencySymbol: '৳',
        };
        StorageService.saveBusiness(defaultBiz);
        StorageService.setActiveBusiness(defaultBiz.id);
        StorageService.setCloudBusinesses(uid, [defaultBiz]);
        StorageService.markStoreSetupCompleted(uid);
        supabaseDb.saveBusiness(defaultBiz, uid).catch(console.warn);

        showToast('Account registered successfully! Welcome to SlipDo.');
        setTimeout(() => {
          window.location.href = '/';
        }, 250);
        return;
      }

      // Email confirmation required:
      showToast('Account created! Enter the 6-digit verification code sent to your email.');
      const notice = `Enter the 6-digit verification code sent to ${cleanEmail}`;
      setVerificationNotice(notice);
      setAuthMode('otp_verify');
      setResendCountdown(60);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('slipdo_pending_otp', JSON.stringify({ email: cleanEmail, notice }));
        if (storeName.trim()) {
          sessionStorage.setItem('slipdo_pending_store_name', storeName.trim());
        }
        window.history.replaceState(null, '', `/login?step=verify&email=${encodeURIComponent(cleanEmail)}`);
      }
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

      const uid = res.data?.session?.user?.id;
      const savedStoreName = typeof window !== 'undefined' ? sessionStorage.getItem('slipdo_pending_store_name') : null;
      const bizName = savedStoreName?.trim() || storeName.trim() || cleanEmail.split('@')[0] || 'Merchant Store';
      const defaultBiz: Business = {
        id: 'biz_' + Date.now().toString(36),
        name: bizName,
        category: 'General Retail & Services',
        address: 'Online Store',
        phone: '',
        bin: '',
        currency: 'BDT',
        currencySymbol: '৳',
      };
      StorageService.saveBusiness(defaultBiz);
      StorageService.setActiveBusiness(defaultBiz.id);
      if (uid) {
        StorageService.setCloudBusinesses(uid, [defaultBiz]);
        StorageService.markStoreSetupCompleted(uid);
        supabaseDb.saveBusiness(defaultBiz, uid).catch(console.warn);
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('slipdo_pending_otp');
        sessionStorage.removeItem('slipdo_pending_store_name');
      }

      showToast('Identity confirmed! Welcome to SlipDo.');
      setTimeout(() => {
        window.location.href = '/';
      }, 250);
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
        if (error.isProviderDisabled || error.message?.toLowerCase().includes('not enabled')) {
          setShowGoogleHelp(true);
        }
      }
    } catch {
      showToast('Google Sign-In initialization failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    const demoBiz: Business = {
      id: 'biz_demo_store',
      name: 'Demo Retail Store',
      category: 'General Retail & Services',
      address: 'Dhaka, Bangladesh',
      phone: '+880 1711-000000',
      bin: '1234567890',
      currency: 'BDT',
      currencySymbol: '৳',
    };
    StorageService.saveBusiness(demoBiz);
    StorageService.setActiveBusiness(demoBiz.id);
    StorageService.setCurrentUser({
      id: 'usr_demo_merchant',
      email: 'demo@slipdo.app',
      name: 'Demo Merchant',
    });
    StorageService.markStoreSetupCompleted('usr_demo_merchant');
    showToast('Signed in as Demo Merchant!');
    window.location.href = '/';
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
        <div>
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <SlipDoLogo size={42} lockup="official" />
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
              {/* Store / Business Name (Sign Up Mode) */}
              {authMode === 'signup' && (
                <div className="relative">
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Store / Business Name (Optional)"
                    className="w-full pl-5 pr-12 py-3.5 rounded-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 p-1 flex items-center justify-center">
                    <BuildingIcon className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              )}

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

            {/* Quick Demo Merchant Access */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>Instant Demo Access (Test without signup)</span>
              </button>
            </div>
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

            {/* Back to Sign In Option */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('slipdo_pending_otp');
                    window.history.replaceState(null, '', '/login');
                  }
                  setAuthMode('signin');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Security Footer Note */}
        <div className="mt-8 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>256-Bit Cryptographically Secured Authentication</span>
        </div>

        {/* Google OAuth Provider Setup Help Modal */}
        {showGoogleHelp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GoogleIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-display font-bold text-sm text-slate-900">Enable Google Sign-In</h3>
                </div>
                <button
                  onClick={() => setShowGoogleHelp(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Google OAuth is currently <strong>disabled</strong> in your Supabase project. To enable one-click Google Sign-In:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-700">
                  <li>
                    Open <strong>Supabase Dashboard</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Google</strong>.
                  </li>
                  <li>
                    In Google Cloud Console, set Authorized Redirect URI to:
                    <div className="mt-1 p-2 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-800 break-all select-all">
                      https://lexyffenbdoysbfxdsen.supabase.co/auth/v1/callback
                    </div>
                  </li>
                  <li>
                    Paste your Google <strong>Client ID</strong> and <strong>Client Secret</strong> into Supabase and toggle <strong>Enable Google provider</strong>.
                  </li>
                </ol>
                <p className="text-[11px] text-slate-500">
                  In the meantime, you can log in using your email and password or use Instant Demo Access.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleHelp(false)}
                  className="flex-1 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
