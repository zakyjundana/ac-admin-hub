import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wrench,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { signUp, isSupabaseConfigured } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nama: "",
    email: "",
    noHp: "",
    namaBisnis: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSupabaseConfigured()) {
        await signUp({
          email: form.email,
          password: form.password,
          nama: form.nama,
          namaBisnis: form.namaBisnis,
          noHp: form.noHp,
        });
        setSuccess(true);
        // Lanjut onboarding setelah 1.5 detik
        setTimeout(() => (window.location.href = "/onboarding"), 1500);
      } else {
        // Mode demo — langsung ke onboarding
        setTimeout(() => (window.location.href = "/onboarding"), 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      if (msg.includes("already registered")) {
        setError("Email ini sudah terdaftar. Silakan masuk.");
      } else if (msg.includes("invalid email")) {
        setError("Format email tidak valid.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Akun Berhasil Dibuat!</h2>
          <p className="text-gray-400 text-sm">Mengarahkan ke halaman setup bisnis Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden border-r border-white/5 p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-[#0a0a0f] to-cyan-950/40 pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">CoolService</span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-snug mb-8">
            Kelola usaha AC Anda{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              lebih profesional
            </span>{" "}
            mulai sekarang
          </h2>
          <ul className="space-y-4">
            {[
              "Jadwal teknisi & notifikasi WA otomatis",
              "Stok spare part terpantau real-time",
              "Laporan keuangan bulanan langsung jadi",
              "Gratis selamanya untuk 1 teknisi",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-gray-300 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-gray-600">
          © 2026 CoolService. Dibuat untuk tukang AC Indonesia.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/landing" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CoolService</span>
          </Link>

          <h1 className="text-2xl font-bold mb-1">Buat Akun Gratis</h1>
          <p className="text-gray-400 text-sm mb-8">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Masuk di sini
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-nama"
                  name="nama"
                  type="text"
                  required
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Budi Santoso"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
                />
              </div>
            </div>

            {/* Nama Bisnis */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Usaha Servis AC</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-bisnis"
                  name="namaBisnis"
                  type="text"
                  required
                  value={form.namaBisnis}
                  onChange={handleChange}
                  placeholder="Servis AC Sejahtera"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
                />
              </div>
            </div>

            {/* No HP */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-nohp"
                  name="noHp"
                  type="tel"
                  required
                  value={form.noHp}
                  onChange={handleChange}
                  placeholder="08123456789"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="budi@email.com"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
                />
              </div>
            </div>

            {/* Password strength indicator */}
            {form.password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        form.password.length >= level * 2
                          ? level <= 1 ? "bg-red-500"
                          : level <= 2 ? "bg-orange-500"
                          : level <= 3 ? "bg-yellow-500"
                          : "bg-green-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {form.password.length < 4 ? "Terlalu lemah" :
                   form.password.length < 6 ? "Lemah" :
                   form.password.length < 8 ? "Cukup" : "Kuat ✓"}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              id="btn-register"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.01] mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Membuat akun...
                </>
              ) : (
                <>
                  Buat Akun & Lanjutkan
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-600 pt-1">
              Dengan mendaftar, Anda menyetujui{" "}
              <a href="#" className="text-blue-500 hover:underline">Syarat & Ketentuan</a>{" "}
              dan{" "}
              <a href="#" className="text-blue-500 hover:underline">Kebijakan Privasi</a> kami.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
