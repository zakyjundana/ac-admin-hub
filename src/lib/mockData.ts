// Mock data simulating future Supabase tables.
// Replace these with real Supabase queries once Lovable Cloud is enabled.

export type StatusOrder = "Belum Selesai" | "Dalam Pengerjaan" | "Selesai";

export interface Teknisi {
  id: string;
  nama: string;
  no_hp: string;
  wilayah: string; // zoning
}

export interface Orderan {
  id: string;
  nama_pelanggan: string;
  no_wa: string;
  alamat: string;
  wilayah: string;
  keluhan: string;
  status: StatusOrder;
  teknisi_id: string | null;
  tanggal: string; // ISO yyyy-mm-dd
  jam: string; // HH:mm
  garansi_hari?: number; // masa garansi setelah selesai (default 30)
  spare_parts?: { sparepart_id: string; qty: number }[];
  sumber?: "Admin" | "Mandiri"; // Asal pemesanan
}

// ===== Fase 2: Spare Parts =====
export interface SparePart {
  id: string;
  nama: string;
  kategori: string; // contoh: Freon, Filter, Kapasitor, dll
  satuan: string;   // pcs, kg, meter
  stok: number;
  stok_minimum: number;
  harga: number;
}

// ===== Fase 2: Riwayat Kerusakan AC per pelanggan =====
export interface RiwayatKerusakan {
  id: string;
  orderan_id: string;       // referensi ke Orderan
  nama_pelanggan: string;
  no_wa: string;
  alamat: string;
  jenis_kerusakan: string;
  tindakan: string;
  teknisi_id: string | null;
  tanggal_selesai: string;  // ISO yyyy-mm-dd
  garansi_hari: number;     // 30/60/90 hari
  biaya: number;
}

export const WILAYAH_LIST = [
  "Jakarta Pusat",
  "Jakarta Selatan",
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Utara",
  "Tangerang",
  "Bekasi",
  "Depok",
];

export const STATUS_LIST: StatusOrder[] = [
  "Belum Selesai",
  "Dalam Pengerjaan",
  "Selesai",
];

export const KATEGORI_SPAREPART = [
  "Freon",
  "Filter",
  "Kapasitor",
  "Kompresor",
  "Pipa",
  "Remote",
  "PCB",
  "Lainnya",
];

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const initialTeknisi: Teknisi[] = [
  { id: "t1", nama: "Budi Santoso", no_hp: "081234567890", wilayah: "Jakarta Selatan" },
  { id: "t2", nama: "Agus Pratama", no_hp: "082345678901", wilayah: "Jakarta Pusat" },
  { id: "t3", nama: "Rian Hidayat", no_hp: "083456789012", wilayah: "Jakarta Barat" },
  { id: "t4", nama: "Dedi Kurniawan", no_hp: "084567890123", wilayah: "Bekasi" },
  { id: "t5", nama: "Fajar Nugroho", no_hp: "085678901234", wilayah: "Tangerang" },
];

export const initialOrderan: Orderan[] = [
  {
    id: "o1",
    nama_pelanggan: "Ibu Sari",
    no_wa: "081111222333",
    alamat: "Jl. Melati No. 12, Kebayoran Baru",
    wilayah: "Jakarta Selatan",
    keluhan: "AC tidak dingin, perlu cuci AC",
    status: "Dalam Pengerjaan",
    teknisi_id: "t1",
    tanggal: addDays(0),
    jam: "09:00",
    garansi_hari: 30,
  },
  {
    id: "o2",
    nama_pelanggan: "Bapak Andi",
    no_wa: "081222333444",
    alamat: "Jl. Mawar Blok C5, Menteng",
    wilayah: "Jakarta Pusat",
    keluhan: "AC bocor, air menetes",
    status: "Belum Selesai",
    teknisi_id: null,
    tanggal: addDays(0),
    jam: "13:00",
    garansi_hari: 30,
  },
  {
    id: "o3",
    nama_pelanggan: "Ibu Linda",
    no_wa: "081333444555",
    alamat: "Jl. Kenanga No. 7, Bekasi Timur",
    wilayah: "Bekasi",
    keluhan: "Pasang AC baru 1 PK",
    status: "Selesai",
    teknisi_id: "t4",
    tanggal: addDays(-1),
    jam: "10:30",
    garansi_hari: 90,
  },
  {
    id: "o4",
    nama_pelanggan: "Bapak Hadi",
    no_wa: "081444555666",
    alamat: "Jl. Anggrek No. 22, Tangerang",
    wilayah: "Tangerang",
    keluhan: "Service rutin 2 unit AC",
    status: "Belum Selesai",
    teknisi_id: "t5",
    tanggal: addDays(1),
    jam: "11:00",
    garansi_hari: 30,
  },
  {
    id: "o5",
    nama_pelanggan: "Ibu Rina",
    no_wa: "081555666777",
    alamat: "Jl. Cendana No. 9, Kemang",
    wilayah: "Jakarta Selatan",
    keluhan: "AC mati total, perlu pengecekan",
    status: "Belum Selesai",
    teknisi_id: null,
    tanggal: addDays(2),
    jam: "14:00",
    garansi_hari: 30,
  },
  {
    id: "o6",
    nama_pelanggan: "Bapak Eko",
    no_wa: "081666777888",
    alamat: "Jl. Sudirman, Jakarta Pusat",
    wilayah: "Jakarta Pusat",
    keluhan: "Isi freon",
    status: "Dalam Pengerjaan",
    teknisi_id: "t2",
    tanggal: addDays(0),
    jam: "15:30",
    garansi_hari: 30,
  },
];

export const initialSparePart: SparePart[] = [
  { id: "sp1", nama: "Freon R32 (1 kg)", kategori: "Freon", satuan: "kg", stok: 8, stok_minimum: 5, harga: 180000 },
  { id: "sp2", nama: "Freon R410A (1 kg)", kategori: "Freon", satuan: "kg", stok: 3, stok_minimum: 5, harga: 220000 },
  { id: "sp3", nama: "Filter AC Standard", kategori: "Filter", satuan: "pcs", stok: 24, stok_minimum: 10, harga: 35000 },
  { id: "sp4", nama: "Kapasitor 35uF", kategori: "Kapasitor", satuan: "pcs", stok: 6, stok_minimum: 8, harga: 65000 },
  { id: "sp5", nama: "Kapasitor 50uF", kategori: "Kapasitor", satuan: "pcs", stok: 12, stok_minimum: 8, harga: 75000 },
  { id: "sp6", nama: "Pipa Tembaga 1/4\"", kategori: "Pipa", satuan: "meter", stok: 45, stok_minimum: 20, harga: 55000 },
  { id: "sp7", nama: "Remote Universal", kategori: "Remote", satuan: "pcs", stok: 2, stok_minimum: 5, harga: 85000 },
  { id: "sp8", nama: "PCB Indoor 1 PK", kategori: "PCB", satuan: "pcs", stok: 4, stok_minimum: 3, harga: 450000 },
];

export const initialRiwayat: RiwayatKerusakan[] = [
  {
    id: "r1",
    orderan_id: "o3",
    nama_pelanggan: "Ibu Linda",
    no_wa: "081333444555",
    alamat: "Jl. Kenanga No. 7, Bekasi Timur",
    jenis_kerusakan: "Pasang AC baru 1 PK",
    tindakan: "Instalasi unit baru + pipa 3m + bracket",
    teknisi_id: "t4",
    tanggal_selesai: addDays(-1),
    garansi_hari: 90,
    biaya: 850000,
  },
  {
    id: "r2",
    orderan_id: "-",
    nama_pelanggan: "Ibu Sari",
    no_wa: "081111222333",
    alamat: "Jl. Melati No. 12, Kebayoran Baru",
    jenis_kerusakan: "Cuci AC + isi freon",
    tindakan: "Cuci indoor & outdoor, isi freon 0.3 kg R32",
    teknisi_id: "t1",
    tanggal_selesai: addDays(-15),
    garansi_hari: 30,
    biaya: 250000,
  },
  {
    id: "r3",
    orderan_id: "-",
    nama_pelanggan: "Bapak Andi",
    no_wa: "081222333444",
    alamat: "Jl. Mawar Blok C5, Menteng",
    jenis_kerusakan: "Ganti kapasitor",
    tindakan: "Ganti kapasitor 35uF outdoor",
    teknisi_id: "t2",
    tanggal_selesai: addDays(-20),
    garansi_hari: 30,
    biaya: 175000,
  },
  {
    id: "r4",
    orderan_id: "-",
    nama_pelanggan: "Ibu Linda",
    no_wa: "081333444555",
    alamat: "Jl. Kenanga No. 7, Bekasi Timur",
    jenis_kerusakan: "Service rutin",
    tindakan: "Cuci AC + cek tekanan freon",
    teknisi_id: "t4",
    tanggal_selesai: addDays(-120),
    garansi_hari: 30,
    biaya: 150000,
  },
];

// ===== Helper: cek apakah orderan baru masih dalam masa garansi
// berdasarkan riwayat kerusakan pelanggan (no_wa).
export function cekGaransi(
  noWa: string,
  tanggalOrderan: string,
  riwayat: RiwayatKerusakan[],
 ): RiwayatKerusakan | null {
  const tglOrder = new Date(tanggalOrderan);
  const match = riwayat
    .filter((r) => r.no_wa === noWa)
    .map((r) => {
      const selesai = new Date(r.tanggal_selesai);
      const expiry = new Date(selesai);
      expiry.setDate(expiry.getDate() + r.garansi_hari);
      return { r, expiry };
    })
    .filter(({ expiry }) => tglOrder <= expiry)
    .sort((a, b) => b.expiry.getTime() - a.expiry.getTime())[0];
  return match ? match.r : null;
}

// ===== Fase 4: Rating & Feedback =====
export interface Feedback {
  id: string;
  orderan_id: string;
  teknisi_id: string;
  nama_pelanggan: string;
  rating: number; // 1-5
  ulasan: string;
  tanggal: string;
  is_komplain: boolean;
}

export interface BulananFinansial {
  bulan: string; // e.g. "Jan", "Feb", "Mar", "Apr", "Mei"
  pemasukan: number;
  pengeluaran: number;
  keuntungan: number;
}

export const initialFeedback: Feedback[] = [
  { id: "f1", orderan_id: "o3", teknisi_id: "t4", nama_pelanggan: "Ibu Linda", rating: 5, ulasan: "Pemasangan sangat rapi dan teknisi sopan sekali.", tanggal: addDays(-1), is_komplain: false },
  { id: "f2", orderan_id: "r2", teknisi_id: "t1", nama_pelanggan: "Ibu Sari", rating: 4, ulasan: "AC kembali dingin, pengerjaan cukup cepat.", tanggal: addDays(-15), is_komplain: false },
  { id: "f3", orderan_id: "r3", teknisi_id: "t2", nama_pelanggan: "Bapak Andi", rating: 2, ulasan: "Kapasitor diganti, tapi teknisi datang terlambat dari jadwal.", tanggal: addDays(-20), is_komplain: true },
  { id: "f4", orderan_id: "r4", teknisi_id: "t4", nama_pelanggan: "Ibu Linda", rating: 5, ulasan: "Pelayanan memuaskan, sangat merekomendasikan Rian.", tanggal: addDays(-120), is_komplain: false },
  { id: "f5", orderan_id: "-", teknisi_id: "t3", nama_pelanggan: "Bapak Budi", rating: 5, ulasan: "Kerja bagus, cepat selesai.", tanggal: addDays(-5), is_komplain: false },
  { id: "f6", orderan_id: "-", teknisi_id: "t1", nama_pelanggan: "Ibu Dian", rating: 3, ulasan: "AC dingin tapi ada tetesan sedikit di luar.", tanggal: addDays(-7), is_komplain: true },
  { id: "f7", orderan_id: "-", teknisi_id: "t5", nama_pelanggan: "Bapak Joko", rating: 5, ulasan: "Sangat profesional, menjelaskan detail masalahnya.", tanggal: addDays(-3), is_komplain: false }
];

export const dataKeuanganHistoris: BulananFinansial[] = [
  { bulan: "Jan", pemasukan: 12500000, pengeluaran: 9200000, keuntungan: 3300000 },
  { bulan: "Feb", pemasukan: 14200000, pengeluaran: 9500000, keuntungan: 4700000 },
  { bulan: "Mar", pemasukan: 13800000, pengeluaran: 10100000, keuntungan: 3700000 },
  { bulan: "Apr", pemasukan: 15500000, pengeluaran: 9800000, keuntungan: 5700000 },
  { bulan: "Mei", pemasukan: 17200000, pengeluaran: 10400000, keuntungan: 6800000 }
];

