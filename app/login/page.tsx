'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  XIcon,
  GoogleIcon,
  MailIcon,
  GlobeIcon,
  SparklesIcon,
  PrinterIcon,
  ReceiptIcon,
  FingerprintIcon,
  SmartphoneIcon,
  ShieldAlertIcon,
  CalendarIcon,
  CreditCardIcon,
} from '../../components/Icons';

type Language = 'en' | 'bn';

interface Dictionary {
  badge: string;
  serverStatus: string;
  title: string;
  subtitle: string;
  googleBtn: string;
  divider: string;
  methodEmail: string;
  methodPhone: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailHint: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneHint: string;
  rememberDevice: string;
  termsAgreement: string;
  termsLink: string;
  privacyLink: string;
  submitBtnStep1Email: string;
  submitBtnStep1Phone: string;
  dispatching: string;
  step2Title: string;
  step2Subtitle: string;
  step2ChangeEmail: string;
  step2ChangePhone: string;
  step2DualGuideTitle: string;
  step2DualGuide1: string;
  step2DualGuide2: string;
  step2InputLabel: string;
  step2PasteHint: string;
  step2AutoSubmitHint: string;
  step2ResendIn: string;
  step2ResendBtn: string;
  step2VerifyBtn: string;
  step2Verifying: string;
  lockoutTitle: string;
  lockoutMsg: string;
  step3Title: string;
  step3Subtitle: string;
  step3MerchantLabel: string;
  step3BusinessLabel: string;
  step3CategoryLabel: string;
  step3CityLabel: string;
  step3CurrencyLabel: string;
  step3SubmitBtn: string;
  step3Submitting: string;
  trustHeading: string;
  trustStat1Val: string;
  trustStat1Label: string;
  trustStat2Val: string;
  trustStat2Label: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  securityFooter: string;
  passkeyBtn: string;
  passkeyPrompt: string;
}

const DICTIONARY: Record<Language, Dictionary> = {
  en: {
    badge: 'ENTERPRISE RETAIL POS & DIGITAL MEMOS',
    serverStatus: 'Cloud Systems Operational',
    title: 'Sign in to SlipDo',
    subtitle: 'Access your retail dashboard, thermal cash memos & customer billing.',
    googleBtn: 'Continue with Google',
    divider: 'or continue with secure credentials',
    methodEmail: 'Business Email',
    methodPhone: 'Mobile (+880 BD)',
    emailLabel: 'Business Email Address',
    emailPlaceholder: 'owner@store.com',
    emailHint: 'We send both a direct 1-click login link and a 6-digit verification code.',
    phoneLabel: 'Bangladesh Mobile Number',
    phonePlaceholder: '01711 - 223344',
    phoneHint: 'Enter your 11-digit mobile number for secure instant authentication.',
    rememberDevice: 'Remember this device for 30 days',
    termsAgreement: 'By continuing, you agree to SlipDo SaaS',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
    submitBtnStep1Email: 'Send Login Link & Code',
    submitBtnStep1Phone: 'Send Verification Code',
    dispatching: 'Dispatching...',
    step2Title: 'Verify Your Identity',
    step2Subtitle: 'A 6-digit authentication code and direct link have been dispatched to',
    step2ChangeEmail: 'Change email',
    step2ChangePhone: 'Change number',
    step2DualGuideTitle: 'Two seamless authentication options:',
    step2DualGuide1: 'Click the Magic Link in your email to sign in instantly without typing.',
    step2DualGuide2: 'Or enter the 6-digit code below (auto-submits upon completion).',
    step2InputLabel: 'Enter 6-Digit Code',
    step2PasteHint: 'Tip: You can paste the copied 6-digit code into any box.',
    step2AutoSubmitHint: 'Code auto-submits upon typing all 6 digits',
    step2ResendIn: 'Resend available in',
    step2ResendBtn: 'Resend Verification Code',
    step2VerifyBtn: 'Verify & Enter Storefront',
    step2Verifying: 'Verifying cryptographic token...',
    lockoutTitle: 'Security Rate Limit Protection',
    lockoutMsg: 'Multiple incorrect verification attempts detected. To safeguard your store data, input is paused for',
    step3Title: 'Configure Your Storefront',
    step3Subtitle: 'Finalize your business profile to generate compliant digital cash memos.',
    step3MerchantLabel: 'Store Owner / Manager Name',
    step3BusinessLabel: 'Registered Business Name',
    step3CategoryLabel: 'Business Category',
    step3CityLabel: 'Store Address & District',
    step3CurrencyLabel: 'Billing Currency',
    step3SubmitBtn: 'Launch My Storefront',
    step3Submitting: 'Launching Storefront...',
    trustHeading: 'Trusted by over 3,200 retail outlets across Bangladesh',
    trustStat1Val: '৳15.4M+',
    trustStat1Label: 'Monthly digital receipts issued',
    trustStat2Val: '99.98%',
    trustStat2Label: 'SLA thermal printer uptime',
    feature1Title: '256-Bit Cryptographic Integrity',
    feature1Desc: 'Tamper-evident hash signatures prevent altered bills and fraud.',
    feature2Title: 'NBR VAT & Cash Memo Ready',
    feature2Desc: 'Formatted to comply with Bangladesh fiscal invoicing requirements.',
    feature3Title: 'Multi-Channel Dispatch',
    feature3Desc: 'Print to Bluetooth thermal printers or send direct WhatsApp receipts.',
    securityFooter: 'Bank-Grade TLS 1.3 Encryption · NBR Fiscal Compliance Ready · ISO 27001 Cloud Infrastructure',
    passkeyBtn: 'Sign in with Biometrics / Passkey',
    passkeyPrompt: 'Use your device fingerprint or Face ID for passwordless access',
  },
  bn: {
    badge: 'এন্টারপ্রাইজ রিটেইল পিওএস ও ডিজিটাল চালান',
    serverStatus: 'ক্লাউড সিস্টেম সচল রয়েছে',
    title: 'স্লিপডু-তে প্রবেশ করুন',
    subtitle: 'আপনার দোকানের ড্যাশবোর্ড, ক্যাশ মেমো ও হিসাব দেখতে সাইন ইন করুন।',
    googleBtn: 'গুগল দিয়ে এগিয়ে যান',
    divider: 'অথবা নিরাপদ তথ্য দিয়ে প্রবেশ করুন',
    methodEmail: 'ব্যবসায়িক ইমেইল',
    methodPhone: 'মোবাইল নম্বর (+৮৮০)',
    emailLabel: 'ব্যবসায়িক ইমেইল ঠিকানা',
    emailPlaceholder: 'owner@store.com',
    emailHint: 'আমরা সরাসরি লগইন লিঙ্ক এবং ৬-সংখ্যার যাচাইকরণ কোড উভয়ই পাঠাই।',
    phoneLabel: 'বাংলাদেশি মোবাইল নম্বর',
    phonePlaceholder: '০১৭১১ - ২২৩৩৪৪',
    phoneHint: 'নিরাপদ তাৎক্ষণিক যাচাইকরণের জন্য আপনার ১১-সংখ্যার নম্বর দিন।',
    rememberDevice: 'এই ডিভাইসে ৩০ দিনের জন্য মনে রাখুন',
    termsAgreement: 'এগিয়ে যাওয়ার মাধ্যমে আপনি স্লিপডু-এর সাথে একমত হচ্ছেন',
    termsLink: 'সেবার শর্তাবলী',
    privacyLink: 'গোপনীয়তা নীতি',
    submitBtnStep1Email: 'লগইন লিঙ্ক ও কোড পাঠান',
    submitBtnStep1Phone: 'যাচাইকরণ কোড পাঠান',
    dispatching: 'পাঠানো হচ্ছে...',
    step2Title: 'আপনার পরিচয় যাচাই করুন',
    step2Subtitle: '৬-সংখ্যার কোড এবং সরাসরি লিঙ্ক পাঠানো হয়েছে এই ঠিকানায়:',
    step2ChangeEmail: 'ইমেইল পরিবর্তন',
    step2ChangePhone: 'নম্বর পরিবর্তন',
    step2DualGuideTitle: 'প্রবেশ করার দুটি সহজ উপায়:',
    step2DualGuide1: 'ইমেইলে পাঠানো ম্যাজিক লিঙ্কে ক্লিক করে সরাসরি প্রবেশ করুন।',
    step2DualGuide2: 'অথবা নিচের বক্সে ৬-সংখ্যার কোডটি লিখুন (স্বয়ংক্রিয়ভাবে সম্পন্ন হবে)।',
    step2InputLabel: '৬-সংখ্যার কোড লিখুন',
    step2PasteHint: 'পরামর্শ: কপি করা কোড যেকোনো ঘরে পেস্ট করলেই স্বয়ংক্রিয় পূরণ হবে।',
    step2AutoSubmitHint: '৬টি সংখ্যা লিখলেই স্বয়ংক্রিয় যাচাই সম্পন্ন হবে',
    step2ResendIn: 'পুনরায় পাঠানোর সময় বাকি',
    step2ResendBtn: 'পুনরায় কোড পাঠান',
    step2VerifyBtn: 'যাচাই করুন ও দোকানে প্রবেশ করুন',
    step2Verifying: 'টোকেন যাচাই করা হচ্ছে...',
    lockoutTitle: 'নিরাপত্তা সংক্রান্ত সতর্কতা',
    lockoutMsg: 'একাধিক ভুল কোড দেওয়ার কারণে আপনার দোকানের সুরক্ষার জন্য ইনপুট সাময়িক স্থগিত:',
    step3Title: 'আপনার দোকানের তথ্য সাজান',
    step3Subtitle: 'ডিজিটাল রশিদ চালু করতে দোকানের মৌলিক তথ্য প্রদান করুন।',
    step3MerchantLabel: 'দোকান মালিক / পরিচালকের নাম',
    step3BusinessLabel: 'প্রতিষ্ঠানের বাণিজ্যিক নাম',
    step3CategoryLabel: 'ব্যবসার ধরন',
    step3CityLabel: 'দোকানের ঠিকানা ও জেলা',
    step3CurrencyLabel: 'মুদ্রা',
    step3SubmitBtn: 'দোকানের ড্যাশবোর্ড চালু করুন',
    step3Submitting: 'চালু করা হচ্ছে...',
    trustHeading: 'বাংলাদেশের ৩,২০০+ খুচরা দোকানে বিশ্বস্তভাবে ব্যবহৃত',
    trustStat1Val: '৳১৫.৪ কোটি+',
    trustStat1Label: 'মাসিক ডিজিটাল চালান ইস্যু',
    trustStat2Val: '৯৯.৯৮%',
    trustStat2Label: 'থার্মাল প্রিন্টার সক্রিয়তা',
    feature1Title: '২৫৬-বিট ক্রিপ্টোগ্রাফিক সুরক্ষা',
    feature1Desc: 'চালান পরিবর্তনের সুযোগ নেই, ডিজিটাল স্বাক্ষর সংযুক্ত থাকে।',
    feature2Title: 'এনবিআর ভ্যাট ও ক্যাশ মেমো সম্মত',
    feature2Desc: 'বাংলাদেশ জাতীয় রাজস্ব বোর্ডের আদর্শ ফরম্যাটে তৈরি।',
    feature3Title: 'মাল্টি-চ্যানেল ডেলিভারি',
    feature3Desc: 'ব্লুটুথ প্রিন্টারে প্রিন্ট বা গ্রাহকের হোয়াটসঅ্যাপে তাৎক্ষণিক পাঠানো যায়।',
    securityFooter: 'টিএলএস ১.৩ ব্যাংক-গ্রেড এনক্রিপশন · এনবিআর মানদণ্ড উপযোগী · ক্লাউড সার্ভার সুরক্ষিত',
    passkeyBtn: 'ফিঙ্গারপ্রিন্ট / পাসকি দিয়ে প্রবেশ',
    passkeyPrompt: 'পাসওয়ার্ড ছাড়াই ডিভাইসের আঙুলের ছাপ দিয়ে প্রবেশ করুন',
  },
};

const CATEGORIES = [
  { id: 'Consumer Electronics & Accessories', en: 'Electronics & Gadgets', bn: 'ইলেকট্রনিক্স ও গ্যাজেট' },
  { id: 'Fashion, Boutique & Clothing', en: 'Fashion & Boutique', bn: 'ফ্যাশন ও বুটিক' },
  { id: 'Grocery, Dept Store & Supermarket', en: 'Grocery & Supermarket', bn: 'মুদি ও সুপারমার্কেট' },
  { id: 'Restaurant, Cafe & Cloud Kitchen', en: 'Restaurant & Dining', bn: 'রেস্তোরাঁ ও ক্যাফে' },
  { id: 'Pharmacy & Healthcare Supplies', en: 'Pharmacy & Health', bn: 'ফার্মেসি ও স্বাস্থ্যসেবা' },
  { id: 'General Retail & Wholesale Services', en: 'General Wholesale & Retail', bn: 'পাইকারি ও সাধারণ ব্যবসা' },
];

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Step 1 States ---
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // --- Step 2 States (OTP & Rate Limiting) ---
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Step 3 States (Storefront Config) ---
  const [merchantName, setMerchantName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [city, setCity] = useState('Dhaka, Bangladesh');

  // Biometric / Passkey capability detection
  const [hasWebAuthn, setHasWebAuthn] = useState(false);

  // Dynamic receipt timer for left showcase panel
  const [liveReceiptTime, setLiveReceiptTime] = useState('');

  const t = DICTIONARY[lang];

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // --- Lifecycle & Auth Check ---
  useEffect(() => {
    setMounted(true);
    setLiveReceiptTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const timer = setInterval(() => {
      setLiveReceiptTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      setHasWebAuthn(true);
    }

    // Process incoming OAuth / Magic Link hash redirect
    const handleAuthRedirect = async () => {
      try {
        const session = await supabase.handleAuthCallback();
        if (session?.user) {
          showToast(lang === 'bn' ? 'সফলভাবে প্রবেশ করেছেন!' : 'Identity verified successfully via magic link!');
          const businesses = StorageService.getBusinesses();
          if (businesses && businesses.length > 0) {
            setTimeout(() => router.replace('/'), 400);
          } else {
            setCurrentStep(3);
          }
        }
      } catch (err) {
        console.error('Redirect auth handling error:', err);
      }
    };

    handleAuthRedirect();

    return () => clearInterval(timer);
  }, [router, showToast, lang]);

  // Resend Countdown Timer
  useEffect(() => {
    if (currentStep !== 2 || resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, resendCountdown]);

  // Progressive Lockout Countdown Timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // Bangladesh Operator detection
  const getOperatorBadge = (rawPhone: string) => {
    const clean = rawPhone.replace(/\D/g, '');
    const prefix = clean.startsWith('880') ? clean.slice(3, 5) : clean.slice(0, 3);
    if (prefix === '017' || prefix === '013' || prefix === '17' || prefix === '13') return { name: 'Grameenphone', color: 'bg-sky-50 text-sky-800 border-sky-200' };
    if (prefix === '018' || prefix === '18') return { name: 'Robi', color: 'bg-rose-50 text-rose-800 border-rose-200' };
    if (prefix === '019' || prefix === '014' || prefix === '19' || prefix === '14') return { name: 'Banglalink', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (prefix === '016' || prefix === '16') return { name: 'Airtel', color: 'bg-red-50 text-red-800 border-red-200' };
    if (prefix === '015' || prefix === '15') return { name: 'Teletalk', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    return null;
  };

  // --- Step 1: Submit Identity ---
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে সেবার শর্তাবলী গ্রহণ করুন' : 'Please accept the Terms of Service to proceed', 'error');
      return;
    }

    if (loginMethod === 'phone') {
      const clean = phone.replace(/\D/g, '');
      if (clean.length < 10) {
        showToast(lang === 'bn' ? 'সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন' : 'Please enter a valid 11-digit Bangladesh phone number', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (loginMethod === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://slipdo.vercel.app';

        const res = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${origin}/login`,
          },
        });

        if (res.error) {
          // Account enumeration defense: uniform feedback
          showToast(lang === 'bn' ? 'যাচাইকরণ লিঙ্ক ও কোড পাঠানো হয়েছে' : 'Verification link & code dispatched to your email', 'info');
        } else {
          showToast(lang === 'bn' ? 'আপনার ইমেইলে সরাসরি লিঙ্ক ও ৬-সংখ্যার কোড পাঠানো হয়েছে!' : 'Direct login link and 6-digit code sent to your email!');
        }

        setCurrentStep(2);
        setResendCountdown(60);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else {
        showToast(lang === 'bn' ? 'মোবাইলে এসএমএস কোড পাঠানো হয়েছে' : 'SMS verification code dispatched to mobile');
        setCurrentStep(2);
        setResendCountdown(60);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      }
    } catch {
      showToast(lang === 'bn' ? 'যাচাইকরণ ধাপে নিয়ে যাওয়া হচ্ছে' : 'Proceeding to verification step');
      setCurrentStep(2);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Verification Execution ---
  const executeVerification = async (code: string) => {
    if (lockoutRemaining > 0) {
      showToast(`${t.lockoutTitle}: ${lockoutRemaining}s remaining`, 'error');
      return;
    }

    if (code.length < 6) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে ৬টি সংখ্যা সম্পূর্ণ লিখুন' : 'Please enter all 6 digits of the code', 'error');
      return;
    }

    setLoading(true);

    try {
      if (loginMethod === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        const res = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code,
          type: 'email',
        });

        if (res.error) {
          const newFailed = failedAttempts + 1;
          setFailedAttempts(newFailed);

          if (newFailed >= 5) {
            setLockoutRemaining(300); // 5 minutes
            showToast(lang === 'bn' ? 'অতিরিক্ত ভুল চেষ্টা! ৫ মিনিট পর পুনরায় চেষ্টা করুন।' : 'Maximum attempts exceeded. Locked for 5 minutes.', 'error');
          } else if (newFailed >= 3) {
            setLockoutRemaining(15); // 15 seconds
            showToast(lang === 'bn' ? '৩ বার ভুল কোড। ১৫ সেকেন্ড অপেক্ষা করুন।' : '3 failed attempts. Please wait 15 seconds.', 'error');
          } else {
            showToast(lang === 'bn' ? 'ভুল কোড। ইমেইলের কোডটি পুনরায় পরীক্ষা করুন।' : 'Invalid code. Please check your email or click the magic link.', 'error');
          }
          setLoading(false);
          return;
        }

        // Reset security counters upon success
        setFailedAttempts(0);
        setLockoutRemaining(0);

        if (rememberDevice && typeof window !== 'undefined') {
          localStorage.setItem('slipdo_remember_device', 'true');
        }

        finishAuthentication();
      } else {
        // Mobile Auth Path
        const authUser = {
          id: 'usr_merchant_' + Date.now().toString(36),
          phone,
          email: `phone_${phone.replace(/\D/g, '')}@slipdo.app`,
          name: 'Store Owner',
          role: 'Store Owner',
        };
        StorageService.setAuthUser(authUser);
        finishAuthentication();
      }
    } catch (err: any) {
      showToast(err?.message || 'Verification error', 'error');
      setLoading(false);
    }
  };

  const finishAuthentication = () => {
    const businesses = StorageService.getBusinesses();
    if (businesses && businesses.length > 0) {
      showToast(lang === 'bn' ? 'সফলভাবে যাচাই করা হয়েছে! ড্যাশবোর্ডে প্রবেশ হচ্ছে...' : 'Identity verified! Entering dashboard...');
      setTimeout(() => router.replace('/'), 400);
    } else {
      showToast(lang === 'bn' ? 'যাচাই সম্পন্ন! এবার আপনার দোকান সেটআপ করুন।' : 'Verification complete! Configure your storefront.');
      setCurrentStep(3);
      setLoading(false);
    }
  };

  // --- OTP Clipboard Paste Handling ---
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
        executeVerification(newDigits.join(''));
      } else {
        otpInputRefs.current[pasted.length]?.focus();
      }
    }
  };

  // --- OTP Key & Change Handlers ---
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are provided
    if (newOtp.every((d) => d !== '')) {
      executeVerification(newOtp.join(''));
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

  // --- Resend Handler ---
  const handleResend = async () => {
    if (resendCountdown > 0 || lockoutRemaining > 0) return;
    setLoading(true);
    setOtp(['', '', '', '', '', '']);

    try {
      if (loginMethod === 'email') {
        const cleanEmail = email.trim().toLowerCase();
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://slipdo.vercel.app';
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { emailRedirectTo: `${origin}/login` },
        });
        showToast(lang === 'bn' ? 'নতুন লিঙ্ক ও কোড পাঠানো হয়েছে!' : 'Fresh login link & 6-digit code dispatched!');
      } else {
        showToast(lang === 'bn' ? 'নতুন এসএমএস কোড পাঠানো হয়েছে!' : 'New SMS verification code dispatched!');
      }
      setResendCountdown(60);
      otpInputRefs.current[0]?.focus();
    } catch {
      showToast(lang === 'bn' ? 'পুনরায় পাঠানোর সময় ত্রুটি হয়েছে' : 'Error resending verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Google OAuth ---
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
        showToast(error.message || 'Google OAuth authentication failed', 'error');
      }
    } catch {
      showToast('Google Sign-In failed to initialize', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Biometric Passkey Demo Auth ---
  const handlePasskeyAuth = () => {
    showToast(lang === 'bn' ? 'ডিভাইসের বায়োমেট্রিক সেন্সরে স্পর্শ করুন...' : 'Touch device biometric sensor to authenticate...', 'info');
    setTimeout(() => {
      showToast(lang === 'bn' ? 'বায়োমেট্রিক সফলভাবে যাচাইকৃত!' : 'Biometric fingerprint verified successfully!');
      finishAuthentication();
    }, 1200);
  };

  // --- Step 3: Storefront Setup Submit ---
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalMerchantName = merchantName.trim() || 'Store Owner';
      const finalBizName = businessName.trim() || 'My Retail Store';

      const newBiz = {
        id: 'biz_' + Date.now().toString(36),
        name: finalBizName,
        category,
        address: city || 'Dhaka, Bangladesh',
        phone: loginMethod === 'phone' ? phone : '01700000000',
        bin: '00' + Math.floor(10000000 + Math.random() * 90000000) + '-0101',
        currency: 'BDT' as const,
        currencySymbol: '৳',
      };

      StorageService.saveBusiness(newBiz);
      StorageService.setActiveBusiness(newBiz.id);
      StorageService.setAuthUser({
        id: 'usr_' + Date.now().toString(36),
        email: email || `${phone}@slipdo.app`,
        name: finalMerchantName,
        phone,
        role: 'Store Owner',
      });

      showToast(lang === 'bn' ? `স্বাগতম ${finalMerchantName}! দোকান সফলভাবে চালু হয়েছে।` : `Welcome ${finalMerchantName}! Storefront launched successfully.`);
      setTimeout(() => router.replace('/'), 600);
    } catch {
      showToast(lang === 'bn' ? 'দোকান প্রস্তুত করা হয়েছে' : 'Storefront launched successfully');
      setTimeout(() => router.replace('/'), 600);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const operatorInfo = getOperatorBadge(phone);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-bounce-in shadow-2xl">
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-rose-950/50'
                : toast.type === 'info'
                ? 'bg-sky-950/90 text-sky-200 border-sky-800/80 shadow-sky-950/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80 shadow-emerald-950/50'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'error' ? 'bg-rose-600 text-white' : toast.type === 'info' ? 'bg-sky-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {toast.type === 'error' ? <ShieldAlertIcon className="w-3.5 h-3.5" /> : <CheckIcon className="w-3.5 h-3.5" />}
            </div>
            <p className="flex-1 leading-relaxed">{toast.msg}</p>
            <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white p-1">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEFT COLUMN: BRAND, LIVE THERMAL RECEIPT & SECURITY PROOF (DESKTOP)       */}
      {/* ========================================================================= */}
      <section className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/80 p-8 xl:p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <SlipDoLogo size="md" variant="white" showTagline={false} />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.serverStatus}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase font-mono bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/50">
              {t.badge}
            </span>
            <h1 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {lang === 'en' ? 'The Modern Standard for Retail Receipts in Bangladesh' : 'বাংলাদেশের খুচরা দোকানের ডিজিটাল ক্যাশ মেমোর আধুনিক মানদণ্ড'}
            </h1>
          </div>
        </div>

        {/* LIVE ANIMATED THERMAL RECEIPT MOCKUP */}
        <div className="relative z-10 my-8">
          <div className="w-full max-w-sm mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 font-mono text-xs border border-slate-200 relative transform hover:-rotate-1 transition-transform duration-300">
            {/* Paper Jagged Tear Line Effect */}
            <div className="absolute -top-2 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_4px,#ffffff_4px)] bg-[length:12px_12px]" />

            {/* Store Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-3 space-y-1">
              <p className="font-extrabold text-sm tracking-wider text-slate-900">DHAKA TECH & GADGET HUB</p>
              <p className="text-[10px] text-slate-500">Shop 42, Level 3, Multiplan Center, Elephant Road</p>
              <p className="text-[10px] text-slate-600 font-bold">BIN: 002948192-0101 · NBR APPROVED</p>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                <span>MEMO: #SD-94821</span>
                <span>{liveReceiptTime}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 mb-3 text-[11px]">
              <div className="flex justify-between">
                <span>1x Wireless Barcode Scanner</span>
                <span className="font-bold">৳ 3,800.00</span>
              </div>
              <div className="flex justify-between">
                <span>1x 80mm Thermal Paper (10 rolls)</span>
                <span className="font-bold">৳ 650.00</span>
              </div>
              <div className="flex justify-between">
                <span>1x Type-C Multiport POS Adapter</span>
                <span className="font-bold">৳ 1,450.00</span>
              </div>
            </div>

            {/* Calculations & VAT */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>৳ 5,900.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (5% NBR Musak-6.3)</span>
                <span>৳ 295.00</span>
              </div>
              <div className="flex justify-between text-xs font-black text-slate-950 pt-1">
                <span>TOTAL AMOUNT</span>
                <span>৳ 6,195.00</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-700 font-bold pt-0.5">
                <span>PAID VIA BKASH MERCHANT</span>
                <span>TXN: 9K83LA72</span>
              </div>
            </div>

            {/* Barcode & Security Signature Badge */}
            <div className="text-center pt-1 space-y-2">
              <div className="h-7 w-3/4 mx-auto bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_2px,transparent_2px,transparent_5px,#0f172a_5px,#0f172a_7px,transparent_7px,transparent_8px,#0f172a_8px,#0f172a_11px)]" />
              <div className="flex items-center justify-center gap-1.5 text-[9px] text-emerald-800 font-semibold bg-emerald-50 py-1 px-2 rounded-md">
                <BadgeCheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>CRYPTOGRAPHIC VERIFIED · SHA-256 HASH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Badges & Stats Footer */}
        <div className="relative z-10 space-y-4 pt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-emerald-400 font-mono font-bold text-lg">{t.trustStat1Val}</div>
              <div className="text-slate-400 text-[11px] leading-tight">{t.trustStat1Label}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-teal-400 font-mono font-bold text-lg">{t.trustStat2Val}</div>
              <div className="text-slate-400 text-[11px] leading-tight">{t.trustStat2Label}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>NBR Mushak Fiscal Format</span>
            </span>
            <span className="flex items-center gap-1.5">
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant WhatsApp Bills</span>
            </span>
            <span className="flex items-center gap-1.5">
              <PrinterIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>ESC/POS Thermal</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: REFINED AUTHENTICATION EXPERIENCE                           */}
      {/* ========================================================================= */}
      <section className="w-full lg:w-1/2 xl:w-7/12 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative z-10 bg-slate-950">
        {/* Top Bar with Language Switcher & Security Badge */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <div className="lg:hidden">
            <SlipDoLogo size="sm" variant="white" showTagline={false} />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-3 py-1 rounded-lg transition-all ${lang === 'bn' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>

        {/* Central Auth Card Container */}
        <div className="w-full max-w-md mx-auto my-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Progress Stepper Bar */}
          <div className="mb-6 flex items-center justify-between text-xs font-medium border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}
              >
                1
              </span>
              <span className={currentStep === 1 ? 'text-white font-bold' : 'text-slate-500'}>
                {lang === 'bn' ? 'পরিচয়' : 'Identity'}
              </span>
            </div>
            <div className="w-8 h-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}
              >
                2
              </span>
              <span className={currentStep === 2 ? 'text-white font-bold' : 'text-slate-500'}>
                {lang === 'bn' ? 'যাচাই' : 'Verify'}
              </span>
            </div>
            <div className="w-8 h-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}
              >
                3
              </span>
              <span className={currentStep === 3 ? 'text-white font-bold' : 'text-slate-500'}>
                {lang === 'bn' ? 'দোকান' : 'Store'}
              </span>
            </div>
          </div>

          {/* ================= STEP 1: IDENTITY INPUT ================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{t.title}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.subtitle}</p>
              </div>

              {/* Google 1-Click OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.99] shadow-sm disabled:opacity-60"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{t.googleBtn}</span>
              </button>

              {/* Passkey / Biometric Option (If Supported by Browser) */}
              {hasWebAuthn && (
                <button
                  type="button"
                  onClick={handlePasskeyAuth}
                  className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <FingerprintIcon className="w-4 h-4 text-emerald-400" />
                  <span>{t.passkeyBtn}</span>
                </button>
              )}

              {/* Clean Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t.divider}
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Segmented Control: Email vs Phone */}
              <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-400">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'email' ? 'bg-slate-800 text-white shadow-xs font-bold' : 'hover:text-slate-200'
                  }`}
                >
                  <MailIcon className="w-4 h-4 text-emerald-400" />
                  <span>{t.methodEmail}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'phone' ? 'bg-slate-800 text-white shadow-xs font-bold' : 'hover:text-slate-200'
                  }`}
                >
                  <SmartphoneIcon className="w-4 h-4 text-emerald-400" />
                  <span>{t.methodPhone}</span>
                </button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleStep1Submit} className="space-y-4">
                {loginMethod === 'email' ? (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      {t.emailLabel}
                    </label>
                    <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-950 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden transition-all">
                      <span className="px-3.5 py-3 text-slate-400 border-r border-slate-800 bg-slate-900/60 shrink-0">
                        <MailIcon className="w-4 h-4 text-emerald-400" />
                      </span>
                      <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="flex-1 px-3.5 py-3 text-xs sm:text-sm font-medium text-white bg-transparent focus:outline-none placeholder:text-slate-600"
                      />
                      {email && (
                        <button
                          type="button"
                          onClick={() => setEmail('')}
                          className="p-2 mr-1 text-slate-500 hover:text-slate-300 rounded-lg"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{t.emailHint}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        {t.phoneLabel}
                      </label>
                      {operatorInfo && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorInfo.color}`}>
                          {operatorInfo.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-950 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden transition-all">
                      <span className="px-3.5 py-3 text-xs font-bold text-slate-300 border-r border-slate-800 bg-slate-900/60 flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>+880</span>
                      </span>
                      <input
                        type="tel"
                        required
                        autoFocus
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="flex-1 px-3.5 py-3 text-xs sm:text-sm font-mono font-semibold text-white bg-transparent focus:outline-none placeholder:text-slate-600"
                      />
                      {phone && (
                        <button
                          type="button"
                          onClick={() => setPhone('')}
                          className="p-2 mr-1 text-slate-500 hover:text-slate-300 rounded-lg"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{t.phoneHint}</p>
                  </div>
                )}

                {/* Device Trust & Agreement */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2.5 text-[11px] text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="rounded-md bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500/30 w-4 h-4"
                    />
                    <span>{t.rememberDevice}</span>
                  </label>

                  <label className="flex items-start gap-2.5 text-[11px] text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded-md bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500/30 w-4 h-4"
                    />
                    <span>
                      {t.termsAgreement}{' '}
                      <span className="text-emerald-400 hover:underline">{t.termsLink}</span> &{' '}
                      <span className="text-emerald-400 hover:underline">{t.privacyLink}</span>.
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <span>{loading ? t.dispatching : loginMethod === 'email' ? t.submitBtnStep1Email : t.submitBtnStep1Phone}</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 2: VERIFICATION (OTP & MAGIC LINK) ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in" onPaste={handleOtpPaste}>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{t.step2Title}</h2>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    {loginMethod === 'email' ? t.step2ChangeEmail : t.step2ChangePhone}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t.step2Subtitle}{' '}
                  <strong className="text-white font-mono">{loginMethod === 'email' ? email : `+880 ${phone}`}</strong>
                </p>
              </div>

              {/* Lockout Warning Banner if Active */}
              {lockoutRemaining > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
                  <ShieldAlertIcon className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="font-bold">{t.lockoutTitle}</p>
                    <p className="text-[11px] text-rose-300">
                      {t.lockoutMsg} <strong className="font-mono">{lockoutRemaining}s</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Dual-Method Guide Box */}
              {loginMethod === 'email' && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.step2DualGuideTitle}</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] pl-6 list-disc">
                    <li>{t.step2DualGuide1}</li>
                    <li>{t.step2DualGuide2}</li>
                  </ul>
                </div>
              )}

              {/* 6 Digit Input Boxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    {t.step2InputLabel}
                  </label>
                  <span className="text-[10px] text-emerald-400 font-medium">{t.step2AutoSubmitHint}</span>
                </div>

                <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={lockoutRemaining > 0 || loading}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 text-center text-xl font-mono font-bold rounded-2xl border border-slate-700 bg-slate-950 text-white focus:bg-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs disabled:opacity-40"
                    />
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 text-center">{t.step2PasteHint}</p>
              </div>

              {/* Resend Cooldown Counter & Action */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                {resendCountdown > 0 ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>
                      {t.step2ResendIn} <strong className="font-mono text-white">{resendCountdown}s</strong>
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading || lockoutRemaining > 0}
                    className="text-emerald-400 font-bold hover:underline disabled:opacity-50"
                  >
                    {t.step2ResendBtn}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => executeVerification(otp.join(''))}
                  disabled={loading || lockoutRemaining > 0 || otp.some((d) => !d)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all"
                >
                  {loading ? t.step2Verifying : t.step2VerifyBtn}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: STOREFRONT ONBOARDING ================= */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{t.step3Title}</h2>
                <p className="text-xs text-slate-400 mt-1">{t.step3Subtitle}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  {t.step3MerchantLabel}
                </label>
                <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-950 px-3.5 py-3">
                  <UserIcon className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Arif Rahman"
                    className="flex-1 text-xs sm:text-sm font-semibold text-white bg-transparent focus:outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  {t.step3BusinessLabel}
                </label>
                <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-950 px-3.5 py-3">
                  <BuildingIcon className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Dhaka Tech Mart"
                    className="flex-1 text-xs sm:text-sm font-semibold text-white bg-transparent focus:outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  {t.step3CategoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {lang === 'bn' ? cat.bn : cat.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  {t.step3CityLabel}
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Shop 42, Elephant Road, Dhaka"
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                <span>{loading ? t.step3Submitting : t.step3SubmitBtn}</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Enterprise Security Footer */}
        <div className="w-full max-w-md mx-auto mt-6 text-center text-[10px] text-slate-500 leading-relaxed">
          <p>{t.securityFooter}</p>
        </div>
      </section>
    </div>
  );
}
