-- ==============================================================================
-- SlipDo — SaaS Digital Receipts & Voucher Platform
-- Production Supabase Database Migration & Schema Optimization
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Profiles Table (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'pro' NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    business_name TEXT,
    business_category TEXT DEFAULT 'General Retail & Services',
    settings JSONB DEFAULT '{"thermalPaperSize": "58mm", "autoSms": false, "requirePin": false}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Businesses / Outlets Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General Retail & Services' NOT NULL,
    address TEXT DEFAULT 'Dhaka, Bangladesh',
    phone TEXT,
    bin TEXT,
    trade_license TEXT,
    currency TEXT DEFAULT 'BDT' NOT NULL,
    currency_symbol TEXT DEFAULT '৳' NOT NULL,
    is_default BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. Customers Table (Merchant CRM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    total_spent NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    total_receipts INT DEFAULT 0 NOT NULL,
    last_visit TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. Receipts Table (Core Voucher Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    receipt_number TEXT NOT NULL,
    merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT DEFAULT 'Walk-in Customer' NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    subtotal NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    discount_amount NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    paid_amount NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    change_due NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    payment_method TEXT DEFAULT 'Cash' NOT NULL,
    payment_status TEXT DEFAULT 'Paid' NOT NULL,
    template_name TEXT DEFAULT 'Modern Emerald' NOT NULL,
    notes TEXT,
    issued_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_merchant ON public.businesses(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customers_merchant ON public.customers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(merchant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_spent ON public.customers(merchant_id, total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_merchant ON public.receipts(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_token ON public.receipts(token);
CREATE INDEX IF NOT EXISTS idx_receipts_business ON public.receipts(business_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(merchant_id, payment_status);

-- ==============================================================================
-- 7. Automated Timestamps Trigger Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_receipts_updated_at ON public.receipts;
CREATE TRIGGER set_receipts_updated_at
    BEFORE UPDATE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. Automated User Onboarding Trigger (Creates Profile & Default Store)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    biz_name TEXT;
    biz_cat TEXT;
    user_phone TEXT;
    new_biz_id TEXT;
BEGIN
    biz_name := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Store');
    biz_cat := COALESCE(NEW.raw_user_meta_data->>'category', 'General Retail & Services');
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
    new_biz_id := 'biz_' || substr(md5(NEW.id::text || now()::text), 1, 12);

    -- 1. Create Profile
    INSERT INTO public.profiles (id, phone, full_name, tier, business_name, business_category)
    VALUES (
        NEW.id,
        user_phone,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Merchant Owner'),
        'pro',
        biz_name,
        biz_cat
    )
    ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_category = EXCLUDED.business_category,
        updated_at = timezone('utc'::text, now());

    -- 2. Create Default Business Storefront
    INSERT INTO public.businesses (id, merchant_id, name, category, address, phone, is_default)
    VALUES (
        new_biz_id,
        NEW.id,
        biz_name,
        biz_cat,
        COALESCE(NEW.raw_user_meta_data->>'address', 'Dhaka, Bangladesh'),
        user_phone,
        TRUE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. Automatic Customer CRM Sync Trigger (When receipts are issued)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_customer_on_receipt()
RETURNS TRIGGER AS $$
DECLARE
    cust_id UUID;
BEGIN
    IF NEW.customer_phone IS NOT NULL AND NEW.customer_phone <> '' THEN
        -- Check if customer already exists for this merchant
        SELECT id INTO cust_id
        FROM public.customers
        WHERE merchant_id = NEW.merchant_id AND phone = NEW.customer_phone
        LIMIT 1;

        IF cust_id IS NOT NULL THEN
            UPDATE public.customers
            SET total_spent = total_spent + NEW.total_amount,
                total_receipts = total_receipts + 1,
                last_visit = NEW.issued_at,
                name = CASE WHEN (name = 'Walk-in Customer' OR name = '') AND NEW.customer_name <> '' THEN NEW.customer_name ELSE name END,
                updated_at = timezone('utc'::text, now())
            WHERE id = cust_id;

            -- Link receipt to customer
            IF NEW.customer_id IS NULL THEN
                NEW.customer_id := cust_id;
            END IF;
        ELSE
            INSERT INTO public.customers (merchant_id, business_id, name, phone, email, total_spent, total_receipts, last_visit)
            VALUES (
                NEW.merchant_id,
                NEW.business_id,
                COALESCE(NULLIF(NEW.customer_name, ''), 'Customer (' || NEW.customer_phone || ')'),
                NEW.customer_phone,
                NEW.customer_email,
                NEW.total_amount,
                1,
                NEW.issued_at
            )
            RETURNING id INTO cust_id;

            IF NEW.customer_id IS NULL THEN
                NEW.customer_id := cust_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_receipt_insert_sync_customer ON public.receipts;
CREATE TRIGGER before_receipt_insert_sync_customer
    BEFORE INSERT ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.sync_customer_on_receipt();

-- ==============================================================================
-- 10. Enable Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Merchants can view own profile" ON public.profiles;
CREATE POLICY "Merchants can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Merchants can update own profile" ON public.profiles;
CREATE POLICY "Merchants can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Merchants can insert own profile" ON public.profiles;
CREATE POLICY "Merchants can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Businesses Policies
DROP POLICY IF EXISTS "Merchants can view own businesses" ON public.businesses;
CREATE POLICY "Merchants can view own businesses"
    ON public.businesses FOR SELECT
    TO authenticated
    USING (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can insert own businesses" ON public.businesses;
CREATE POLICY "Merchants can insert own businesses"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can update own businesses" ON public.businesses;
CREATE POLICY "Merchants can update own businesses"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can delete own businesses" ON public.businesses;
CREATE POLICY "Merchants can delete own businesses"
    ON public.businesses FOR DELETE
    TO authenticated
    USING (merchant_id = auth.uid());

-- Customers Policies
DROP POLICY IF EXISTS "Merchants can view own customers" ON public.customers;
CREATE POLICY "Merchants can view own customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can insert own customers" ON public.customers;
CREATE POLICY "Merchants can insert own customers"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can update own customers" ON public.customers;
CREATE POLICY "Merchants can update own customers"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can delete own customers" ON public.customers;
CREATE POLICY "Merchants can delete own customers"
    ON public.customers FOR DELETE
    TO authenticated
    USING (merchant_id = auth.uid());

-- Receipts Policies
DROP POLICY IF EXISTS "Merchants can view own receipts" ON public.receipts;
CREATE POLICY "Merchants can view own receipts"
    ON public.receipts FOR SELECT
    TO authenticated
    USING (merchant_id = auth.uid());

-- CRITICAL: Public / Anon can view receipts by token for customer digital receipt sharing (/r/[token])
DROP POLICY IF EXISTS "Public can view receipt by token" ON public.receipts;
CREATE POLICY "Public can view receipt by token"
    ON public.receipts FOR SELECT
    TO anon, authenticated
    USING (token IS NOT NULL);

DROP POLICY IF EXISTS "Merchants can insert own receipts" ON public.receipts;
CREATE POLICY "Merchants can insert own receipts"
    ON public.receipts FOR INSERT
    TO authenticated
    WITH CHECK (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can update own receipts" ON public.receipts;
CREATE POLICY "Merchants can update own receipts"
    ON public.receipts FOR UPDATE
    TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can delete own receipts" ON public.receipts;
CREATE POLICY "Merchants can delete own receipts"
    ON public.receipts FOR DELETE
    TO authenticated
    USING (merchant_id = auth.uid());

-- ==============================================================================
-- 11. Storage Setup for Digital Receipts & Store Logos
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    TRUE,
    10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 10485760;

DROP POLICY IF EXISTS "Public read receipt assets" ON storage.objects;
CREATE POLICY "Public read receipt assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Authenticated merchants upload receipt assets" ON storage.objects;
CREATE POLICY "Authenticated merchants upload receipt assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Merchants update own receipt assets" ON storage.objects;
CREATE POLICY "Merchants update own receipt assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);
