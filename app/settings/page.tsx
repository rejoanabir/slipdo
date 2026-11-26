'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { Business } from '../../lib/types';
import { Language } from '../../lib/i18n';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BusinessModal } from '../../components/BusinessModal';
import { CheckCircleIcon, SparklesIcon } from '../../components/Icons';

export default function SettingsPage() {
  const [lang, setLang] = useState<Language>('en');
  const [business, setBusiness] = useState<Business>(StorageService.getBusiness());
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  const [billingNotice, setBillingNotice] = useState<string | null>(null);

  useEffect(() => {
    setBusiness(StorageService.getBusiness());
  }, []);

  const handleUpgradePro = () => {
    setBillingNotice('Connecting to SSLCommerz Bangladesh Gateway (Sandbox mode)...');
    setTimeout(() => {
      setSelectedPlan('pro');
      setBillingNotice('🎉 Successfully activated Pro Plan (Sandbox test)!');
      setTimeout(() => setBillingNotice(null), 4000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar
        business={business}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
        onOpenBusinessSettings={() => setIsBusinessModalOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">
            {lang === 'bn' ? 'সেটিংস ও সাবস্ক্রিপশন' : 'Settings & Billing'}
          </h1>
          <p className="text-xs text-neutral-500">
            Manage your store details, receipt branding, and subscription plan
          </p>
        </div>

        {billingNotice && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold animate-pulse">
            {billingNotice}
          </div>
        )}

        {/* Store Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Store & Merchant Profile</h2>
              <p className="text-xs text-neutral-500">
                This appears on your headers, QR verification, and print receipts
              </p>
            </div>
            <button
              onClick={() => setIsBusinessModalOpen(true)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-bold text-neutral-800"
            >
              Edit Info
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <span className="text-neutral-400 font-medium block">Business Name</span>
              <span className="font-bold text-neutral-800 text-sm">{business.name}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-medium block">Phone / WhatsApp</span>
              <span className="font-semibold text-neutral-800">{business.phone}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-medium block">Address</span>
              <span className="text-neutral-700">{business.address}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-medium block">BIN / Tax ID</span>
              <span className="font-mono text-neutral-700">{business.binTin || 'Not configured'}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-medium block">Receipt Prefix</span>
              <span className="font-mono font-bold text-emerald-700">{business.receiptPrefix || 'RCP'}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-medium block">Currency</span>
              <span className="font-bold text-neutral-800">{business.currency} ({business.currencySymbol})</span>
            </div>
          </div>
        </div>

        {/* Subscription Plans Card */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Subscription Plans</h2>
              <p className="text-xs text-neutral-500">
                Supports bKash, Nagad, Rocket and Cards via SSLCommerz
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              Current Plan: {selectedPlan.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Free Plan */}
            <div className={`p-5 rounded-2xl border-2 transition ${selectedPlan === 'free' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-neutral-800">Free Tier</span>
                <span className="text-base font-extrabold text-neutral-900">৳০ / month</span>
              </div>
              <p className="text-xs text-neutral-500 mb-4">Perfect for individual freelancers & starting shops</p>

              <ul className="text-xs text-neutral-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600" />
                  <span>30 Receipts per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600" />
                  <span>WhatsApp, Email & Public Link sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600" />
                  <span>Standard Templates & QR verification</span>
                </li>
              </ul>

              {selectedPlan === 'free' ? (
                <div className="w-full py-2.5 text-center bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl">
                  Active Plan
                </div>
              ) : (
                <button
                  onClick={() => setSelectedPlan('free')}
                  className="w-full py-2.5 text-center border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-100"
                >
                  Downgrade to Free
                </button>
              )}
            </div>

            {/* Pro Plan */}
            <div className={`p-5 rounded-2xl border-2 relative transition ${selectedPlan === 'pro' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-emerald-200 bg-emerald-50/20'}`}>
              <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Popular
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                  <SparklesIcon size={16} className="text-emerald-600" />
                  <span>Pro Business</span>
                </span>
                <span className="text-base font-extrabold text-emerald-900">৳২৯৯ / month</span>
              </div>
              <p className="text-xs text-neutral-500 mb-4">Unlimited power for growing shops & retail businesses</p>

              <ul className="text-xs text-neutral-700 space-y-2 mb-6 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600" />
                  <span><strong>Unlimited</strong> receipts every month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600" />
                  <span>All 5 Premium Templates + Remove Watermark</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600" />
                  <span>100 SMS notifications included / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600" />
                  <span>Gemini AI OCR paper receipt scanner</span>
                </li>
              </ul>

              {selectedPlan === 'pro' ? (
                <div className="w-full py-2.5 text-center bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md">
                  Active Pro Member
                </div>
              ) : (
                <button
                  onClick={handleUpgradePro}
                  className="w-full py-2.5 text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Upgrade via bKash / SSLCommerz
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav lang={lang} />

      <BusinessModal
        business={business}
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        onSave={(updated) => {
          setBusiness(updated);
          StorageService.saveBusiness(updated);
        }}
        lang={lang}
      />
    </div>
  );
}
