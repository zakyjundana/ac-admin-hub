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

-- RLS (Row Level Security) - Opsional
-- Untuk kemudahan awal demo, Anda bisa mengaktifkan atau menonaktifkan RLS.
-- Berikut adalah perintah untuk menonaktifkan RLS agar dapat dibaca/tulis secara publik (Anon Key):
ALTER TABLE public.ac_teknisi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_spareparts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_orderan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_riwayat DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_feedback DISABLE ROW LEVEL SECURITY;
