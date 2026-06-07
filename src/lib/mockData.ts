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
  },
];
