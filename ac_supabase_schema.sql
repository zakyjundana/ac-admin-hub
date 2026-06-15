-- Script Migrasi SQL Supabase untuk CoolService (Prefix: ac_)
-- Salin dan tempel (copy-paste) skrip ini ke bagian SQL Editor di dashboard Supabase Anda.

-- 1. Tabel Teknisi (ac_teknisi)
CREATE TABLE IF NOT EXISTS public.ac_teknisi (
    id TEXT PRIMARY KEY DEFAULT 't' || md5(random()::text || clock_timestamp()::text),
    user_id TEXT NOT NULL,
    nama TEXT NOT NULL,
    no_hp TEXT NOT NULL,
    wilayah TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ac_teknisi_user ON public.ac_teknisi(user_id);

-- 2. Tabel Spare Part (ac_spareparts)
CREATE TABLE IF NOT EXISTS public.ac_spareparts (
    id TEXT PRIMARY KEY DEFAULT 'sp' || md5(random()::text || clock_timestamp()::text),
    user_id TEXT NOT NULL,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    satuan TEXT NOT NULL,
    stok INTEGER NOT NULL DEFAULT 0,
    stok_minimum INTEGER NOT NULL DEFAULT 0,
    harga NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ac_spareparts_user ON public.ac_spareparts(user_id);

-- 3. Tabel Orderan (ac_orderan)
CREATE TABLE IF NOT EXISTS public.ac_orderan (
    id TEXT PRIMARY KEY DEFAULT 'o' || md5(random()::text || clock_timestamp()::text),
    user_id TEXT NOT NULL,
    nama_pelanggan TEXT NOT NULL,
    no_wa TEXT NOT NULL,
    alamat TEXT NOT NULL,
    wilayah TEXT NOT NULL,
    keluhan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Belum Selesai' CHECK (status IN ('Belum Selesai', 'Dalam Pengerjaan', 'Selesai')),
    teknisi_id TEXT REFERENCES public.ac_teknisi(id) ON DELETE SET NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam TEXT NOT NULL DEFAULT '09:00',
    garansi_hari INTEGER DEFAULT 30,
    spare_parts JSONB DEFAULT '[]'::jsonb, -- Menyimpan data sparepart terpakai [{sparepart_id, qty}]
    sumber TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ac_orderan_user ON public.ac_orderan(user_id);

-- 4. Tabel Riwayat Kerusakan (ac_riwayat)
CREATE TABLE IF NOT EXISTS public.ac_riwayat (
    id TEXT PRIMARY KEY DEFAULT 'r' || md5(random()::text || clock_timestamp()::text),
    user_id TEXT NOT NULL,
    orderan_id TEXT NOT NULL DEFAULT '-',
    nama_pelanggan TEXT NOT NULL,
    no_wa TEXT NOT NULL,
    alamat TEXT NOT NULL,
    jenis_kerusakan TEXT NOT NULL,
    tindakan TEXT NOT NULL DEFAULT '—',
    teknisi_id TEXT REFERENCES public.ac_teknisi(id) ON DELETE SET NULL,
    tanggal_selesai DATE NOT NULL DEFAULT CURRENT_DATE,
    garansi_hari INTEGER NOT NULL DEFAULT 30,
    biaya NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ac_riwayat_user ON public.ac_riwayat(user_id);

-- 5. Tabel Rating & Feedback (ac_feedback)
CREATE TABLE IF NOT EXISTS public.ac_feedback (
    id TEXT PRIMARY KEY DEFAULT 'f' || md5(random()::text || clock_timestamp()::text),
    user_id TEXT NOT NULL,
    orderan_id TEXT NOT NULL DEFAULT '-',
    teknisi_id TEXT REFERENCES public.ac_teknisi(id) ON DELETE SET NULL,
    nama_pelanggan TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    ulasan TEXT NOT NULL DEFAULT '',
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    is_komplain BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ac_feedback_user ON public.ac_feedback(user_id);

-- RLS (Row Level Security) - Security Hardened
-- Enable RLS on all business data tables
ALTER TABLE public.ac_teknisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_orderan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_riwayat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_feedback ENABLE ROW LEVEL SECURITY;

-- 1. Policies for ac_teknisi
DROP POLICY IF EXISTS "Manage own teknisi" ON public.ac_teknisi;
CREATE POLICY "Manage own teknisi" ON public.ac_teknisi 
    FOR ALL USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- 2. Policies for ac_spareparts
DROP POLICY IF EXISTS "Manage own spareparts" ON public.ac_spareparts;
CREATE POLICY "Manage own spareparts" ON public.ac_spareparts 
    FOR ALL USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- 3. Policies for ac_orderan
DROP POLICY IF EXISTS "Manage own orderan" ON public.ac_orderan;
CREATE POLICY "Manage own orderan" ON public.ac_orderan 
    FOR ALL USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Allow public anonymous clients (online booking customer page) to insert orderans
DROP POLICY IF EXISTS "Allow public booking insert" ON public.ac_orderan;
CREATE POLICY "Allow public booking insert" ON public.ac_orderan 
    FOR INSERT WITH CHECK (true);

-- 4. Policies for ac_riwayat
DROP POLICY IF EXISTS "Manage own riwayat" ON public.ac_riwayat;
CREATE POLICY "Manage own riwayat" ON public.ac_riwayat 
    FOR ALL USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- 5. Policies for ac_feedback
DROP POLICY IF EXISTS "Manage own feedback" ON public.ac_feedback;
CREATE POLICY "Manage own feedback" ON public.ac_feedback 
    FOR ALL USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- 6. Tabel Pengeluaran Operasional (ac_pengeluaran)
CREATE TABLE IF NOT EXISTS public.ac_pengeluaran (
    id TEXT PRIMARY KEY DEFAULT 'ex' || md5(random()::text || clock_timestamp()::text),
    user_id TEXT NOT NULL,
    kategori TEXT NOT NULL, -- 'Transport & Bensin', 'Sewa Kantor', 'Listrik & Internet', 'Lain-lain'
    jumlah NUMERIC NOT NULL DEFAULT 0,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    keterangan TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ac_pengeluaran_user ON public.ac_pengeluaran(user_id);

ALTER TABLE public.ac_pengeluaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own pengeluaran" ON public.ac_pengeluaran;
CREATE POLICY "Manage own pengeluaran" ON public.ac_pengeluaran 
    FOR ALL USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

