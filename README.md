# 🧾 Payment Receipt SaaS

A modern, mobile-first Payment Receipt and Invoicing SaaS designed for small businesses, shops, and freelancers in Bangladesh and globally. Generate branded receipts, share instantly on WhatsApp, Email, or SMS, and track financial sales in under 30 seconds.

---

## ✨ Features Built in Phase 0 & Phase 1

- **⚡ Fast Live Receipt Generator**:
  - Auto-numbering format (`RCP-YYYY-XXXX`)
  - Dynamic line items, unit price, quantity, tax/VAT rates
  - Server-grade calculation: Subtotal, Flat/Percentage discounts, Delivery charges, and Grand Total
  - Multi-currency support: BDT (৳) with South Asian lakhs/crores formatting (`৳ 1,23,456.00`) and optional Bangla numerals (`১২,৩৪,৫৬৭.০০`), USD ($), EUR (€), INR (₹)
  - Payment method tags: **bKash**, **Nagad**, **Rocket**, **Cash**, **Bank Card**, **Bank Transfer**
  - TrxID / Transaction reference tracking

- **🎨 5 Built-in Design Templates**:
  1. **Modern Emerald**: Modern card layout with gradient emerald banner and badge highlights.
  2. **Bangla First (বাংলা মেমো / ভাউচার)**: Authentic Bangladeshi money receipt layout with Bengali headings and numerals.
  3. **Classic Formal**: Traditional dual-border corporate receipt with authorized signature area.
  4. **Clean Minimalist**: High negative space Swiss typography.
  5. **58mm / 80mm Thermal POS**: Monospaced slip style with dashed separators and barcode/QR footer.

- **📲 1-Click WhatsApp & Email Delivery**:
  - Direct WhatsApp click-to-chat integration (`wa.me`) with pre-composed receipt summary and verification link.
  - Email draft composer and print-ready stylesheet (`@media print`) optimized for A4 paper and thermal rolls.

- **🔒 Cryptographic QR Verification & Public Token**:
  - Each receipt has an unguessable public token `/r/[token]`
  - Lightweight SVG QR code generated on every voucher for authenticity verification.

- **📊 Financial Dashboard & Customer Directory**:
  - KPI cards: Today's Sales, Lifetime Volume, Total Issued Receipts, and Total Customers.
  - Searchable, filterable receipts table (Paid, Partial, Unpaid, Void).
  - Customer directory with lifetime spend tracking and contact info.

- **🗄️ Database & Cloud Ready**:
  - `schema.sql`: Full Supabase PostgreSQL schema with Row Level Security (RLS) policies, multi-tenant isolation, atomic receipt numbering DB function, and audit logging.
  - Hybrid local storage engine: runs completely out-of-the-box in demo mode, ready to connect live Supabase API keys anytime via `.env`.

---

## 🚀 Getting Started on Termux / Android

### Running the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your phone browser.

### Building for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx         # Root layout with Inter & Bengali fonts
│   ├── page.tsx           # Dashboard KPI & recent receipts
│   ├── new/page.tsx       # Live receipt builder & real-time preview
│   ├── receipts/page.tsx  # Searchable & filterable receipts directory
│   ├── customers/page.tsx # Customer directory & lifetime spend
│   ├── settings/page.tsx  # Store profile & SSLCommerz billing tiers
│   └── r/[token]/page.tsx # Public verified receipt viewer
├── components/
│   ├── Navbar.tsx         # Sticky header with language toggle & business badge
│   ├── BottomNav.tsx      # Mobile app bottom navigation bar
│   ├── ReceiptForm.tsx    # Interactive receipt creation form
│   ├── ReceiptPreview.tsx # 5 templates renderer (Modern, Bangla, Classic, Minimal, POS)
│   ├── ShareModal.tsx     # WhatsApp, Email, Print & Public Link share modal
│   ├── BusinessModal.tsx  # Business profile editing modal
│   ├── QRCodeSVG.tsx      # Lightweight pure SVG QR code generator
│   └── Icons.tsx          # Zero-dependency SVG icon system
├── lib/
│   ├── types.ts           # Domain models (Business, Customer, Receipt, etc.)
│   ├── format.ts          # South Asian comma & Bengali digits formatters
│   ├── i18n.ts            # English & Bangla localization strings
│   ├── storage.ts         # Hybrid storage persistence engine
│   └── mockData.ts        # Seed data
└── schema.sql             # Supabase PostgreSQL schema with RLS & functions
```
