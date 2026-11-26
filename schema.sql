-- ==============================================================================
-- Payment Receipt SaaS Database Schema (Supabase PostgreSQL + RLS)
-- Designed for Multi-tenant isolation, atomic receipt numbering, and auditability
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BUSINESSES TABLE (Tenants)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tagline TEXT,
    logo_url TEXT,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '৳',
    phone TEXT,
    email TEXT,
    address TEXT,
    bin_tin TEXT, -- Business Identification Number / Taxpayer Identification Number
    receipt_prefix VARCHAR(10) NOT NULL DEFAULT 'RCP',
    next_number INTEGER NOT NULL DEFAULT 1,
    default_tax_rate NUMERIC(5,2) DEFAULT 0.00,
    default_notes TEXT DEFAULT 'Thank you for your business! / ধন্যবাদ, আবার আসবেন।',
    theme_color VARCHAR(20) DEFAULT '#059669',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. BUSINESS MEMBERS (Users assigned to a business)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id) in Supabase
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(business_id, user_id)
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    total_spent NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    receipt_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. RECEIPTS
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    number TEXT NOT NULL, -- e.g. RCP-2026-0001
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '৳',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    shipping_fee NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Card', 'Bank Transfer', 'Other')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Partial', 'Unpaid', 'Void')),
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    amount_due NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    transaction_id TEXT,
    template_id VARCHAR(30) NOT NULL DEFAULT 'modern-emerald',
    notes TEXT,
    terms TEXT,
    public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(business_id, number)
);

-- 5. RECEIPT ITEMS
CREATE TABLE IF NOT EXISTS public.receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 6. RECEIPT DELIVERIES (Audit log of WhatsApp, Email, SMS transmissions)
CREATE TABLE IF NOT EXISTS public.receipt_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms', 'link_copy')),
    recipient TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. SUBSCRIPTIONS & USAGE LIMITS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()) + INTERVAL '30 days'),
    monthly_receipt_count INTEGER NOT NULL DEFAULT 0,
    monthly_sms_count INTEGER NOT NULL DEFAULT 0,
    monthly_ocr_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. OCR SCANS
CREATE TABLE IF NOT EXISTS public.ocr_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    raw_response JSONB,
    extracted_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- INDEXES FOR HIGH QUERY EFFICIENCY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_receipts_business ON public.receipts(business_id);
CREATE INDEX IF NOT EXISTS idx_receipts_customer ON public.receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_issue_date ON public.receipts(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_public_token ON public.receipts(public_token);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON public.receipt_items(receipt_id);

-- ==============================================================================
-- ATOMIC RECEIPT NUMBER GENERATOR FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_business_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prefix TEXT;
    v_next_num INTEGER;
    v_year TEXT;
    v_formatted_num TEXT;
BEGIN
    SELECT receipt_prefix, next_number INTO v_prefix, v_next_num
    FROM public.businesses
    WHERE id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business not found';
    END IF;

    v_year := to_char(CURRENT_DATE, 'YYYY');
    v_formatted_num := v_prefix || '-' || v_year || '-' || lpad(v_next_num::text, 4, '0');

    UPDATE public.businesses
    SET next_number = next_number + 1,
        updated_at = timezone('utc', now())
    WHERE id = p_business_id;

    RETURN v_formatted_num;
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation enforced directly in Postgres
-- ==============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_scans ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current authenticated user a member of target business?
CREATE OR REPLACE FUNCTION public.is_business_member(b_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = b_id AND user_id = auth.uid()
  );
$$;

-- Policy: Businesses
CREATE POLICY "Users can view businesses they belong to"
    ON public.businesses FOR SELECT
    USING (public.is_business_member(id));

CREATE POLICY "Owners can update their business"
    ON public.businesses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.business_members
            WHERE business_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Policy: Customers
CREATE POLICY "Tenants can manage their own customers"
    ON public.customers FOR ALL
    USING (public.is_business_member(business_id));

-- Policy: Receipts
CREATE POLICY "Tenants can manage their own receipts"
    ON public.receipts FOR ALL
    USING (public.is_business_member(business_id));

-- Policy: Public access to single receipt by public_token (for verification & sharing)
CREATE POLICY "Public can view receipt via token"
    ON public.receipts FOR SELECT
    USING (public_token IS NOT NULL);

-- Policy: Receipt Items
CREATE POLICY "Tenants can view and manage their receipt items"
    ON public.receipt_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.receipts r
            WHERE r.id = receipt_items.receipt_id
            AND (public.is_business_member(r.business_id) OR r.public_token IS NOT NULL)
        )
    );
