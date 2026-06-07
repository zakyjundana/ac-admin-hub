-- Script Migrasi SQL Supabase untuk CoolService (Prefix: ac_)
-- Salin dan tempel (copy-paste) skrip ini ke bagian SQL Editor di dashboard Supabase Anda.

-- 1. Tabel Teknisi (ac_teknisi)
CREATE TABLE IF NOT EXISTS public.ac_teknisi (
    id TEXT PRIMARY KEY DEFAULT 't' || md5(random()::text || clock_timestamp()::text),
    nama TEXT NOT NULL,
    no_hp TEXT NOT NULL,
    wilayah TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Spare Part (ac_spareparts)
CREATE TABLE IF NOT EXISTS public.ac_spareparts (
    id TEXT PRIMARY KEY DEFAULT 'sp' || md5(random()::text || clock_timestamp()::text),
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    satuan TEXT NOT NULL,
    stok INTEGER NOT NULL DEFAULT 0,
    stok_minimum INTEGER NOT NULL DEFAULT 0,
    harga NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Orderan (ac_orderan)
CREATE TABLE IF NOT EXISTS public.ac_orderan (
    id TEXT PRIMARY KEY DEFAULT 'o' || md5(random()::text || clock_timestamp()::text),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Riwayat Kerusakan (ac_riwayat)
CREATE TABLE IF NOT EXISTS public.ac_riwayat (
    id TEXT PRIMARY KEY DEFAULT 'r' || md5(random()::text || clock_timestamp()::text),
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

-- 5. Tabel Rating & Feedback (ac_feedback)
CREATE TABLE IF NOT EXISTS public.ac_feedback (
    id TEXT PRIMARY KEY DEFAULT 'f' || md5(random()::text || clock_timestamp()::text),
    orderan_id TEXT NOT NULL DEFAULT '-',
    teknisi_id TEXT REFERENCES public.ac_teknisi(id) ON DELETE SET NULL,
    nama_pelanggan TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    ulasan TEXT NOT NULL DEFAULT '',
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    is_komplain BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Opsional
-- Untuk kemudahan awal demo, Anda bisa mengaktifkan atau menonaktifkan RLS.
-- Berikut adalah perintah untuk menonaktifkan RLS agar dapat dibaca/tulis secara publik (Anon Key):
ALTER TABLE public.ac_teknisi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_spareparts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_orderan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_riwayat DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_feedback DISABLE ROW LEVEL SECURITY;

-- Masukkan data awal (Dummy data agar Supabase tidak kosong)
INSERT INTO public.ac_teknisi (id, nama, no_hp, wilayah) VALUES
('t1', 'Budi Santoso', '081234567890', 'Jakarta Selatan'),
('t2', 'Agus Pratama', '082345678901', 'Jakarta Pusat'),
('t3', 'Rian Hidayat', '083456789012', 'Jakarta Barat'),
('t4', 'Dedi Kurniawan', '084567890123', 'Bekasi'),
('t5', 'Fajar Nugroho', '085678901234', 'Tangerang')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ac_spareparts (id, nama, kategori, satuan, stok, stok_minimum, harga) VALUES
('sp1', 'Freon R32 (1 kg)', 'Freon', 'kg', 8, 5, 180000),
('sp2', 'Freon R410A (1 kg)', 'Freon', 'kg', 3, 5, 220000),
('sp3', 'Filter AC Standard', 'Filter', 'pcs', 24, 10, 35000),
('sp4', 'Kapasitor 35uF', 'Kapasitor', 'pcs', 6, 8, 65000),
('sp5', 'Kapasitor 50uF', 'Kapasitor', 'pcs', 12, 8, 75000),
('sp6', 'Pipa Tembaga 1/4"', 'Pipa', 'meter', 45, 20, 55000),
('sp7', 'Remote Universal', 'Remote', 'pcs', 2, 5, 85000),
('sp8', 'PCB Indoor 1 PK', 'PCB', 'pcs', 4, 3, 450000)
ON CONFLICT (id) DO NOTHING;
