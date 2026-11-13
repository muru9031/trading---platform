-- Migration: Create portfolios and paper_trades tables with open RLS policies
-- Run this in your Supabase SQL Editor if you wish to initialize the database tables directly.

-- 1. Create portfolios table for storing user capital balances
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    capital_inr NUMERIC DEFAULT 0,
    capital_usd NUMERIC DEFAULT 0,
    monthly_deposits JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and permissive policies
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for portfolios" ON public.portfolios;
CREATE POLICY "Enable all access for portfolios" ON public.portfolios
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Create paper_trades table for storing simulator orders
CREATE TABLE IF NOT EXISTS public.paper_trades (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    ticker TEXT NOT NULL,
    type TEXT NOT NULL,
    exec_type TEXT DEFAULT 'MARKET',
    qty NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    exit_price NUMERIC,
    sl NUMERIC,
    tp NUMERIC,
    status TEXT DEFAULT 'OPEN',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    gross_pnl NUMERIC,
    brokerage NUMERIC DEFAULT 0,
    pnl NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and permissive policies
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for paper_trades" ON public.paper_trades;
CREATE POLICY "Enable all access for paper_trades" ON public.paper_trades
    FOR ALL
    USING (true)
    WITH CHECK (true);
