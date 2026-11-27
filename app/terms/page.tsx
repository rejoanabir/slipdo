import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft space-y-6">
        <div>
          <Link href="/" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 mb-4">
            ← Back to SlipDo
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Terms of Service</h1>
          <p className="text-xs text-slate-500 mt-1">Effective Date: November 2026 · SlipDo Bangladesh</p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the SlipDo platform, merchant portal, APIs, or public verification URLs, you agree to be bound by these Terms of Service. If you are registering on behalf of a business entity in Bangladesh or abroad, you warrant that you have authority to bind that business.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">2. Merchant Responsibilities</h2>
            <p>
              Merchants are solely responsible for ensuring the accuracy of all prices, quantities, VAT/BIN numbers, and customer information entered on vouchers. SlipDo provides cryptographic authenticity tracking but does not act as a fiscal auditor.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">3. Digital Receipt Verification</h2>
            <p>
              Vouchers issued through SlipDo carry a unique tamper-evident token. Customers may verify their purchase authentic receipt at any time via the public token lookup URL. Merchants agree not to generate fraudulent or deceitful payment vouchers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">4. Service Availability & Offline Operation</h2>
            <p>
              SlipDo includes offline-first local caching capabilities for retail counters. Offline data synchronizes with the cloud once network connectivity is re-established.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 SlipDo SaaS. All rights reserved.</span>
          <Link href="/privacy" className="text-emerald-700 font-semibold hover:underline">
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
