import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft space-y-6">
        <div>
          <Link href="/" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 mb-4">
            ← Back to SlipDo
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Effective Date: November 2026 · SlipDo Bangladesh</p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">1. Information We Collect</h2>
            <p>
              We collect information provided during merchant registration (phone number, store name, category, outlet address) and transaction data required to generate digital receipts (items, prices, customer phone/email).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">2. How Data is Used & Secured</h2>
            <p>
              Data is processed through Row Level Security (RLS) encrypted database clusters. Merchant data is isolated so no third-party merchant can view or modify other businesses' financial records or customer lists.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">3. Customer Privacy</h2>
            <p>
              When a merchant sends a digital receipt to a customer via SMS or WhatsApp, the customer's phone number is used strictly for receipt delivery and CRM grouping for that specific merchant. SlipDo does not sell or distribute consumer contact numbers to third-party ad networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">4. Data Deletion & Retention</h2>
            <p>
              Merchants can request complete account deletion and data removal at any time through our support team or settings dashboard.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 SlipDo SaaS. All rights reserved.</span>
          <Link href="/terms" className="text-emerald-700 font-semibold hover:underline">
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
