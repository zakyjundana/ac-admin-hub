import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wrench,
  Building2,
  MapPin,
  Phone,
  Users,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Teknisi = { nama: string; noHp: string; wilayah: string };

const WILAYAH_OPTIONS = [
  "Jakarta Utara",
  "Jakarta Selatan",
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Pusat",
  "Bekasi",
  "Depok",
  "Tangerang",
  "Tangerang Selatan",
  "Bogor",
  "Lainnya",
];

const steps = [
  { id: 1, label: "Profil Bisnis" },
  { id: 2, label: "Tambah Teknisi" },
  { id: 3, label: "Selesai" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [bisnis, setBisnis] = useState({
    nama: "",
    alamat: "",
    kota: "",
    noHp: "",
  });
  const [teknisiList, setTeknisiList] = useState<Teknisi[]>([
    { nama: "", noHp: "", wilayah: "" },
  ]);

  function handleBisnisChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBisnis((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleTeknisiChange(
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setTeknisiList((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [e.target.name]: e.target.value } : t))
    );
  }

  function addTeknisi() {
    setTeknisiList((prev) => [...prev, { nama: "", noHp: "", wilayah: "" }]);
  }

  function removeTeknisi(idx: number) {
    if (teknisiList.length === 1) return;
    setTeknisiList((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleFinish() {
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <Link to="/landing" className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl">CoolService</span>
      </Link>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id
                    ? "bg-green-500 text-white"
                    : step === s.id
                    ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white"
                    : "bg-white/10 text-gray-500"
                }`}
              >
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  step === s.id ? "text-white font-medium" : "text-gray-500"
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-10 sm:w-16 h-px mx-1 transition-all ${
                  step > s.id ? "bg-green-500" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg">
        {/* STEP 1 — Profil Bisnis */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold mb-1">Profil Usaha Anda</h1>
              <p className="text-sm text-gray-400">
                Data ini akan ditampilkan kepada pelanggan dan digunakan untuk
                laporan.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nama Usaha Servis AC
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="ob-nama-bisnis"
                    name="nama"
                    type="text"
                    required
                    value={bisnis.nama}
                    onChange={handleBisnisChange}
                    placeholder="Servis AC Sejahtera"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Alamat Lengkap
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="ob-alamat"
                    name="alamat"
                    type="text"
                    required
                    value={bisnis.alamat}
                    onChange={handleBisnisChange}
                    placeholder="Jl. Raya No. 123, Bekasi Timur"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Kota
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="ob-kota"
                    name="kota"
                    type="text"
                    required
                    value={bisnis.kota}
                    onChange={handleBisnisChange}
                    placeholder="Bekasi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nomor WhatsApp Bisnis
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="ob-nohp-bisnis"
                    name="noHp"
                    type="tel"
                    required
                    value={bisnis.noHp}
                    onChange={handleBisnisChange}
                    placeholder="08123456789"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-next-step1"
              onClick={() => setStep(2)}
              disabled={!bisnis.nama || !bisnis.alamat || !bisnis.kota || !bisnis.noHp}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.01]"
            >
              Lanjut — Tambah Teknisi
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2 — Tambah Teknisi */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold mb-1">Daftarkan Teknisi Anda</h1>
              <p className="text-sm text-gray-400">
                Tambahkan teknisi yang bekerja di usaha Anda. Bisa ditambah lagi
                nanti di menu Teknisi.
              </p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {teknisiList.map((tek, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">
                      Teknisi #{idx + 1}
                    </span>
                    {teknisiList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTeknisi(idx)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    name="nama"
                    type="text"
                    required
                    value={tek.nama}
                    onChange={(e) => handleTeknisiChange(idx, e)}
                    placeholder="Nama teknisi"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  <input
                    name="noHp"
                    type="tel"
                    required
                    value={tek.noHp}
                    onChange={(e) => handleTeknisiChange(idx, e)}
                    placeholder="Nomor WhatsApp teknisi"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  <select
                    name="wilayah"
                    required
                    value={tek.wilayah}
                    onChange={(e) => handleTeknisiChange(idx, e)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  >
                    <option value="" disabled>
                      Pilih wilayah tugas
                    </option>
                    {WILAYAH_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTeknisi}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 py-2.5 rounded-xl border border-dashed border-blue-500/30 hover:border-blue-500/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Teknisi Lain
            </button>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-400 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                id="btn-next-step2"
                onClick={() => setStep(3)}
                disabled={teknisiList.some(
                  (t) => !t.nama || !t.noHp || !t.wilayah
                )}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.01] text-sm"
              >
                Simpan & Lanjutkan
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Selesai */}
        {step === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            {/* Animated checkmark */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Semuanya Siap! 🎉</h1>
            <p className="text-gray-400 text-sm mb-2">
              Usaha Anda berhasil terdaftar di CoolService.
            </p>
            <p className="text-gray-500 text-xs mb-8">
              Dashboard sudah siap — mulai input orderan pertama Anda sekarang.
            </p>

            {/* Summary */}
            <div className="text-left p-4 rounded-xl bg-white/5 border border-white/10 mb-8 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-400">Usaha:</span>
                <span className="font-medium text-white">{bisnis.nama || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-400">Kota:</span>
                <span className="font-medium text-white">{bisnis.kota || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-400">Teknisi terdaftar:</span>
                <span className="font-medium text-white">
                  {teknisiList.filter((t) => t.nama).length} orang
                </span>
              </div>
            </div>

            <button
              id="btn-go-dashboard"
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Buka Dashboard Sekarang
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-gray-600">
        Butuh bantuan? Hubungi kami via{" "}
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          WhatsApp Support
        </a>
      </p>
    </div>
  );
}
