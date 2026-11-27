import { Business, Customer, Receipt, FigmaChecklistItem } from './types';

// Clean initial state - Zero random/fake records
export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz_default',
    name: 'My Store',
    nameBn: 'আমার দোকান',
    category: 'General Retail & Services',
    categoryBn: 'খুচরা ব্যবসা ও সেবা',
    address: 'Dhaka, Bangladesh',
    phone: '+880 1700-000000',
    bin: '000000000-0101',
    currency: 'BDT',
    currencySymbol: '৳',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_RECEIPTS: Receipt[] = [];

export const FIGMA_CHECKLIST_ITEMS: FigmaChecklistItem[] = [
  { id: 'f1', group: 'Step 1 · Design Tokens & Variables', tag: 'Tokens', label: 'Color Variables: Primary Emerald (#059669, 50-900), Slate Neutrals, Semantic Status', done: true },
  { id: 'f2', group: 'Step 1 · Design Tokens & Variables', tag: 'Tokens', label: 'Local MFS Brand Tokens: bKash (#E2136E), Nagad (#F7941D), Rocket (#8C3494) + Cash/Bank', done: true },
  { id: 'f3', group: 'Step 1 · Design Tokens & Variables', tag: 'Type', label: 'Bilingual Typography Scale: Inter / Plus Jakarta Sans + Noto Sans Bengali / Hind Siliguri', done: true },
  { id: 'f4', group: 'Step 1 · Design Tokens & Variables', tag: 'Locale', label: 'South Asian Number Formatting Specs: ৳ 1,23,456.00 (EN) & ১২,৩৪,৫৬৭.০০ (BN)', done: true },
  { id: 'f5', group: 'Step 1 · Design Tokens & Variables', tag: 'Tokens', label: 'Elevation, Shadow & Radius Tokens: Card Soft, Elevated FAB, Modal Backdrop, 8/12/16/24px', done: true },
  { id: 'f6', group: 'Step 2 · Mobile (390px) Components', tag: '390px', label: 'Mobile App Shell: Sticky Header (56px), Business Switcher Drawer, 5-Item Bottom Nav + Center (+) FAB', done: true },
  { id: 'f7', group: 'Step 2 · Mobile (390px) Components', tag: '390px', label: 'Mobile Dashboard: Gradient Store Banner, 2x2 KPI Cards, Search Input, Filter Chips & Voucher List', done: true },
  { id: 'f8', group: 'Step 2 · Mobile (390px) Components', tag: '390px', label: 'Mobile Receipt Creator: Segmented Control ([Edit Details] vs [Live Preview]), Item Rows, VAT/Discount & MFS Chips', done: true },
  { id: 'f9', group: 'Step 2 · Mobile (390px) Components', tag: '390px', label: 'Mobile CRM & Settings: Customer Directory Cards, Free vs Pro Tier Cards & SSLCommerz Bottom Sheet', done: true },
  { id: 'f10', group: 'Step 3 · Desktop (1280px) Components', tag: '1280px', label: 'Desktop App Shell: 256px Left Sidebar with Storefront Switcher, Top Bar & Fluid Content Grid', done: true },
  { id: 'f11', group: 'Step 3 · Desktop (1280px) Components', tag: '1280px', label: 'Desktop Dashboard & Creator: 4-Column KPI Row, Full Voucher Table & 12-Col Split-Screen Editor', done: true },
  { id: 'f12', group: 'Step 3 · Desktop (1280px) Components', tag: 'Modal', label: 'Share & Delivery Modal: 1-Click WhatsApp (wa.me), 58/80mm Thermal & A4 Print Triggers, Link Copier', done: true },
  { id: 'f13', group: 'Step 3 · Desktop (1280px) Components', tag: 'Web', label: 'Public Verification Page (/r/[token]): Cryptographic SHA-256 QR Stamp, Verified Badge & Print/PDF Action', done: true },
  { id: 'f14', group: 'Step 4 · Vector Voucher Layouts (5 Templates)', tag: 'Vector', label: 'Template 1 — Modern Emerald: Gradient header branding, crisp card styling & QR verification box', done: true },
  { id: 'f15', group: 'Step 4 · Vector Voucher Layouts (5 Templates)', tag: 'Vector', label: 'Template 2 — বাংলা মেমো / ভাউচার: Authentic Bangladeshi cash memo grid, Bengali numerals & signature lines', done: true },
  { id: 'f16', group: 'Step 4 · Vector Voucher Layouts (5 Templates)', tag: 'Vector', label: 'Template 3 — Classic Formal: Double-bordered corporate invoice with BIN & authorized signatory box', done: true },
  { id: 'f17', group: 'Step 4 · Vector Voucher Layouts (5 Templates)', tag: 'Vector', label: 'Template 4 — Clean Minimalist: Swiss high-whitespace layout, hairline dividers & monospace totals', done: true },
  { id: 'f18', group: 'Step 4 · Vector Voucher Layouts (5 Templates)', tag: 'Vector', label: 'Template 5 — 58mm / 80mm Thermal POS: Monospaced slip roll with dashed dividers & compact QR footer', done: true },
  { id: 'f19', group: 'Step 5 · Icon Assets & Logo Lockup', tag: 'Brand', label: 'Finalize Logo Lockup Decision: Digital Voucher + Checkmark vs. Stylized "S" Monogram (Light/Dark)', done: true },
  { id: 'f20', group: 'Step 5 · Icon Assets & Logo Lockup', tag: 'SVG', label: 'Export 24px UI Icon Set (1.75px stroke), MFS Payment Badges, App Store Icons (1024px) & Dev Handoff Specs', done: true },
];
